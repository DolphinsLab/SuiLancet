import { defineConfig } from "tsup"

export default defineConfig([
  // Library build config
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI build config
  {
    entry: ["src/cli.ts"],
    format: ["cjs"],
    target: "node18",
    splitting: false,
    sourcemap: false,
    clean: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
    outDir: "dist",
    outExtension() {
      return {
        js: ".js",
      }
    },
  },
])
