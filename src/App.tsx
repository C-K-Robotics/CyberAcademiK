import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Home } from './components/home/Home'
import { SubteamPage } from './components/home/SubteamPage'
import { CoursePage } from './components/course/CoursePage'
import { NotFound } from './components/NotFound'
import { ScrollToTop } from './components/ScrollToTop'

// React Router's basename must match Vite's base (e.g. /CyberAcademiK/) but
// without the trailing slash. The deploy workflow copies index.html to 404.html
// so GitHub Pages falls back to the SPA for deep links instead of 404ing.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/subteams/:id" element={<SubteamPage />} />
        <Route path="/courses/:slug" element={<CoursePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
