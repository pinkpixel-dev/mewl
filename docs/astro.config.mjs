import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "Mewl Docs",
      description: "Guides and reference for Pink Pixel's local process manager.",
      logo: {
        src: "./src/assets/logo.png",
        alt: "Mewl logo",
      },
      favicon: "/favicon.png",
      social: [
        { icon: "github", label: "Pink Pixel on GitHub", href: "https://github.com/pinkpixel-dev" },
        { icon: "discord", label: "Pink Pixel on Discord", href: "https://discord.com/users/sizzlebopz" },
      ],
      customCss: [
        "@fontsource/plus-jakarta-sans/400.css",
        "@fontsource/plus-jakarta-sans/500.css",
        "@fontsource/plus-jakarta-sans/600.css",
        "@fontsource/plus-jakarta-sans/700.css",
        "@fontsource/plus-jakarta-sans/800.css",
        "@fontsource/space-grotesk/500.css",
        "@fontsource/space-grotesk/700.css",
        "./src/styles/custom.css",
      ],
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 3,
      },
      sidebar: [
        {
          label: "Start Here",
          items: [
            { slug: "getting-started/what-is-mewl" },
            { slug: "getting-started/installation" },
            { slug: "getting-started/desktop-workflow" },
          ],
        },
        {
          label: "Guides",
          items: [
            { slug: "guides/workspace-tour" },
            { slug: "guides/managed-services" },
            { slug: "guides/logs-and-monitoring" },
          ],
        },
      ],
    }),
  ],
});
