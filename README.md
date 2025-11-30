
# NavPal AI 🟣

**Your Luxury Intelligent Navigator**

NavPal AI is a next-generation navigation dashboard featuring:
- **Gemini 2.5 Flash** integration for "Super-Intelligent" mapping and routing.
- **Mapbox GL** vector maps with a custom Luxury Dark theme.
- **Live Audio** conversational interface ("MyPal").
- **Real-time Traffic** and community reporting.

## 🚀 How to Get a Preview Link (Live URL)

Since this is a static React application, you can deploy it for free to get a shareable URL.

### Option 1: Netlify (Recommended)
The project includes a `netlify.toml` file for zero-config deployment.

1. **Push to GitHub**: Upload these files to a new GitHub repository.
2. **Connect to Netlify**:
   - Log in to [Netlify](https://www.netlify.com).
   - Click **"Add new site"** > **"Import from Git"**.
   - Select your repository.
3. **Deploy**: Netlify will detect the settings automatically. Click **"Deploy"**.
4. **Done**: You will get a link like `https://navpal-ai-demo.netlify.app`.

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this directory.
3. Follow the prompts (Accept defaults).
4. Vercel will generate a preview URL instantly.

## 🛠️ Local Development

To run the app on your own machine:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to `http://localhost:5173`

## 🔑 Environment Variables

For the app to function fully, ensure you have set the following in your deployment settings or `.env` file:

- `API_KEY`: Google Gemini API Key
- `MAPBOX_ACCESS_TOKEN`: Mapbox Public Token
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Supabase Project Credentials
- `CLOUDFLARE_SITE_KEY`: Cloudflare Turnstile Site Key
