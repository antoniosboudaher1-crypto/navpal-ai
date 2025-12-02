import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'react-native': 'react-native-web',
        'react-native-svg': 'react-native-web',
        'react-native-maps': 'react-native-web',
        'expo-linear-gradient': 'react-native-web',
        'expo-location': 'react-native-web',
        'expo-speech': 'react-native-web',
      },
    },
    optimizeDeps: {
      exclude: [
        'expo',
        'expo-linear-gradient',
        'expo-location',
        'expo-speech',
        'expo-dev-client',
        'react-native-maps',
        'react-native-svg'
      ]
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        namedExports: {
          '@react-native/normalize-colors': ['default']
        }
      },
      rollupOptions: {
        external: []
      }
    },
    define: {
      // Expose environment variables with VITE_ prefix
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.MAPBOX_ACCESS_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.CLOUDFLARE_SITE_KEY': JSON.stringify(env.VITE_TURNSTILE_SITE_KEY)
    }
  }
})