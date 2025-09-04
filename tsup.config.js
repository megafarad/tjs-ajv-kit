import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/cli/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    target: "node20",
    splitting: false,
    shims: false,
    treeshake: true,
    minify: false
});
