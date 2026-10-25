import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".claude/**", ".idea/**", ".next/**", "node_modules/**", "src/dataconnect-generated/**", "dataconnect/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Regras do React Compiler: o projeto busca dados em useEffect em várias telas.
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/purity": "warn" },
  },
];

export default config;
