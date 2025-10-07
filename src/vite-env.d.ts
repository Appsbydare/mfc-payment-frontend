/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add other environment variables here as needed. Yes this is for a Little change
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
