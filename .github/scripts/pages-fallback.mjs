import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , output] = process.argv
if (!output) throw new Error('Usage: node .github/scripts/pages-fallback.mjs <pages-directory>')

const routeParameter = '__preview_route'
const restoreId = 'pages-preview-restore'
const previewsDirectory = join(output, 'previews')
const previews = []

function insertHeadScript(html, script) {
  const head = /<head\b[^>]*>/i
  if (!head.test(html)) throw new Error('Expected a <head> in the built index.html')
  return html.replace(head, (tag) => `${tag}\n${script}`)
}

if (lstatSync(previewsDirectory, { throwIfNoEntry: false })?.isDirectory()) {
  for (const entry of readdirSync(previewsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^pr-[1-9]\d*$/.test(entry.name)) continue

    const indexFile = join(previewsDirectory, entry.name, 'index.html')
    if (!lstatSync(indexFile, { throwIfNoEntry: false })?.isFile()) continue
    previews.push(entry.name)

    const html = readFileSync(indexFile, 'utf8')
    if (html.includes(`<script id="${restoreId}">`)) continue

    // Restore the requested address before the preview's router starts.
    const previewBase = `/previews/${entry.name}/`
    const restoreScript = `<script id="${restoreId}">
      (() => {
        const base = ${JSON.stringify(previewBase)};
        const requested = new URLSearchParams(location.search).get(${JSON.stringify(routeParameter)});
        if (location.pathname !== base || !requested?.startsWith(base)) return;

        const route = new URL(requested, location.origin);
        if (route.origin === location.origin && route.pathname.startsWith(base)) {
          history.replaceState(history.state, '', route.href);
        }
      })();
    </script>`
    writeFileSync(indexFile, insertHeadScript(html, restoreScript))
  }
}

const index = readFileSync(join(output, 'index.html'), 'utf8')
const redirectScript = String.raw`<script>
  (() => {
    const preview = location.pathname.match(/^\/previews\/(pr-[1-9]\d*)\/.+/)?.[1];
    if (!${JSON.stringify(previews)}.includes(preview)) return;

    const index = new URL('/previews/' + preview + '/', location.origin);
    index.searchParams.set(${JSON.stringify(routeParameter)}, location.pathname + location.search + location.hash);
    location.replace(index.href);
  })();
</script>`

// GitHub Pages uses the root fallback for missing files throughout the site.
// Redirect only established preview subpaths so missing preview roots cannot loop.
writeFileSync(join(output, '404.html'), previews.length ? insertHeadScript(index, redirectScript) : index)
