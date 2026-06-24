import './home.css'
import { HomeHeader } from './HomeHeader'
import { Hero } from './Hero'
import { CategoryCard } from './CategoryCard'
import { Footer } from '../layout/Footer'
import { SUBTEAMS } from '../../content/catalog'

export function Home() {
  return (
    <div className="app-grid" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HomeHeader />

      <div style={{ flex: 1 }}>
        <div className="hm-home-wrap">
          <Hero />
          <div className="hm-catgrid">
            {SUBTEAMS.map((subteam, i) => (
              <CategoryCard key={subteam.id} subteam={subteam} index={i} />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
