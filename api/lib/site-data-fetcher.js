/**
 * site-data-fetcher.js — Fetch geospatial site data from free APIs
 *
 * All APIs are free, require no API keys, and no credit cards.
 * Adapted from permaculture-app for Vercel serverless.
 */

const USER_AGENT = 'VibeZapLandDesign/1.0 (site-analysis-tool)';

// ─── Geocoding (Nominatim / OpenStreetMap) ───────────────────────────

export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Geocoding failed for: ${address}`);
  const result = data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
    country: result.address?.country || '',
    countryCode: result.address?.country_code || '',
    state: result.address?.state || '',
    city: result.address?.city || result.address?.town || result.address?.village || ''
  };
}

// ─── Elevation + Slope (Open-Meteo) ─────────────────────────────────

async function fetchElevationAndSlope(lat, lng) {
  const offset = 0.00081;
  const lngOffset = offset / Math.cos(lat * Math.PI / 180);

  const lats = [lat, lat + offset, lat - offset, lat, lat].join(',');
  const lngs = [lng, lng, lng, lng + lngOffset, lng - lngOffset].join(',');

  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;
  const res = await fetch(url);
  const data = await res.json();
  const elev = data.elevation;

  const dzdx = (elev[3] - elev[4]) / (2 * 90);
  const dzdy = (elev[1] - elev[2]) / (2 * 90);
  const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
  const slopePct = Math.tan(slopeRad) * 100;

  let aspectDeg = Math.atan2(-dzdx, dzdy) * (180 / Math.PI);
  if (aspectDeg < 0) aspectDeg += 360;

  const aspectLabel = degToCompass(aspectDeg);
  const slopeCategory = slopePct < 2 ? 'flat' : slopePct < 8 ? 'gentle' : slopePct < 15 ? 'moderate' : 'steep';

  return {
    elevation: Math.round(elev[0]),
    slopePercent: Math.round(slopePct * 10) / 10,
    slopeCategory,
    aspectDegrees: Math.round(aspectDeg),
    aspectDirection: aspectLabel
  };
}

function degToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── Climate Normals (NASA POWER 30-year climatology) ────────────────

async function fetchClimateNormals(lat, lng) {
  const params = [
    'T2M', 'T2M_MAX', 'T2M_MIN',
    'PRECTOTCORR',
    'RH2M',
    'WS10M', 'WD10M',
    'ALLSKY_SFC_SW_DWN',
    'T2MDEW'
  ].join(',');

  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${params}&community=AG&longitude=${lng}&latitude=${lat}&format=JSON`;
  const res = await fetch(url);
  const data = await res.json();
  const p = data.properties.parameter;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const monthly = months.map((m, i) => ({
    month: m,
    monthIndex: i + 1,
    tempMean: round1(p.T2M[m]),
    tempMax: round1(p.T2M_MAX[m]),
    tempMin: round1(p.T2M_MIN[m]),
    precipitation: round1(p.PRECTOTCORR[m] * daysInMonth(i)),
    humidity: round1(p.RH2M[m]),
    windSpeed: round1(p.WS10M[m]),
    windDirection: Math.round(p.WD10M[m]),
    solarRadiation: round1(p.ALLSKY_SFC_SW_DWN[m]),
    dewPoint: round1(p.T2MDEW[m])
  }));

  const annualRainfall = Math.round(monthly.reduce((sum, m) => sum + m.precipitation, 0));
  const rainfallPattern = classifyRainfallPattern(monthly);

  const windDirs = monthly.map(m => m.windDirection);
  const avgWindDir = Math.round(windDirs.reduce((a, b) => a + b, 0) / windDirs.length);

  return {
    monthly,
    annual: {
      tempMean: round1(p.T2M.ANN),
      tempMax: round1(p.T2M_MAX.ANN),
      tempMin: round1(p.T2M_MIN.ANN),
      rainfall: annualRainfall,
      rainfallPattern,
      humidity: round1(p.RH2M.ANN),
      windSpeed: round1(p.WS10M.ANN),
      windDirection: avgWindDir,
      windDirectionLabel: degToCompass(avgWindDir),
      solarRadiation: round1(p.ALLSKY_SFC_SW_DWN.ANN)
    }
  };
}

function daysInMonth(monthIndex) {
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex];
}

function classifyRainfallPattern(monthly) {
  const winterRain = monthly.slice(0, 3).concat(monthly.slice(9, 12)).reduce((s, m) => s + m.precipitation, 0);
  const summerRain = monthly.slice(3, 9).reduce((s, m) => s + m.precipitation, 0);
  const total = winterRain + summerRain;
  if (total === 0) return 'arid';
  const winterPct = winterRain / total;
  if (winterPct > 0.65) return 'winter-dominant';
  if (winterPct < 0.35) return 'summer-dominant';
  const vals = monthly.map(m => m.precipitation);
  const peaks = vals.filter((v, i) =>
    v > (vals[i - 1] || 0) && v > (vals[i + 1] || 0) && v > total / 12
  );
  if (peaks.length >= 2) return 'bimodal';
  return 'year-round';
}

// ─── Frost Dates (Open-Meteo Historical) ─────────────────────────────

async function fetchFrostData(lat, lng) {
  const year = new Date().getFullYear() - 1;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();

  const times = data.daily.time;
  const mins = data.daily.temperature_2m_min;

  let lastSpringFrost = null;
  let firstAutumnFrost = null;
  let frostDays = 0;

  for (let i = 0; i < times.length; i++) {
    if (mins[i] !== null && mins[i] <= 0) {
      frostDays++;
      const month = parseInt(times[i].split('-')[1]);
      if (month <= 6) lastSpringFrost = times[i];
      if (month >= 7 && !firstAutumnFrost) firstAutumnFrost = times[i];
    }
  }

  let frostFreeDays = 0;
  if (lastSpringFrost && firstAutumnFrost) {
    frostFreeDays = Math.round((new Date(firstAutumnFrost) - new Date(lastSpringFrost)) / (1000 * 60 * 60 * 24));
  } else if (frostDays === 0) {
    frostFreeDays = 365;
  } else if (lastSpringFrost && !firstAutumnFrost) {
    frostFreeDays = Math.round((new Date(`${year}-12-31`) - new Date(lastSpringFrost)) / (1000 * 60 * 60 * 24));
  } else if (!lastSpringFrost && firstAutumnFrost) {
    frostFreeDays = Math.round((new Date(firstAutumnFrost) - new Date(`${year}-01-01`)) / (1000 * 60 * 60 * 24));
  }

  let gdd = 0;
  for (let i = 0; i < mins.length; i++) {
    if (mins[i] !== null) {
      gdd += Math.max(0, mins[i] + 5 - 10);
    }
  }

  const frostRisk = frostDays === 0 ? 'none' : frostDays < 30 ? 'light' : frostDays < 90 ? 'moderate' : 'severe';

  return {
    lastSpringFrost,
    firstAutumnFrost,
    frostFreeDays,
    frostDays,
    frostRisk,
    growingDegreeDays: Math.round(gdd),
    dataYear: year
  };
}

// ─── Köppen Climate Zone ─────────────────────────────────────────────

async function fetchKoppenZone(lat, lng) {
  try {
    const url = `http://climateapi.scottpinkelman.com/api/v1/location/${lat}/${lng}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.return_values?.length > 0) {
      const zone = data.return_values[0];
      return {
        code: zone.koppen_geiger_zone || 'Unknown',
        description: zone.zone_description || '',
        source: 'Climate API'
      };
    }
  } catch (_) {}
  return { code: 'Unknown', description: 'Could not auto-detect', source: 'fallback' };
}

// ─── Soil Data (SoilGrids / ISRIC) ──────────────────────────────────

async function fetchSoilData(lat, lng) {
  const properties = ['phh2o', 'clay', 'sand', 'silt', 'soc', 'cec', 'bdod', 'nitrogen'];
  const depths = ['0-5cm', '5-15cm', '15-30cm'];

  const propsParam = properties.map(p => `property=${p}`).join('&');
  const depthParam = depths.map(d => `depth=${d}`).join('&');

  const [propsRes, classRes] = await Promise.all([
    fetch(`https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&${propsParam}&${depthParam}&value=mean`),
    fetch(`https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lng}&lat=${lat}&number_classes=3`)
  ]);

  const propsData = await propsRes.json();
  const classData = await classRes.json();

  const soilProps = {};
  if (propsData.properties?.layers) {
    for (const layer of propsData.properties.layers) {
      const depthValues = layer.depths.map(d => d.values?.mean).filter(v => v !== null && v !== undefined);
      if (depthValues.length > 0) {
        soilProps[layer.name] = depthValues.reduce((a, b) => a + b, 0) / depthValues.length;
      }
    }
  }

  const ph = soilProps.phh2o ? round1(soilProps.phh2o / 10) : null;
  const clay = soilProps.clay ? round1(soilProps.clay / 10) : null;
  const sand = soilProps.sand ? round1(soilProps.sand / 10) : null;
  const silt = soilProps.silt ? round1(soilProps.silt / 10) : null;
  const organicCarbon = soilProps.soc ? round1(soilProps.soc / 10) : null;
  const cec = soilProps.cec ? round1(soilProps.cec / 10) : null;
  const bulkDensity = soilProps.bdod ? round1(soilProps.bdod / 100) : null;
  const nitrogen = soilProps.nitrogen ? round1(soilProps.nitrogen / 100) : null;

  const textureClass = classifySoilTexture(sand, silt, clay);

  let soilClassification = 'Unknown';
  let classificationProbability = 0;
  if (classData.properties?.layers) {
    const wrb = classData.properties.layers[0];
    if (wrb?.depths?.[0]?.values) {
      const topClass = Object.entries(wrb.depths[0].values).sort((a, b) => b[1] - a[1])[0];
      if (topClass) {
        soilClassification = topClass[0];
        classificationProbability = topClass[1];
      }
    }
  }

  const phCategory = ph === null ? 'unknown' : ph < 6 ? 'acidic' : ph > 7.5 ? 'alkaline' : 'neutral';

  return {
    ph, phCategory, clay, sand, silt, organicCarbon, cec, bulkDensity, nitrogen,
    textureClass, classification: soilClassification, classificationProbability
  };
}

function classifySoilTexture(sand, silt, clay) {
  if (sand === null || silt === null || clay === null) return 'unknown';
  if (clay >= 40) return 'clay';
  if (sand >= 85) return 'sandy';
  if (silt >= 80) return 'silt';
  if (clay >= 27 && sand <= 52) return 'clay loam';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50) return 'loam';
  if (sand >= 52 && clay < 20) return 'sandy loam';
  if (silt >= 50 && clay < 27) return 'silty loam';
  return 'loam';
}

// ─── Master fetch: all APIs in parallel ──────────────────────────────

export async function fetchAllSiteData(lat, lng) {
  const results = await Promise.allSettled([
    fetchElevationAndSlope(lat, lng),
    fetchClimateNormals(lat, lng),
    fetchFrostData(lat, lng),
    fetchKoppenZone(lat, lng),
    fetchSoilData(lat, lng)
  ]);

  const [elevation, climate, frost, koppen, soil] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.error(`[site-data] API call ${i} failed:`, r.reason?.message || r.reason);
    return null;
  });

  return {
    coordinates: { lat, lng },
    elevation, climate, frost, koppen, soil,
    fetchedAt: new Date().toISOString()
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function round1(n) {
  if (n === null || n === undefined || isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}
