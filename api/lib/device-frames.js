import sharp from "sharp";

/**
 * Device configurations for mockup generation.
 * Each device defines viewport size, bezel dimensions, and frame styling.
 */
export const DEVICES = {
  "iphone-15": {
    name: "iPhone 15",
    viewport: { width: 393, height: 852 },
    bezel: { top: 50, bottom: 50, left: 18, right: 18, radius: 48, color: "#1a1a1a" },
    outerRadius: 54,
    notch: true,
  },
  "macbook-pro": {
    name: "MacBook Pro",
    viewport: { width: 1440, height: 900 },
    bezel: { top: 28, bottom: 48, left: 28, right: 28, radius: 10, color: "#c0c0c0" },
    outerRadius: 14,
    chin: true,
  },
  "ipad": {
    name: "iPad",
    viewport: { width: 1024, height: 768 },
    bezel: { top: 36, bottom: 36, left: 36, right: 36, radius: 22, color: "#2a2a2a" },
    outerRadius: 28,
  },
  "android": {
    name: "Android Phone",
    viewport: { width: 412, height: 915 },
    bezel: { top: 32, bottom: 32, left: 12, right: 12, radius: 36, color: "#1a1a1a" },
    outerRadius: 40,
  },
  "desktop": {
    name: "Desktop Monitor",
    viewport: { width: 1920, height: 1080 },
    bezel: { top: 24, bottom: 60, left: 24, right: 24, radius: 6, color: "#222222" },
    outerRadius: 10,
    stand: true,
  },
};

/**
 * Creates a background SVG (solid color or gradient).
 */
function createBackgroundSvg(width, height, background) {
  if (background.type === "gradient") {
    return Buffer.from(`
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${background.from}" />
            <stop offset="100%" style="stop-color:${background.to}" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)" />
      </svg>
    `);
  }
  // Solid color
  const color = typeof background === "string" ? background : background.color || "#ffffff";
  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${color}" />
    </svg>
  `);
}

/**
 * Creates the device frame SVG overlay.
 * The screen area is transparent; the bezel is drawn around it.
 */
function createDeviceFrameSvg(device, frameWidth, frameHeight) {
  const { bezel, outerRadius, notch, chin, stand } = device;
  const screenX = bezel.left;
  const screenY = bezel.top;
  const screenW = device.viewport.width;
  const screenH = device.viewport.height;

  let extraElements = "";

  // iPhone notch (dynamic island)
  if (notch) {
    const notchW = 120;
    const notchH = 28;
    const notchX = screenX + (screenW - notchW) / 2;
    const notchY = bezel.top - 2;
    extraElements += `<rect x="${notchX}" y="${notchY}" width="${notchW}" height="${notchH}" rx="14" fill="${bezel.color}" />`;
  }

  // MacBook chin with hinge line
  if (chin) {
    const chinY = bezel.top + screenH;
    extraElements += `<line x1="${bezel.left}" y1="${chinY}" x2="${frameWidth - bezel.right}" y2="${chinY}" stroke="#999" stroke-width="1" />`;
    // Trackpad hint
    const tpW = 180;
    const tpH = 8;
    const tpX = (frameWidth - tpW) / 2;
    const tpY = chinY + (bezel.bottom - tpH) / 2;
    extraElements += `<rect x="${tpX}" y="${tpY}" width="${tpW}" height="${tpH}" rx="4" fill="#b0b0b0" />`;
  }

  // Desktop monitor stand
  if (stand) {
    const standW = 100;
    const standH = 30;
    const standX = (frameWidth - standW) / 2;
    const standY = frameHeight - standH;
    const baseW = 200;
    const baseH = 10;
    const baseX = (frameWidth - baseW) / 2;
    const baseY = frameHeight - baseH;
    extraElements += `<rect x="${standX}" y="${standY}" width="${standW}" height="${standH}" rx="4" fill="#333" />`;
    extraElements += `<rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" rx="5" fill="#333" />`;
  }

  return Buffer.from(`
    <svg width="${frameWidth}" height="${frameHeight}">
      <!-- Outer device body -->
      <rect x="0" y="0" width="${frameWidth}" height="${frameHeight - (stand ? 30 : 0)}"
            rx="${outerRadius}" fill="${bezel.color}" />
      <!-- Inner screen cutout (transparent) -->
      <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}"
            rx="${bezel.radius}" fill="white" />
      ${extraElements}
    </svg>
  `);
}

/**
 * Creates a watermark SVG overlay.
 */
function createWatermarkSvg(width, height) {
  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <text x="${width - 12}" y="${height - 12}" text-anchor="end"
            font-family="Arial, sans-serif" font-size="13" fill="rgba(0,0,0,0.35)"
            font-weight="500">vibezap.dev</text>
    </svg>
  `);
}

/**
 * Composites a screenshot into a device frame with background.
 *
 * @param {Buffer} screenshotBuffer - The raw screenshot PNG buffer
 * @param {string} deviceId - Device key from DEVICES
 * @param {object} options
 * @param {string|object} options.background - Hex color string or { type: 'gradient', from, to }
 * @param {boolean} options.watermark - Whether to add vibezap.dev watermark
 * @returns {Promise<{ buffer: Buffer, width: number, height: number }>}
 */
export async function compositeIntoFrame(screenshotBuffer, deviceId, options = {}) {
  const device = DEVICES[deviceId];
  if (!device) throw new Error(`Unknown device: ${deviceId}`);

  const { background = "#ffffff", watermark = false } = options;
  const { viewport, bezel } = device;

  // Frame dimensions = viewport + bezels
  const frameWidth = viewport.width + bezel.left + bezel.right;
  const frameHeight = viewport.height + bezel.top + bezel.bottom + (device.stand ? 30 : 0);

  // Add padding around the device frame for the background
  const padding = 60;
  const canvasWidth = frameWidth + padding * 2;
  const canvasHeight = frameHeight + padding * 2;

  // Resize screenshot to match viewport (it may be 2x from deviceScaleFactor)
  const resizedScreenshot = await sharp(screenshotBuffer)
    .resize(viewport.width, viewport.height, { fit: "cover" })
    .png()
    .toBuffer();

  // Build compositing layers
  const layers = [
    // Layer 1: Background
    {
      input: createBackgroundSvg(canvasWidth, canvasHeight, background),
      top: 0,
      left: 0,
    },
    // Layer 2: Device frame (bezel)
    {
      input: createDeviceFrameSvg(device, frameWidth, frameHeight),
      top: padding,
      left: padding,
    },
    // Layer 3: Screenshot inside the screen area
    {
      input: resizedScreenshot,
      top: padding + bezel.top,
      left: padding + bezel.left,
    },
  ];

  // Layer 4: Watermark (free tier only)
  if (watermark) {
    layers.push({
      input: createWatermarkSvg(canvasWidth, canvasHeight),
      top: 0,
      left: 0,
    });
  }

  const result = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png({ quality: 90 })
    .toBuffer();

  return {
    buffer: result,
    width: canvasWidth,
    height: canvasHeight,
  };
}
