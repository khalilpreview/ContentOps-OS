# Thrill ContentOps OS (v1.0)
### Enterprise Content Velocity, RACI Governance & 48-Hour SLA Orchestration Engine

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Netlify Ready](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Test Suite](https://img.shields.io/badge/Tests-36%20Passing-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org/)

**ContentOps OS** is an enterprise-grade production operating system engineered for high-throughput media teams, content pods, and marketing organizations. It eliminates pipeline chaos by enforcing a deterministic 5-stage finite state machine, strict RACI role-based access control, a real-time 48-hour SLA countdown engine, automated 1-to-10+ asset derivative multiplication, post-deployment structured error telemetry, and executive Recharts dashboards.

---

## Table of Contents

1. [Key Features & Architectural Highlights](#1-key-features--architectural-highlights)
2. [Architecture Overview](#2-architecture-overview)
   - [Deterministic 5-Stage State Machine](#deterministic-5-stage-state-machine)
   - [RACI Role Matrix](#raci-role-matrix)
   - [Dynamic 48-Hour SLA Engine](#dynamic-48-hour-sla-engine)
   - [1-to-10+ Derivative Asset Multiplier](#1-to-10-derivative-asset-multiplier)
   - [Executive Dashboard & 30-Day Velocity](#executive-dashboard--30-day-velocity)
   - [Structured Error Telemetry (`public.logs`)](#structured-error-telemetry-publiclogs)
3. [Local Development Setup](#3-local-development-setup)
4. [Configuring Supabase for Production](#4-configuring-supabase-for-production)
   - [Database Schema & RLS](#database-schema--rls)
   - [Supabase Auth & Profiles Sync](#supabase-auth--profiles-sync)
   - [Client-Side Production Logs Table](#client-side-production-logs-table)
5. [Deploying to Netlify](#5-deploying-to-netlify)
   - [Option A: Automated Git Deployment](#option-a-automated-git-deployment)
   - [Option B: Netlify CLI Deployment](#option-b-netlify-cli-deployment)
   - [SPA Routing & Crawler Access (`robots.txt`)](#spa-routing--crawler-access-robotstxt)
6. [Repository Structure](#6-repository-structure)
7. [Verification & Smoke Test Checklist](#7-verification--smoke-test-checklist)

---

## 1. Key Features & Architectural Highlights

- **Clean Production Slate**: Boots with an empty production pipeline (`INITIAL_ASSETS = []`) accompanied by a zero-state on-demand `+ Load Demo Pipeline` template injector for testing and demonstrations.
- **Supabase Real Authentication**: Email + Password authentication, passwordless magic link (OTP), and Google Workspace SSO provider compatibility, alongside a 1-click RACI persona simulator for staging.
- **Profiles Metadata Synchronization**: Automatic bidirectional syncing between application settings and the `public.profiles` table in Supabase.
- **RACI Gatekeeper VETO Guard**: 4-point mandatory quality checklist (Tone of Voice, Safe Zones & Platform Specs, Rights Clearance, and Content Manager Sign-off) that strictly forbids premature publishing.
- **Client-Side Error Logging**: Structured telemetry utility (`src/lib/logger.ts`) dispatching uncaught runtime exceptions, rejected state machine actions, and React Error Boundary events to Supabase `public.logs`.
- **30-Day Velocity & SLA Dashboards**: Visualizes throughput by format tier (Hero, Hub, Hygiene) and SLA compliance rate over 30 days using responsive Recharts.
- **Offline & Local-First Resiliency**: Graceful fallback to `localStorage` with automated schema migration if Supabase credentials are not injected.

---

## 2. Architecture Overview

### Deterministic 5-Stage State Machine

Workflow progression is strictly controlled in `src/lib/stateMachine.ts`. Unauthorized or premature status transitions trigger a user-facing **Guard Block Modal** with precise remediation instructions:

```
[ STAGE 1: DRAFT_BRIEF ]
       │
       ▼ (Requires: Title, Hook Strategy, Target Audience, Platform Specs)
[ STAGE 2: SLA_REVIEW ] ◄── Ticking 48h Countdown Clock Commences
       │
       ▼ (Requires: STAKEHOLDER or CONTENT_MANAGER Approval)
[ STAGE 3: IN_PRODUCTION ]
       │
       ▼ (Requires: Valid Deliverable URL e.g. Video, Figma, PDF, Audio)
[ STAGE 4: QA_GATE ] ◄── 4-Point VETO Check: Tone, Specs, Rights, Gatekeeper
       │
       ▼ (Requires: CONTENT_MANAGER Sign-off + All 4 Checkpoints Validated)
[ STAGE 5: READY_TO_PUBLISH ]
       │
       ▼ (Requires: DISTRIBUTION_LEAD or CONTENT_MANAGER)
[ PUBLISHED / SYNDICATED ]
```

### RACI Role Matrix

Four specialized operator personas govern pipeline actions:

| RACI Role | Code Identifier | Permissions & Authority |
| :--- | :--- | :--- |
| **Content Manager** | `CONTENT_MANAGER` | Full operational oversight, team allocations, SLA capacity overrides, and exclusive authority for Stage 4 QA Gatekeeper sign-off. |
| **Creative Specialist** | `CREATIVE_SPECIALIST` | Production pod execution, asset creation, deliverable upload, and moving assets to QA Gate. |
| **Stakeholder** | `STAKEHOLDER` | Strategic briefing review, 48-hour SLA approval or rejection with mandatory revision notes. |
| **Distribution Lead** | `DISTRIBUTION_LEAD` | Omnichannel syndication, paid campaign amplification, and post-launch retention evaluation. |

### Dynamic 48-Hour SLA Engine

The SLA Engine (`src/lib/sla.ts`) evaluates real-time timestamps with color-coded operational thresholds:

- 🟢 **Healthy (>24h remaining)**: Displayed in `#00E599` emerald.
- 🟡 **Warning Risk (0h – 24h remaining)**: Displayed in `#F5A524` amber; triggers the **SLA Risk** quick filter.
- 🔴 **Breached (<0h remaining)**: Displayed in `#FF4B55` red with pulsating visual indicators and executive breach alerts.

### 1-to-10+ Derivative Asset Multiplier

The Multiplier engine (`src/components/AssetMultiplierModal.tsx`) decomposes 1 core **Hero** asset into an omnichannel content package:
- **16:9 Landscape**: YouTube Long-form & Keynote deck.
- **9:16 Vertical Reel**: TikTok, Instagram Reels, YouTube Shorts (-14 LUFS audio, safe margin zones).
- **1:1 Square Carousel**: LinkedIn multi-slide PDF document & key takeaway quote cards.
- **Micro-Hook Generator**: Generates 3 hook varieties (Contrarian, Curiosity Gap, Direct Value).
- **Attribution Lineage**: Children retain `parentId` and `parentTitle` linking back to the root Hero asset.

### Executive Dashboard & 30-Day Velocity

Built with Recharts in `src/components/Dashboard.tsx` and `src/lib/dashboardMetrics.ts`:
- **Throughput by Tier**: Daily stacked volume across Hero, Hub, and Hygiene tiers.
- **SLA Compliance Rate**: Calculated as $\frac{\text{On-Time Cleared}}{\text{On-Time Cleared} + \text{Breached}} \times 100$.
- **Stage Latency Benchmarks**: Real-time turnaround comparison against SLA targets (Brief Drafting $\le 12\text{h}$, SLA Review $\le 48\text{h}$, Production $\le 48\text{h}$, QA Gate $\le 24\text{h}$, Syndication $\le 12\text{h}$).

### Structured Error Telemetry (`public.logs`)

Post-deployment monitoring utility in `src/lib/logger.ts` backed by `src/components/ErrorBoundary.tsx`:
- Captures `window.onerror`, unhandled promise rejections, and state machine validation failures.
- Transmits structured payloads (level, event, message, stack, JSON context, user ID, role, URL, user agent) to Supabase `public.logs`.
- Equipped with an **Anti-Recursion Shield** to prevent logging loops on network error, plus an in-memory 100-entry ring buffer for offline triage.

---

## 3. Local Development Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/contentops-os.git
cd contentops-os
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```bash
cp .env.example .env
```

Set your project variables:
```ini
# Supabase Production Project Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Optional AI Copilot Engine
VITE_IFM_API_KEY=sk-...
VITE_IFM_BASE_URL=https://api.ifm.ai/v1
VITE_IFM_MODEL=k2-horizon
```

### 3. Start Development Server
```bash
npm run dev
```
The app runs at `http://localhost:3000`.

### 4. Run Automated Test Suite
Run the 36 unit tests across the state machine, SLA engine, Supabase integration, profile sync, and structured logger:
```bash
npx tsx --test src/lib/*.test.ts src/components/qa/*.test.ts
```

### 5. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in `/dist`.

---

## 4. Configuring Supabase for Production

### Step 4.1: Create Project
1. Log in to [Supabase](https://supabase.com) and create a new project (e.g. `contentops-os-prod`).
2. Navigate to **Project Settings → API** and copy:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **anon public API Key** (`VITE_SUPABASE_ANON_KEY`)

### Step 4.2: Execute Database Schema
Open the **SQL Editor** in your Supabase dashboard and run the entire contents of `/supabase/schema.sql`. This initializes:

1. `public.content_assets`: Main pipeline repository storing all asset metadata, SLAs, and QA checklists.
2. `public.profiles`: Synced user profiles table with RACI roles (`avatar_url`, `role`, `department`, `team`).
3. `public.logs`: Client-side error telemetry table for real-time production monitoring.
4. **Row Level Security (RLS)**: Enforces authorized read/write access and public log insertion.
5. **Database Triggers**: Handles automatic timestamp updates and syncs newly registered Supabase Auth users to `public.profiles`.

To confirm setup in the SQL editor:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected result: content_assets, profiles, user_profiles, logs
```

### Step 4.3: Configure Supabase Authentication
1. Go to **Authentication → Providers**:
   - **Email**: Enable Email provider. (For instant onboarding, uncheck "Confirm email" if desired).
   - **Google Workspace (SSO)**: (Optional) Enable Google provider with your Google Cloud OAuth Client ID & Secret.
2. Go to **Authentication → URL Configuration**:
   - **Site URL**: `https://your-app.netlify.app`
   - **Redirect URLs**: Add `https://your-app.netlify.app/**` and `http://localhost:3000/**`.

### Step 4.4: Inspect Production Logs
Monitor live client-side errors and state machine events directly from Supabase SQL Editor:
```sql
SELECT level, event, message, user_id, user_role, created_at 
FROM public.logs 
ORDER BY created_at DESC 
LIMIT 50;
```

---

## 5. Deploying to Netlify

The repository is pre-configured for instant zero-downtime deployment on Netlify with `netlify.toml`, `public/_redirects`, and `public/robots.txt`.

### Option A: Automated Git Deployment (Recommended)
1. Push your repository to GitHub or GitLab.
2. Log in to [Netlify](https://app.netlify.com) and click **Add new site → Import an existing project**.
3. Select your repository.
4. Verify build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Go to **Site configuration → Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy Site**.

### Option B: Netlify CLI Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build production bundle
npm run build

# Deploy directly to production
netlify deploy --prod --dir=dist
```

### SPA Routing & Crawler Access (`robots.txt`)

- **Single Page Application Deep Linking**:
  The `public/_redirects` file automatically copies to `dist/_redirects` during build:
  ```text
  /*    /index.html   200
  ```
  This ensures direct navigation to deep links (such as `/dashboard` or `/sla`) will not return 404 errors.
- **Search Engine Optimization & Crawler Access**:
  The `public/robots.txt` configuration permits indexing of public product pages while disallowing indexing of private operator paths:
  ```text
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /admin/
  ```

---

## 6. Repository Structure

```
├── .env.example                     # Environment template
├── netlify.toml                     # Netlify build & cache header configuration
├── public/
│   ├── _redirects                   # Netlify SPA fallback routing rule
│   └── robots.txt                   # Production crawler management
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx             # Supabase email, magic link & persona simulator
│   │   ├── Dashboard.tsx            # 30-Day velocity trends & SLA compliance
│   │   ├── ErrorBoundary.tsx        # React error boundary with telemetry logging
│   │   ├── KanbanBoard.tsx          # 5-Stage Kanban board with zero-state banners
│   │   ├── AssetDetailStudio.tsx    # Multi-tab asset inspection & brief editor
│   │   ├── AssetMultiplierModal.tsx # 1-to-10+ derivative format generator
│   │   ├── GuardBlockModal.tsx      # State machine VETO barrier modal
│   │   ├── Navbar.tsx               # Enterprise header, SLA alerts & user menu
│   │   ├── Sidebar.tsx              # Quick filter navigation & system stats
│   │   └── qa/                      # 4-Point QA gatekeeper inspector
│   ├── lib/
│   │   ├── logger.ts                # Structured client-side telemetry to Supabase logs
│   │   ├── logger.test.ts           # Logger unit tests (Node:test)
│   │   ├── stateMachine.ts          # 5-Stage deterministic finite state machine
│   │   ├── stateMachine.test.ts     # State machine transition unit tests
│   │   ├── sla.ts                   # 48-Hour SLA engine & status calculation
│   │   ├── sla.test.ts              # SLA calculation unit tests
│   │   ├── supabase.ts              # Supabase client singleton & CRUD operations
│   │   ├── supabase.test.ts         # Supabase mapping & data integrity tests
│   │   ├── dashboardMetrics.ts      # Velocity & SLA metric calculations
│   │   └── seedData.ts              # Clean slate INITIAL_ASSETS & demo templates
│   ├── types.ts                     # Core TypeScript interfaces & enums
│   ├── App.tsx                      # Root application layout & state orchestrator
│   └── main.tsx                     # Entry point with ErrorBoundary & telemetry
├── supabase/
│   └── schema.sql                   # Full PostgreSQL schema, RLS policies & triggers
├── ARCHITECTURE.md                  # Detailed technical architecture specification
├── DEPLOYMENT.md                    # Production deployment & migration playbook
└── package.json                     # Dependencies & scripts
```

---

## 7. Verification & Smoke Test Checklist

Prior to production sign-off, verify each item in this smoke test checklist:

1. **Clean Slate Pipeline**:
   - Access the deployed URL in an incognito window.
   - Confirm the board renders with **0 mock test items** and displays the clean slate banner: *"Production Pipeline Ready (0 Test Data in Pipeline)"*.
2. **Supabase Real Auth**:
   - Register a real user via the **Sign up** form.
   - Confirm user session persists, the operator avatar appears in the Navbar, and metadata is stored in `public.profiles`.
3. **Brief Creation & SLA Countdown**:
   - Click `+ New Brief` (or press keyboard shortcut `N`).
   - Create a brief and move it to `SLA_REVIEW`.
   - Verify the 48-hour countdown clock starts ticking in green.
4. **RACI Gatekeeper VETO Check**:
   - Move an asset to Stage 4 (`QA_GATE`).
   - Attempt to advance to Stage 5 (`READY_TO_PUBLISH`) without signing off.
   - Verify the **Guard Block Modal** rejects the transition and reports missing checkpoints.
   - Complete all 4 QA checkpoints as a `CONTENT_MANAGER` to unlock publishing.
5. **30-Day Velocity & SLA Dashboard**:
   - Click **Velocity & SLA (30D)** in the navigation bar.
   - Verify Recharts render velocity throughput and SLA metrics without division-by-zero or console errors.
6. **Telemetry & Production Error Logging**:
   - Deliberately trigger a state machine rejection.
   - Verify in your Supabase SQL editor (`SELECT * FROM public.logs ORDER BY created_at DESC LIMIT 5;`) that the warning or error event was recorded with active user context.

---

## License

Enterprise Proprietary — Thrill ContentOps Systems. All rights reserved.
