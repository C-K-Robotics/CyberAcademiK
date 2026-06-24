/**
 * Courses are auto-discovered, not registered. This re-export keeps the
 * historical import path working; the implementation lives in discovery.ts.
 */
export { getCourseModule } from './discovery'
