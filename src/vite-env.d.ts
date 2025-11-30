// Reference to vite/client removed to prevent type definition error.
// The application uses process.env for environment variables, so ImportMetaEnv usage is minimal.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLOUDFLARE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
