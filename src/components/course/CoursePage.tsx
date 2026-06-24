import { useParams } from 'react-router-dom'
import { CourseLayout } from './CourseLayout'
import { NotFound } from '../NotFound'
import { getCourseModule } from '../../content/registry'

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const module = slug ? getCourseModule(slug) : undefined
  if (!module) return <NotFound />
  return <CourseLayout module={module} />
}
