import build from '@hono/vite-cloudflare-pages'
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  assetsInclude: ["index.html"],
  build: {
    outDir: "dist/",
    ssrEmitAssets: true,
    ssrManifest: true,
    ssr: true,
  },
  plugins: [
    build(
      {
        emptyOutDir: true,
        minify: false,
        entry: ["src/index.ts"],
      }
    ),
    viteStaticCopy({
      targets: [
        {
          src: 'index.html',
          dest: '',
        }
      ]
    }),
    devServer({
      adapter,
      entry: "src/index.ts",
      exclude: ["/", /^\/img\/.+/, /^\/css\/.+/, ...defaultOptions.exclude],
    }),
  ],
});
