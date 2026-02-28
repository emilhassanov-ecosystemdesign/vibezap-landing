import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* --- BRAND TOKENS --- */
const brand = {
  black: "#06070B",
  surface: "#0C0D14",
  surfaceLight: "#12131C",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(0,229,255,0.2)",
  cyan: "#00E5FF",
  cyanDim: "rgba(0,229,255,0.15)",
  cyanGlow: "rgba(0,229,255,0.4)",
  amber: "#FF8A00",
  amberDim: "rgba(255,138,0,0.15)",
  white: "#F0F2F5",
  muted: "rgba(255,255,255,0.5)",
  faint: "rgba(255,255,255,0.25)",
  ghost: "rgba(255,255,255,0.08)",
};

/* --- ZAP ICON (SVG) --- */
const ZapIcon = ({ size = 20, color = brand.cyan, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={color} />
  </svg>
);

/* --- ANIMATED COUNTER --- */
function AnimatedNumber({ target, duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val}</span>;
}

/* --- SCROLL REVEAL --- */
function Reveal({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* --- TOOL CARD --- */
function ToolCard({ icon, title, description, price, tag, tagColor, delay, link }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <Reveal delay={delay}>
      <div
        onClick={() => link && navigate(link)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? brand.surfaceLight : brand.surface,
          border: `1px solid ${hovered ? brand.borderHover : brand.border}`,
          borderRadius: "20px",
          padding: "32px 28px",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${brand.cyanDim}` : "none",
          position: "relative",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: hovered
              ? `linear-gradient(90deg, transparent, ${brand.cyan}, transparent)`
              : "transparent",
            transition: "all 0.4s ease",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <span style={{ fontSize: "32px" }}>{icon}</span>
          {tag && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: tagColor || brand.cyan,
                background: tagColor ? `${tagColor}18` : brand.cyanDim,
                padding: "4px 10px",
                borderRadius: "100px",
                border: `1px solid ${tagColor ? `${tagColor}30` : "rgba(0,229,255,0.15)"}`,
              }}
            >
              {tag}
            </span>
          )}
        </div>

        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: brand.white,
            marginBottom: "10px",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            color: brand.muted,
            lineHeight: 1.7,
            flex: 1,
            marginBottom: "20px",
          }}
        >
          {description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "14px",
              fontWeight: 700,
              color: brand.cyan,
            }}
          >
            {price}
          </span>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13px",
              color: hovered ? brand.cyan : brand.faint,
              transition: "color 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Try it <span style={{ transition: "transform 0.3s ease", display: "inline-block", transform: hovered ? "translateX(3px)" : "none" }}>&rarr;</span>
          </span>
        </div>
      </div>
    </Reveal>
  );
}

/* --- STEP CARD --- */
function StepCard({ number, title, description, delay }) {
  return (
    <Reveal delay={delay}>
      <div style={{ textAlign: "center", padding: "0 12px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: brand.cyanDim,
            border: `1px solid rgba(0,229,255,0.15)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontFamily: "'Syne', sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            color: brand.cyan,
          }}
        >
          {number}
        </div>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: brand.white,
            marginBottom: "8px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "14px",
            color: brand.muted,
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      </div>
    </Reveal>
  );
}

/* --- MAIN PAGE --- */
export default function VibZapLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  const tools = [
    {
      icon: "\uD83D\uDD25",
      title: "Roast My Website",
      description: "Drop any URL and get a brutally honest, AI-powered roast of the design, copy, UX, and trust signals. Shareable results included.",
      price: "Free / $5 full report",
      tag: "Live",
      tagColor: "#4ade80",
      link: "/roast",
    },
    {
      icon: "\uD83D\uDEE1\uFE0F",
      title: "Am I Being Scammed?",
      description: "Paste any suspicious email, text, or DM. Get an instant scam probability score with red flags and recommended actions.",
      price: "Free / $3 full report",
      tag: "Live",
      tagColor: "#4ade80",
      link: "/scam-check",
    },
    {
      icon: "\uD83D\uDCF1",
      title: "Screenshot \u2192 Mockup",
      description: "Upload any screenshot. Get it placed in a gorgeous device mockup \u2014 phones, laptops, tablets. Download instantly.",
      price: "$3",
      tag: "Coming Soon",
    },
    {
      icon: "\uD83D\uDCDC",
      title: "TLDR Contract",
      description: "Paste any legal document and get a plain-English summary with red flags highlighted. Never sign confused again.",
      price: "$3",
      tag: "Coming Soon",
    },
    {
      icon: "\uD83D\uDCC5",
      title: "365 Social Posts",
      description: "Enter your niche and get a full year of social media content ideas with hooks, CTAs, and posting schedule as a spreadsheet.",
      price: "$15",
      tag: "Coming Soon",
    },
    {
      icon: "\u2709\uFE0F",
      title: "Vibe Check Email",
      description: "Paste your draft email and discover if it sounds passive-aggressive, desperate, or just right. Get a rewrite that nails the tone.",
      price: "$2",
      tag: "Coming Soon",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: ${brand.black}; }
        ::selection { background: ${brand.cyanDim}; color: ${brand.cyan}; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }

        @keyframes electricPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes zapFlicker {
          0%, 90%, 100% { opacity: 1; }
          92% { opacity: 0.3; }
          94% { opacity: 1; }
          96% { opacity: 0.4; }
        }

        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes borderPulse {
          0%, 100% { border-color: rgba(0,229,255,0.15); }
          50% { border-color: rgba(0,229,255,0.35); }
        }

        .nav-link {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.3s ease;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .nav-link:hover { color: ${brand.cyan}; }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${brand.cyan};
          color: ${brand.black};
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px ${brand.cyanGlow};
        }

        .cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: ${brand.white};
          border: 1px solid ${brand.border};
          border-radius: 12px;
          padding: 14px 28px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .cta-ghost:hover {
          border-color: ${brand.borderHover};
          background: rgba(0,229,255,0.04);
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: brand.black, color: brand.white, overflow: "hidden" }}>

        {/* --- AMBIENT BACKGROUND --- */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {/* Gradient orbs */}
          <div style={{
            position: "absolute", top: "-20%", right: "-10%", width: "700px", height: "700px",
            background: `radial-gradient(circle, ${brand.cyanDim} 0%, transparent 70%)`,
            filter: "blur(80px)", opacity: 0.3,
          }} />
          <div style={{
            position: "absolute", bottom: "-10%", left: "-5%", width: "500px", height: "500px",
            background: `radial-gradient(circle, ${brand.amberDim} 0%, transparent 70%)`,
            filter: "blur(80px)", opacity: 0.2,
          }} />
          {/* Grid pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(${brand.ghost} 1px, transparent 1px), linear-gradient(90deg, ${brand.ghost} 1px, transparent 1px)`,
            backgroundSize: "80px 80px", opacity: 0.3,
          }} />
          {/* Scan line */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: "1px",
            background: `linear-gradient(90deg, transparent, ${brand.cyanDim}, transparent)`,
            animation: "scanline 8s linear infinite", opacity: 0.15,
          }} />
        </div>

        {/* --- NAV --- */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 32px",
          background: scrollY > 50 ? "rgba(6,7,11,0.85)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrollY > 50 ? `1px solid ${brand.border}` : "1px solid transparent",
          transition: "all 0.4s ease",
        }}>
          <div style={{
            maxWidth: "1200px", margin: "0 auto", height: "72px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ZapIcon size={22} />
              <span style={{
                fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800,
                color: brand.white, letterSpacing: "-0.5px",
              }}>
                vibe<span style={{ color: brand.cyan }}>zap</span>
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                color: brand.faint, marginLeft: "4px", marginTop: "2px",
              }}>.dev</span>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <button className="nav-link" onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}>Tools</button>
              <button className="nav-link" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
              <button className="nav-link" onClick={() => document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth" })}>Updates</button>
              <button className="cta-primary" style={{ padding: "10px 20px", fontSize: "13px" }} onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}>
                <ZapIcon size={14} color={brand.black} /> Explore
              </button>
            </div>
          </div>
        </nav>

        {/* --- HERO --- */}
        <section style={{
          position: "relative", zIndex: 1, minHeight: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "120px 32px 140px",
        }}>
          <div style={{ textAlign: "center", maxWidth: "800px" }}>
            {/* Badge */}
            <Reveal>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: brand.cyanDim, border: `1px solid rgba(0,229,255,0.15)`,
                borderRadius: "100px", padding: "6px 16px 6px 10px", marginBottom: "32px",
                animation: "borderPulse 3s ease-in-out infinite",
              }}>
                <ZapIcon size={14} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 500, color: brand.cyan, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Micro-tools that hit different
                </span>
              </div>
            </Reveal>

            {/* Main headline */}
            <Reveal delay={100}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(40px, 7.5vw, 80px)",
                fontWeight: 800, lineHeight: 1.05,
                letterSpacing: "-2px", marginBottom: "24px",
              }}>
                One tool.{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${brand.cyan}, ${brand.amber})`,
                  backgroundSize: "200% 200%", animation: "gradientFlow 5s ease infinite",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  One zap.
                </span>
                <br />Problem solved.
              </h1>
            </Reveal>

            {/* Subtitle */}
            <Reveal delay={200}>
              <p style={{
                fontFamily: "'Outfit', sans-serif", fontSize: "clamp(16px, 2.2vw, 19px)",
                color: brand.muted, lineHeight: 1.7, maxWidth: "540px", margin: "0 auto 40px",
              }}>
                Tiny, powerful web tools that do one thing perfectly.
                No signups. No subscriptions. Just results.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={300}>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="cta-primary" onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}>
                  <ZapIcon size={16} color={brand.black} /> Browse Tools
                </button>
                <button className="cta-ghost" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                  How it works
                </button>
              </div>
            </Reveal>

            {/* Social proof strip */}
            <Reveal delay={450}>
              <div style={{
                display: "flex", gap: "40px", justifyContent: "center",
                marginTop: "64px", flexWrap: "wrap",
              }}>
                {[
                  { value: 100, suffix: "+", label: "Tools planned" },
                  { value: 0, suffix: "", label: "Subscriptions needed", override: "0" },
                  { value: 5, suffix: "s", label: "Avg. time to result" },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800,
                      color: brand.cyan, animation: "zapFlicker 4s ease-in-out infinite",
                      animationDelay: `${i * 0.5}s`,
                    }}>
                      {stat.override || <><AnimatedNumber target={stat.value} />{stat.suffix}</>}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      color: brand.faint, textTransform: "uppercase", letterSpacing: "2px", marginTop: "4px",
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)",
            animation: "float 3s ease-in-out infinite",
          }}>
            <div style={{
              width: "24px", height: "40px", borderRadius: "12px",
              border: `1px solid ${brand.faint}`, display: "flex", justifyContent: "center", paddingTop: "8px",
            }}>
              <div style={{
                width: "3px", height: "8px", borderRadius: "2px",
                background: brand.cyan, animation: "electricPulse 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        </section>

        {/* --- TOOLS SECTION --- */}
        <section id="tools" style={{ position: "relative", zIndex: 1, padding: "80px 32px 100px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                  color: brand.cyan, letterSpacing: "3px", textTransform: "uppercase",
                }}>
                  &#x26A1; The Collection
                </span>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 800, letterSpacing: "-1px", marginTop: "12px",
                }}>
                  Tools that <span style={{ color: brand.cyan }}>zap</span> problems away
                </h2>
                <p style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: "16px",
                  color: brand.muted, marginTop: "12px",
                }}>
                  Each one does one thing &mdash; and does it ridiculously well.
                </p>
              </div>
            </Reveal>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}>
              {tools.map((tool, i) => (
                <ToolCard key={i} {...tool} delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="how" style={{
          position: "relative", zIndex: 1, padding: "80px 32px 100px",
          background: `linear-gradient(180deg, transparent, ${brand.surface} 20%, ${brand.surface} 80%, transparent)`,
        }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: "56px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                  color: brand.amber, letterSpacing: "3px", textTransform: "uppercase",
                }}>
                  &#x25E6; Dead Simple
                </span>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 800, letterSpacing: "-1px", marginTop: "12px",
                }}>
                  How VibeZap works
                </h2>
              </div>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
              <StepCard number="1" title="Pick a tool" description={"Browse our collection. Each tool solves exactly one problem \u2014 no bloat, no confusion."} delay={0} />
              <StepCard number="2" title="Give it input" description="Paste a URL, upload a file, answer a few questions. That's it. No account needed." delay={150} />
              <StepCard number="3" title="Get your result" description="Instant output you can use, share, or download. Pay only if you want the premium version." delay={300} />
            </div>

            {/* Philosophy bar */}
            <Reveal delay={400}>
              <div style={{
                marginTop: "64px", padding: "28px 36px", borderRadius: "16px",
                background: brand.cyanDim, border: `1px solid rgba(0,229,255,0.12)`,
                display: "flex", alignItems: "center", gap: "16px",
              }}>
                <ZapIcon size={24} style={{ flexShrink: 0 }} />
                <p style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: "15px",
                  color: "rgba(255,255,255,0.75)", lineHeight: 1.7,
                }}>
                  <strong style={{ color: brand.cyan }}>Our philosophy:</strong> No accounts. No monthly subscriptions. No tracking.
                  Pay once for what you need, get your result, move on. Tools should serve you, not trap you.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* --- PRICING PHILOSOPHY --- */}
        <section style={{ position: "relative", zIndex: 1, padding: "80px 32px 100px" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                  color: brand.cyan, letterSpacing: "3px", textTransform: "uppercase",
                }}>
                  &#x1F4B0; Pricing
                </span>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 800, letterSpacing: "-1px", marginTop: "12px",
                }}>
                  Impulse-buy friendly
                </h2>
              </div>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {[
                { tier: "$1 \u2013 $5", label: "Quick zaps", desc: "Simple tools for everyday problems. Less than a coffee.", color: brand.cyan },
                { tier: "$5 \u2013 $15", label: "Power tools", desc: "More depth, more output. Worth every cent.", color: brand.amber },
                { tier: "$15 \u2013 $29", label: "Pro tools", desc: "Replace $200+ services. Insane value.", color: "#ff2d55" },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div style={{
                    textAlign: "center", padding: "36px 24px", borderRadius: "20px",
                    background: brand.surface, border: `1px solid ${brand.border}`,
                  }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: item.color, marginBottom: "8px",
                    }}>{item.tier}</div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      color: brand.faint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px",
                    }}>{item.label}</div>
                    <p style={{
                      fontFamily: "'Outfit', sans-serif", fontSize: "14px", color: brand.muted, lineHeight: 1.6,
                    }}>{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --- NEWSLETTER --- */}
        <section id="newsletter" style={{
          position: "relative", zIndex: 1, padding: "80px 32px 100px",
          background: `linear-gradient(180deg, transparent, ${brand.surface} 20%, ${brand.surface} 80%, transparent)`,
        }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
            <Reveal>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                color: brand.amber, letterSpacing: "3px", textTransform: "uppercase",
              }}>
                &#x1F4E1; Stay in the loop
              </span>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 38px)",
                fontWeight: 800, letterSpacing: "-1px", marginTop: "12px", marginBottom: "12px",
              }}>
                New tools, weekly
              </h2>
              <p style={{
                fontFamily: "'Outfit', sans-serif", fontSize: "15px",
                color: brand.muted, lineHeight: 1.7, marginBottom: "32px",
              }}>
                Get notified when we launch new tools. No spam, just zaps.
                Unsubscribe anytime.
              </p>
            </Reveal>

            <Reveal delay={150}>
              {subscribed ? (
                <div style={{
                  background: brand.cyanDim, border: `1px solid rgba(0,229,255,0.2)`,
                  borderRadius: "16px", padding: "24px",
                }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: brand.cyan }}>
                    &#x26A1; You're in! We'll zap you when something new drops.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: "flex", gap: "8px",
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${brand.border}`,
                  borderRadius: "16px", padding: "6px",
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe(e)}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      padding: "14px 18px", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px",
                      color: brand.white,
                    }}
                  />
                  <button className="cta-primary" onClick={handleSubscribe} style={{ borderRadius: "12px" }}>
                    <ZapIcon size={14} color={brand.black} /> Subscribe
                  </button>
                </div>
              )}
            </Reveal>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer style={{
          position: "relative", zIndex: 1, padding: "48px 32px",
          borderTop: `1px solid ${brand.border}`,
        }}>
          <div style={{
            maxWidth: "1100px", margin: "0 auto",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ZapIcon size={18} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 800, color: brand.white }}>
                vibe<span style={{ color: brand.cyan }}>zap</span>
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: brand.faint }}>.dev</span>
            </div>

            <p style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
              color: brand.faint, letterSpacing: "1px",
            }}>
              &copy; 2026 vibezap.dev &mdash; Built with &#x26A1; and questionable amounts of caffeine
            </p>

            <div style={{ display: "flex", gap: "24px" }}>
              <a className="nav-link" style={{ fontSize: "12px" }} href="https://x.com/vibezapdev" target="_blank" rel="noopener noreferrer">Twitter / X</a>
              <a className="nav-link" style={{ fontSize: "12px" }} href="mailto:hello@vibezap.dev">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
