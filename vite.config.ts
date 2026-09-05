import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  server: { port: 8080, host: true },
  resolve: {
    // One copy of React / Query in the bundle, even if a dependency ships its own.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    // Nitro packages the SSR server for the deploy target. Only needed for builds;
    // NITRO_PRESET overrides the target (see netlify.toml).
    command === "build" ? nitro({ preset: process.env["NITRO_PRESET"] || "netlify" }) : null,
    viteReact(),
  ],
}));
