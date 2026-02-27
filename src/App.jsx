import { BrowserRouter, Routes, Route } from 'react-router-dom'
import VibZapLanding from './VibZapLanding'
import RoastMyWebsite from './RoastMyWebsite'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VibZapLanding />} />
        <Route path="/roast" element={<RoastMyWebsite />} />
      </Routes>
    </BrowserRouter>
  )
}
