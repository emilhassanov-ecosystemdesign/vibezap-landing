import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ConsentGate from './ConsentGate'
import LegalFooter from './LegalFooter'
import VibeZapLanding from './VibeZapLanding'
import RoastMyWebsite from './apps/roast-my-website/RoastMyWebsite'
import ScamCheck from './apps/scam-check/ScamCheck'
import LandDesign from './apps/land-design/LandDesign'
import ScreenshotMockup from './apps/screenshot-mockup/ScreenshotMockup'
import KidsStoryCreator from './apps/kids-story/KidsStoryCreator'

export default function App() {
  return (
    <BrowserRouter>
      <ConsentGate>
        <Routes>
          <Route path="/" element={<VibeZapLanding />} />
          <Route path="/roast" element={<RoastMyWebsite />} />
          <Route path="/scam-check" element={<ScamCheck />} />
          <Route path="/land-design" element={<LandDesign />} />
          <Route path="/mockup" element={<ScreenshotMockup />} />
          <Route path="/kids-story" element={<KidsStoryCreator />} />
        </Routes>
        <LegalFooter />
      </ConsentGate>
    </BrowserRouter>
  )
}
