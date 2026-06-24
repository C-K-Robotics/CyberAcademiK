export const LOCALES = ['en', 'zh-Hant'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Human label for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-Hant': '繁',
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
}

/** UI chrome strings. Course *content* lives in per-locale MDX, not here. */
export interface Strings {
  brandTagline: string
  searchPlaceholder: string
  // home hero
  heroKicker: string
  heroTitle: string
  heroLead: string
  browseSubteams: string
  coursesSubteamsMeta: (courses: number, subteams: number) => string
  // category view
  library: string
  coursesCount: (n: number) => string
  groupsCount: (n: number) => string
  courseCountLabel: (n: number) => string
  browse: string
  badgeNew: string
  comingSoon: string
  // course chrome
  myCourses: string
  now: string
  lessonCounter: (n: string, total: string) => string
  knowledgeCheck: string
  references: string
  upNext: (lesson: string) => string
  // quiz
  quizNotStarted: string
  quizScore: (correct: number, total: number) => string
  quizCorrect: string
  quizNotQuite: (answer: string) => string
  // levels
  levelBeginner: string
  levelIntermediate: string
  levelAdvanced: string
  // misc
  toggleTheme: string
  menu: string
  notFoundTitle: string
  notFoundBody: string
  backToLibrary: string
  footerContentBy: string
  footerSiteBy: string
  footerCopyright: string
  footerDisciplines: string
}

const en: Strings = {
  brandTagline: 'LEARNING LIBRARY',
  searchPlaceholder: 'Search courses…',
  heroKicker: 'CYBERACADEMIK · LEARNING LIBRARY',
  heroTitle: 'Build the whole robot, one skill at a time.',
  heroLead:
    'Interactive tutorials across the three disciplines a competition team lives and dies by — from CAD and motors to the control loops that make it all move. Pick a subteam and start anywhere.',
  browseSubteams: 'BROWSE SUBTEAMS',
  coursesSubteamsMeta: (c, t) => `${c} courses · ${t} subteams`,
  library: 'Library',
  coursesCount: (n) => `${n} courses`,
  groupsCount: (n) => `${n} groups`,
  courseCountLabel: (n) => `${n} courses`,
  browse: 'Browse →',
  badgeNew: 'NEW',
  comingSoon: 'Coming soon',
  myCourses: 'MY COURSES',
  now: 'NOW',
  lessonCounter: (n, total) => `LESSON ${n} / ${total}`,
  knowledgeCheck: 'Knowledge check',
  references: 'REFERENCES',
  upNext: (lesson) => `UP NEXT · ${lesson}`,
  quizNotStarted: 'not started',
  quizScore: (correct, total) => `${correct} / ${total} correct`,
  quizCorrect: '✓ Correct — ',
  quizNotQuite: (answer) => `✗ Not quite — the answer is “${answer}”. `,
  levelBeginner: 'Beginner',
  levelIntermediate: 'Intermediate',
  levelAdvanced: 'Advanced',
  toggleTheme: 'Toggle theme',
  menu: 'Menu',
  notFoundTitle: 'Page not found',
  notFoundBody: "We couldn't find what you were looking for.",
  backToLibrary: 'Back to the library',
  footerContentBy: 'Course content by FRC#8020 Mentors & Members',
  footerSiteBy: 'CyberAcademiK · tutorial site by Nathan Lee',
  footerCopyright: '© 2026 CyberAcademiK · FRC Learning Library',
  footerDisciplines: 'Mechanical · Electrical · Control',
}

const zhHant: Strings = {
  brandTagline: '學習資料庫',
  searchPlaceholder: '搜尋課程…',
  heroKicker: 'CYBERACADEMIK · 學習資料庫',
  heroTitle: '一次一項技能，打造整台機器人。',
  heroLead:
    '涵蓋競賽隊伍賴以生存的三大領域的互動式教學——從 CAD 與馬達，到讓一切動起來的控制迴路。選一個分隊，從任何地方開始。',
  browseSubteams: '瀏覽分隊',
  coursesSubteamsMeta: (c, t) => `${c} 門課程 · ${t} 個分隊`,
  library: '資料庫',
  coursesCount: (n) => `${n} 門課程`,
  groupsCount: (n) => `${n} 個分組`,
  courseCountLabel: (n) => `${n} 門課程`,
  browse: '瀏覽 →',
  badgeNew: '新',
  comingSoon: '即將推出',
  myCourses: '我的課程',
  now: '目前',
  lessonCounter: (n, total) => `第 ${n} / ${total} 課`,
  knowledgeCheck: '隨堂測驗',
  references: '參考資料',
  upNext: (lesson) => `下一課 · ${lesson}`,
  quizNotStarted: '尚未開始',
  quizScore: (correct, total) => `答對 ${correct} / ${total} 題`,
  quizCorrect: '✓ 答對了——',
  quizNotQuite: (answer) => `✗ 不太對——正確答案是「${answer}」。`,
  levelBeginner: '入門',
  levelIntermediate: '中階',
  levelAdvanced: '進階',
  toggleTheme: '切換主題',
  menu: '選單',
  notFoundTitle: '找不到頁面',
  notFoundBody: '我們找不到您要的內容。',
  backToLibrary: '返回資料庫',
  footerContentBy: '課程內容由 FRC#8020 Mentor 與隊員提供',
  footerSiteBy: 'CyberAcademiK · 教學網站由 Nathan Lee 製作',
  footerCopyright: '© 2026 CyberAcademiK · FRC 學習資料庫',
  footerDisciplines: 'M&D · EE · CxP',
}

export const STRINGS: Record<Locale, Strings> = {
  en,
  'zh-Hant': zhHant,
}
