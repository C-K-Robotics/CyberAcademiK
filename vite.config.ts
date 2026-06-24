import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { courseContent } from './vite/course-content'

// GitHub Pages project site is served from /<repo>/. Override with VITE_BASE
// in CI if the repository name ever changes.
const base = process.env.VITE_BASE ?? '/CyberAcademiK/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    // Discovers courses from content/ and strips MDX frontmatter. Must run
    // before the MDX compiler so it never sees the YAML block.
    courseContent(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
})
