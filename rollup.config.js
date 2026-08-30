import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default [
    // CommonJS
    {
        input: ["src/index.ts", "src/helpers.ts", "src/internal.ts"],
        output: {
            dir: "dist/cjs",
            format: "cjs",
            preserveModules: true,
        },
        external: [
            "fetch-xhr-shim",
            "fetch-xhr-shim/helpers",
            "fetch-xhr-shim/internal",
            "miniprogram-platform",
        ],
        plugins: [
            typescript({
                outDir: "dist/cjs",
                declarationDir: "dist/cjs/types",
                moduleResolution: "bundler",
            }),
        ],
    },

    // CommonJS (singlefile)
    {
        input: "src/index.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.cjs.js",
            format: "cjs",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
        ],
    },

    // CommonJS (singlefile, minimized)
    {
        input: "src/index.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.cjs.min.js",
            format: "cjs",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
            terser(),
        ],
    },

    // ES6
    {
        input: ["src/index.ts", "src/helpers.ts", "src/internal.ts"],
        output: {
            dir: "dist/esm",
            format: "es",
            preserveModules: true,
        },
        external: [
            "fetch-xhr-shim",
            "fetch-xhr-shim/helpers",
            "fetch-xhr-shim/internal",
            "miniprogram-platform",
        ],
        plugins: [
            typescript({
                outDir: "dist/esm",
                declarationDir: "dist/esm/types",
                moduleResolution: "bundler",
            }),
        ],
    },

    // ES6 (singlefile)
    {
        input: "src/index.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.esm.js",
            format: "es",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
        ],
    },

    // ES6 (singlefile, minimized)
    {
        input: "src/index.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.esm.min.js",
            format: "es",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
            terser(),
        ],
    },

    // UMD (polyfill singlefile)
    {
        input: "src/polyfill.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.umd.js",
            format: "umd",
            name: "FetchMP",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
        ],
    },

    // UMD (polyfill singlefile, minimized)
    {
        input: "src/polyfill.ts",
        output: {
            file: "dist/miniprogram-fetch-stream.umd.min.js",
            format: "umd",
            name: "FetchMP",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
                moduleResolution: "bundler",
            }),
            nodeResolve(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
            }),
            terser(),
        ],
    },

    // Types
    {
        input: "dist/esm/types/index.d.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },

    // Types (helpers)
    {
        input: "dist/esm/types/helpers.d.ts",
        output: {
            file: "dist/helpers.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },

    // Types (internal)
    {
        input: "dist/esm/types/internal.d.ts",
        output: {
            file: "dist/internal.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },
];
