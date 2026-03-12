import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ConsentGate from './ConsentGate'
import LegalFooter from './LegalFooter'
import VibeZapLanding from './VibeZapLanding'
import RoastMyWebsite from './apps/roast-my-website/RoastMyWebsite'
import ScamCheck from './apps/scam-check/ScamCheck'
import LandDesign from './apps/land-design/LandDesign'
import KidsStoryCreator from './apps/kids-story/KidsStoryCreator'
import { liveApps } from './config/apps'

const componentMap = {
  "roast": RoastMyWebsite,
  "scam-check": ScamCheck,
  "land-design": LandDesign,
  "kids-story": KidsStoryCreator,
};

export default function App() {
  return (
    <BrowserRouter>
      <ConsentGate>
        <Routes>
          <Route path="/" element={<VibeZapLanding />} />
          {liveApps.map(app => {
            const C = componentMap[app.id];
            return C ? <Route key={app.id} path={app.route} element={<C />} /> : null;
          })}
        </Routes>
        <LegalFooter />
      </ConsentGate>
    </BrowserRouter>
  )
}
