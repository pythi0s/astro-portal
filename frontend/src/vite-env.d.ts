/// <reference types="vite/client" />

// Typed env variables we read in src/. Extend as new VITE_* vars are added.
// Vite inlines these at build time; at runtime they come from import.meta.env.
interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_BASE?: string;
  readonly VITE_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
