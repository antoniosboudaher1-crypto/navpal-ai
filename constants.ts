
import { Coordinates } from './types';

export const DEFAULT_LOCATION: Coordinates = {
  lat: 37.7749, // San Francisco
  lng: -122.4194
};

export const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

// Mapbox Configuration
// SECURITY WARNING: Never hardcode tokens. Use environment variables.
export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";

// Supabase Configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || "";
// SECURITY WARNING: This must be the ANON key, NOT the Service Role key.
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Cloudflare Turnstile Configuration
export const CLOUDFLARE_SITE_KEY = process.env.CLOUDFLARE_SITE_KEY || "";

// Google Maps Configuration (If used in future features)
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

// Legacy Styles (kept for reference if needed, but main map uses Mapbox)
export const DARK_MAP_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
