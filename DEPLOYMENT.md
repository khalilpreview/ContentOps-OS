# ContentOps OS (v1.0) - Production Deployment Guide

This guide contains the exact steps and configuration required to deploy **ContentOps OS** to production today (Netlify, Vercel, or custom container runtime) backed by **Supabase PostgreSQL & Auth**.

---

## 1. Quick Architecture & Prerequisites

- **Frontend Framework**: React 19 SPA built with Vite and TypeScript.
- **Styling**: Tailwind CSS v4 with dark enterprise UI palette (`#0B0E14` base, `#00E599` emerald accent, `#FF4B55` breach red, `#F5A524` warning amber).
- **Backend & Database**: Supabase (PostgreSQL 15+, Row-Level Security, Auth, and Storage).
- **AI Intelligence**: IFM.ai K2 Horizon / Gemini LLM for automated briefing and the 1-to-10+ Asset Multiplier.

---

## 2. Supabase Setup (Database & Real Auth)

### Step 2.1: Create Project & Obtain Credentials
1. Go to [https://supabase.com](https://supabase.com) and create a new project (e.g. `contentops-os-prod`).
2. Copy your **Project URL** and **Anon Public API Key** from **Project Settings → API**:
   - `VITE_SUPABASE_URL`: e.g. `https://xyzcompany.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### Step 2.2: Execute Schema Migration SQL
Open the **SQL Editor** in your Supabase dashboard and run the entire contents of `/supabase/schema.sql`. This script initializes:
1. `public.profiles`: Stores custom metadata for authenticated operators (`avatar_url`, RACI `role`, `department`, `team`).
2. `public.content_assets`: Primary pipeline repository tracking all 5 stages, 48h SLA clocks, QA gatekeeper checklist, and deliverable URLs.
3. `public.logs`: Dedicated structured telemetry table for post-deployment monitoring (error stacks, warnings, state machine rejections, user context, client telemetry).
4. **Row Level Security (RLS)**: Enforces access control allowing authenticated operators to read/write pipeline assets and insert telemetry logs.
5. **Automated Triggers**: Auto-updates `updated_at` on row mutation and handles new user registration sync.

```sql
-- Verify schema was applied successfully
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected output: 'profiles', 'content_assets', 'logs'
```

### Step 2.3: Configure Supabase Auth Providers
1. Go to **Authentication → Providers**:
   - **Email**: Ensure Email provider is enabled. (Optional: Disable "Confirm email" if you want instant login on signup for internal teams).
   - **Google Workspace (SSO)**: (Optional) Enable Google provider and input your Google Cloud OAuth Client ID & Secret.
2. Go to **Authentication → URL Configuration**:
   - **Site URL**: Set to your production Netlify URL (e.g. `https://contentops-os.netlify.app`).
   - **Redirect URLs**: Add `https://contentops-os.netlify.app/**` and `http://localhost:3000/**`.

---

## 3. Environment Variables Reference

Create or update your production environment variables (e.g. in Netlify Site Configuration):

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | **Yes** | `https://your-project.supabase.co` | Supabase Project Endpoint |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUzI1...` | Supabase Anonymous Client Key |
| `VITE_IFM_API_KEY` | Optional | `sk-...` | IFM.ai K2 Horizon / AI Copilot key |
| `VITE_IFM_BASE_URL` | Optional | `https://api.ifm.ai/v1` | AI Engine API base URL |
| `VITE_IFM_MODEL` | Optional | `k2-horizon` | AI Model alias |

*Note: In development and staging, operators can also configure and test Supabase credentials live in the UI via the **DB Config** tab in the Auth screen or via Settings modal.*

---

## 4. Netlify Deployment (Zero-Config)

The repository is pre-configured with `netlify.toml`, `public/_redirects`, and `public/robots.txt`.

### Step 4.1: Deploy via Netlify CLI
```bash
# 1. Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# 2. Build the production bundle
npm run build

# 3. Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Step 4.2: Deploy via Netlify Git Integration
1. Push this repository to GitHub / GitLab.
2. In Netlify Dashboard, click **Add new site → Import an existing project**.
3. Set build configuration:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add the Environment Variables under **Site Configuration → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy Site**.

### Step 4.3: SPA Routing Verification
The `public/_redirects` file ensures that all deep links (e.g. `/`, `/sla`, `/dashboard`) redirect to `/index.html`:
```text
/*    /index.html   200
```
This is verified automatically during `npm run build` into `dist/_redirects`.

---

## 5. Vercel Deployment (Alternative)

If deploying to Vercel:
```bash
npm install -g vercel
vercel --prod
```
Set Project Settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Add Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 6. Pre-Flight Verification & Smoke Test Checklist

Before handing off the production URL to stakeholders, run this verification:

1. **Clean Slate Pipeline Verification**:
   - Navigate to the production URL in an incognito window.
   - Verify pipeline starts with **0 mock test data**.
   - Verify the clean slate banner renders: *"Production Pipeline Ready (0 Test Data in Pipeline)"* with `+ Create First Brief` CTA.
2. **Supabase Real Auth Test**:
   - Open Auth Modal (defaults to **Supabase Auth** tab).
   - Click "Don't have an account? Sign up".
   - Register a real user: Enter Name, Email, Password, RACI Role (e.g. `Content Manager`), and Team Pod.
   - Click **Create Supabase Account**.
   - Verify user is logged in, their name & avatar appear in the Navbar, and their profile is synced to Supabase `profiles` table.
3. **Brief Creation & 48h SLA Clock**:
   - Click `+ New Brief` (or press keyboard shortcut `N`).
   - Create an asset: Title, Hook Strategy, Target Audience, and Platform Specs.
   - Click **Save Brief**.
   - Verify asset appears in Column 1 (`DRAFT_BRIEF`).
   - Move asset to `SLA_REVIEW`: verify the 48-hour SLA countdown timer starts ticking immediately in green (`>24h remaining`).
4. **RACI Gatekeeper VETO Check**:
   - Advance asset to Column 4 (`QA_GATE`).
   - Try to advance to Column 5 (`READY_TO_PUBLISH`) before QA sign-off: verify Guard Block Modal prevents premature publishing.
   - Check all 4 items (Tone, Specs, Rights, Sign-off) as Content Manager to unlock handoff.
5. **Dashboard Telemetry**:
   - Click **Velocity & SLA (30D)** in top navigation.
   - Verify Recharts render 30-day velocity trends, SLA compliance rate, and stage latency without NaN or console errors.
6. **Client-Side Telemetry & Supabase Error Logging**:
   - The app includes automatic client-side error telemetry (`src/lib/logger.ts`).
   - Uncaught `window.onerror`, unhandled promise rejections, React Error Boundary catches, and state machine violations stream directly to the `public.logs` table in Supabase.
   - Run in Supabase SQL editor to monitor live production errors:
     ```sql
     SELECT level, event, message, user_id, user_role, created_at 
     FROM public.logs 
     ORDER BY created_at DESC 
     LIMIT 50;
     ```

---

## 7. Useful NPM Scripts

```bash
# Run local dev server (port 3000)
npm run dev

# Run full TypeScript typecheck
npx tsc --noEmit

# Run unit tests (State machine, SLAs, Supabase sync, Dashboard metrics, Logger)
npx tsx --test src/lib/*.test.ts src/components/qa/*.test.ts

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

