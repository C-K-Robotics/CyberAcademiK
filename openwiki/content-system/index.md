# Files

- [Static Assets](assets.md) - How CyberAcademiK handles static assets — the public/ directory structure, MDX image references, and the assetUrl() base-path resolution mechanism.
- [Content Authoring Guide](authoring.md) - Complete guide for content authors — directory structure, frontmatter fields, JSON sidecars, MDX component vocabulary, and how to add courses with interactive widgets.
- [Course Bundles](course-bundles.md) - The optional course bundle system — how courses with interactive widgets register custom React components to be used inside their MDX content.
- [Course Content Vite Plugin](course-content-plugin.md) - The custom Vite plugin that scans the content/ directory at build time, parses MDX frontmatter with js-yaml, and generates the virtual:course-catalog module.
- [Content Discovery System](discovery.md) - How CyberAcademiK transforms raw catalog data from the Vite plugin into renderable CourseModules, with lazy MDX loading and automatic bundle matching.
- [Content System Overview](overview.md) - How CyberAcademiK's content discovery system works — from on-disk MDX files to typed, renderable course modules with no code registration required.
- [Types & Schema](types-and-schema.md) - Type definitions for CyberAcademiK's content system — from raw Vite plugin output to renderable course modules and metadata interfaces.
