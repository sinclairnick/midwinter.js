import { defineConfig } from "tsup";
import pkg from "./package.json";
import { writeFile } from "fs/promises";

const Exports = ["validation", "routing"];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    validation: "src/plugins/validation/index.ts",
    routing: "src/plugins/routing/index.ts",
  },
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  outDir: "dist",
  sourcemap: false,
  treeshake: "recommended",
  external: ["midwinter"],
  async onSuccess() {
    const _pkg = { ...pkg };
    const pkgFiles = new Set(pkg.files);

    for (const name of Exports) {
      _pkg.exports[`./${name}`] = {
        types: `./${name}.d.ts`,
        require: `./${name}.js`,
        import: `./dist/${name}.mjs`,
      };

      pkgFiles.add(`${name}.js`);
      pkgFiles.add(`${name}.d.ts`);
    }

    _pkg.files = Array.from(pkgFiles);

    await writeFile("./package.json", JSON.stringify(_pkg, null, 2));
  },
});
