# Deploying Thrill ContentOps OS to Netlify

This project is fully configured for deployment on Netlify with automated SPA routing, caching, security headers, and Netlify Serverless Functions for the Thrill Copilot AI engine.

---

## Deployment Options

### Option 1: Deploy with Git (Recommended)

1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log into [Netlify](https://app.netlify.com) and click **"Add new site"** > **"Import an existing project"**.
3. Select your repository. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. Click **Deploy site**.

---

### Option 2: Deploy with Netlify CLI

1. Install Netlify CLI globally if needed:
   ```bash
   npm install -g netlify-cli
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Deploy directly to Netlify:
   ```bash
   netlify deploy --prod --dir=dist
   ```

---

### Option 3: Manual Drag-and-Drop Deploy

1. Run the build command locally:
   ```bash
   npm run build
   ```
2. Open [Netlify Drop](https://app.netlify.com/drop).
3. Drag and drop the generated `dist/` folder directly into the Netlify Drop area.
   *(The `dist/_redirects` file is included in `dist/` to ensure full SPA routing support).*

---

## Environment Variables

In your Netlify Dashboard under **Site configuration** > **Environment variables**, you can set:

| Variable | Description |
|---|---|
| `NODE_VERSION` | `20` (Configured automatically in `netlify.toml`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anonymous API key |
| `IFM_API_KEY` | *(Optional)* API key for IFM.ai K2 Horizon engine |
| `IFM_BASE_URL` | *(Optional)* Defaults to `https://api.ifm.ai/v1` |
| `IFM_MODEL` | *(Optional)* Defaults to `k2-horizon` |

> **Note:** If Supabase credentials are not provided via environment variables, users can also configure their Supabase URL and Anon Key directly inside the app using the **DB Config** tab in the Sign In modal or header pill. The app also features full local fallback storage so all functionality remains operational offline or during staging.

---

## Supabase Database & Auth Setup

1. **Create a Supabase Project:**
   - Sign up or log into [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Schema:**
   - In your Supabase dashboard, navigate to **SQL Editor** > **New Query**.
   - Copy and paste the contents of `supabase/schema.sql` from this repository and click **Run**.
   - This sets up the `content_assets` and `user_profiles` tables, Row-Level Security (RLS) policies, automatic `updated_at` timestamps, performance indexes, and initial demo data.
3. **Configure Authentication:**
   - Under **Authentication** > **Providers**, ensure **Email** is enabled.
   - *(Optional)* Enable **Google** or **GitHub** OAuth under **Authentication** > **Providers** if social login is desired. Add your Netlify site URL (e.g., `https://your-site.netlify.app`) to **Redirect URLs**.
4. **Copy API Keys:**
   - Go to **Project Settings** > **API**.
   - Copy **Project URL** and **anon public key**.
   - Add them to Netlify environment variables as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Included Configurations

- **`netlify.toml`**: Configures build commands, SPA fallback routing (`/* -> /index.html`), function directories, and security headers.
- **`public/_redirects`**: Automatically copied to `dist/_redirects` during `npm run build`.
- **`netlify/functions/copilot.ts`**: Serverless function proxying `/api/ai/copilot` requests for the Thrill Copilot agent.
- **`supabase/schema.sql`**: Production PostgreSQL database schema with RLS security policies, triggers, and seed records.
- **`src/lib/supabase.ts`**: Complete Supabase client integration with real-time auth, session restoration, and database CRUD.
