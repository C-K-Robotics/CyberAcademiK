import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { courseContent } from './vite/course-content'

// Pages serves this repo from the root of its custom domain
// (https://docs.ckrobotics.org/), so the base is '/'. Override with VITE_BASE
// to build for a bare project Pages URL instead — e.g. VITE_BASE=/CyberAcademiK/
// for https://<user>.github.io/CyberAcademiK/.
const base = process.env.VITE_BASE ?? '/'

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
