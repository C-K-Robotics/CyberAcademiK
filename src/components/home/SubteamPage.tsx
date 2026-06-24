import { useParams } from 'react-router-dom'
import './home.css'
import { HomeHeader } from './HomeHeader'
import { CategoryDetail } from './CategoryDetail'
import { Footer } from '../layout/Footer'
import { NotFound } from '../NotFound'
import { getSubteam } from '../../content/selectors'

export function SubteamPage() {
  const { id } = useParams<{ id: string }>()
  const subteam = id ? getSubteam(id) : undefined
  if (!subteam) return <NotFound />

  return (
    <div className="app-grid" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HomeHeader />
      <div style={{ flex: 1 }}>
        <CategoryDetail subteam={subteam} />
      </div>
      <Footer />
    </div>
  )
}
