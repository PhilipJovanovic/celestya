import { Options, defineConfig } from "tsup";

const cfg: Options = {
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: false,
    dts: true,
    format: ["cjs", "esm"],
};

export default defineConfig([
    {
        ...cfg,
        entry: {
            index: "src/index.ts",
        },
        outDir: "dist",
    },
    {
        ...cfg,
        entry: {
            index: "src/client/index.ts",
        },
        outDir: "dist/client",
        esbuildOptions: (options) => {
            options.banner = {
                js: '"use client";',
            };
        },
    },
]);
