import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    // Node environment: the barcode tests drive zxing-wasm directly with raw
    // ImageData, so they need no DOM and stay fast.
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 30000,
  },
});
