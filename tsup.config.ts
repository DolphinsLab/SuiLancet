import { defineConfig } from "tsup"

export default defineConfig([
  // Library build config
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI build config
  {
    entry: ["src/cli/index.ts"],
    format: ["esm"],
    target: "node22",
    splitting: false,
    sourcemap: false,
    clean: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
    outDir: "dist/cli",
    outExtension() {
      return {
        js: ".js",
      }
    },
  },
])
