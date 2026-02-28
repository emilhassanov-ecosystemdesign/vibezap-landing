import { BrowserRouter, Routes, Route } from 'react-router-dom'
import VibZapLanding from './VibZapLanding'
import RoastMyWebsite from './apps/roast-my-website/RoastMyWebsite'
import ScamCheck from './apps/scam-check/ScamCheck'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VibZapLanding />} />
        <Route path="/roast" element={<RoastMyWebsite />} />
        <Route path="/scam-check" element={<ScamCheck />} />
      </Routes>
    </BrowserRouter>
  )
}
