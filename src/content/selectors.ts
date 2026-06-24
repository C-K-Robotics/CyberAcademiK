/** Derived views over the discovered catalog (counts, lookups). */
export {
  TOTAL_COURSES,
  TOTAL_SUBTEAMS,
  courseCountForSubteam,
  getSubteam,
  isCourseAvailable,
  findCourseEntry,
  getLessonPosition,
  searchCatalog,
} from './discovery'
export type { SearchHit, CourseHit, SubteamHit } from './discovery'
