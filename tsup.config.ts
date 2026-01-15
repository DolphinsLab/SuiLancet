import { defineConfig } from "tsup"

export default defineConfig([
  // 库文件构建配置
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
  },
  // CLI构建配置
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
