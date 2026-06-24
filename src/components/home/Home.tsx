import { useState } from 'react'
import './home.css'
import { HomeHeader } from './HomeHeader'
import { Hero } from './Hero'
import { CategoryCard } from './CategoryCard'
import { CategoryDetail } from './CategoryDetail'
import { Footer } from '../layout/Footer'
import { SUBTEAMS } from '../../content/catalog'
import { getSubteam } from '../../content/selectors'

export function Home() {
  const [activeSubteamId, setActiveSubteamId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const selectSubteam = (id: string) => {
    setActiveSubteamId(id)
    window.scrollTo({ top: 0 })
  }
  const goHome = () => {
    setActiveSubteamId(null)
    window.scrollTo({ top: 0 })
  }

  const activeSubteam = activeSubteamId ? getSubteam(activeSubteamId) : undefined

  return (
    <div className="app-grid" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HomeHeader
        activeSubteamId={activeSubteamId}
        onSelectSubteam={selectSubteam}
        onHome={goHome}
        query={query}
        onQuery={setQuery}
      />

      <div style={{ flex: 1 }}>
        {activeSubteam ? (
          <CategoryDetail subteam={activeSubteam} onHome={goHome} />
        ) : (
          <div className="hm-home-wrap">
            <Hero />
            <div className="hm-catgrid">
              {SUBTEAMS.map((subteam, i) => (
                <CategoryCard key={subteam.id} subteam={subteam} index={i} onClick={() => selectSubteam(subteam.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
