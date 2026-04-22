import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Workaround: eslint-plugin-react@7.37.5 crashes with ESLint 10 because
    // getFilename() was removed. Setting the react version explicitly prevents
    // the plugin from calling getFilename() during version auto-detection.
    settings: {
      react: {
        version: "19",
      },
    },
  },
]);

export default eslintConfig;
