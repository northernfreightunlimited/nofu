import build from "@hono/vite-cloudflare-pages";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    build({
      emptyOutDir: true,
      minify: true,
      entry: ["src/index.ts"],
    }),
    viteStaticCopy({
      targets: [
        {
          src: "index.html",
          dest: "",
        },
        {
          src: "404.html",
          dest: "",
        },
        {
          src: "_routes.json",
          dest: "",
        },
      ],
    }),
    devServer({
      adapter,
      entry: "src/index.ts",
      exclude: ["/", /^\/img\/.+/, /^\/css\/.+/, ...defaultOptions.exclude],
    }),
  ],
});
