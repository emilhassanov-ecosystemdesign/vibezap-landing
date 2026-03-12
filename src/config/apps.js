// To make an app live on vibezap.dev: change status to "live" and deploy.
// To hide an app from customers: change status to "coming_soon".
// Set VITE_SHOW_ALL_APPS=true in Vercel Preview to see all apps regardless of status.

const apps = [
  {
    id: "roast",
    status: "live",
    route: "/roast",
    icon: "\uD83D\uDD25",
    title: "Roast My Website",
    description: "Drop any URL and get a brutally honest, AI-powered roast of the design, copy, UX, and trust signals. Shareable results included.",
    price: "Free / $5 full report",
  },
  {
    id: "scam-check",
    status: "live",
    route: "/scam-check",
    icon: "\uD83D\uDEE1\uFE0F",
    title: "Am I Being Scammed?",
    description: "Paste any suspicious email, text, or DM. Get an instant scam probability score with red flags and recommended actions.",
    price: "Free / $3 full report",
  },
  {
    id: "land-design",
    status: "live",
    route: "/land-design",
    icon: "\uD83C\uDF31",
    title: "Land Design Generator",
    description: "Enter your location and describe your land. Get an AI-powered permaculture design with plant lists, water management, and implementation timeline.",
    price: "Free",
  },
{
    id: "kids-story",
    status: "coming_soon",
    route: "/kids-story",
    icon: "\uD83D\uDCD6",
    title: "Kids Story Creator",
    description: "Enter your child\u2019s name, interests, and a moral. Get a personalized illustrated children\u2019s story as a beautiful PDF.",
    price: "$3",
  },
  {
    id: "tldr-contract",
    status: "coming_soon",
    route: "/tldr-contract",
    icon: "\uD83D\uDCDC",
    title: "TLDR Contract",
    description: "Paste any legal document and get a plain-English summary with red flags highlighted. Never sign confused again.",
    price: "$3",
  },
  {
    id: "social-posts",
    status: "coming_soon",
    route: "/social-posts",
    icon: "\uD83D\uDCC5",
    title: "365 Social Posts",
    description: "Enter your niche and get a full year of social media content ideas with hooks, CTAs, and posting schedule as a spreadsheet.",
    price: "$15",
  },
  {
    id: "vibe-check",
    status: "coming_soon",
    route: "/vibe-check",
    icon: "\u2709\uFE0F",
    title: "Vibe Check Email",
    description: "Paste your draft email and discover if it sounds passive-aggressive, desperate, or just right. Get a rewrite that nails the tone.",
    price: "$2",
  },
  {
    id: "brand-kit",
    status: "coming_soon",
    route: "/brand-kit",
    icon: "\uD83C\uDFA8",
    title: "Brand Kit in a Box",
    description: "Enter your business name and vibe. Get logo concepts, color palette, font pairing, social templates, and a brand guidelines PDF.",
    price: "$15",
  },
];

const showAll = import.meta.env.VITE_SHOW_ALL_APPS === "true";

export const liveApps = showAll ? apps : apps.filter(a => a.status === "live");
export { apps };
export default apps;
