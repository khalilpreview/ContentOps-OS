# ContentOps OS (v1.0) - Technical Architecture Specification

This document provides a complete technical specification of the **ContentOps OS** architecture, state machine, RACI governance matrix, SLA calculations, database schema, and telemetry systems. It is written to enable engineering teams and autonomous AI coding agents to maintain, extend, and deploy the system.

---

## 1. System Overview & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ContentOps OS Workspace                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Frontend SPA                   │ Backend & Cloud Services              │
│ - React 19 + TypeScript        │ - Supabase Auth (Email, OTP, OAuth)   │
│ - Vite 6 Build Engine          │ - Supabase PostgreSQL (RLS & Triggers)│
│ - Tailwind CSS v4              │ - IFM.ai K2 Horizon (Brief & Multiply)│
│ - Recharts (30D Telemetry)     │ - LocalStorage Fallback Migration V2  │
│ - Lucide Icons                 │ - Node:test Runner (27 Unit Tests)    │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Deterministic 5-Stage Finite State Machine

Pipeline workflow is strictly governed by a deterministic state machine defined in `src/lib/stateMachine.ts`. Transitions that violate governance rules or missing prerequisite deliverables are blocked at the domain layer and display a user-facing **Guard Block Modal**.

```
[ STAGE 1: DRAFT_BRIEF ]
       │
       ▼ (Requires: Title, Hook Strategy, Target Audience, Platform Specs)
[ STAGE 2: SLA_REVIEW ] ◄── Ticking 48h Countdown Clock Begins!
       │
       ▼ (Requires: STAKEHOLDER or CONTENT_MANAGER Approval)
[ STAGE 3: IN_PRODUCTION ]
       │
       ▼ (Requires: Valid Deliverable URL e.g. Video, Figma, PDF, Doc)
[ STAGE 4: QA_GATE ] ◄── 4-Point VETO Check: Tone, Specs, Rights, Gatekeeper
       │
       ▼ (Requires: CONTENT_MANAGER role + All 4 QA Checkpoints True)
[ STAGE 5: READY_TO_PUBLISH ]
       │
       ▼ (Requires: DISTRIBUTION_LEAD or CONTENT_MANAGER)
[ PUBLISHED / SYNDICATED ]
```

### Transition Matrix & Guard Conditions

| Source Status | Target Status | Required Operator Role | Mandatory Invariants |
| :--- | :--- | :--- | :--- |
| `DRAFT_BRIEF` | `SLA_REVIEW` | Any authenticated user | Title, Hook Strategy, Target Audience, and Platform Specs must not be empty. Starts 48h SLA clock. |
| `SLA_REVIEW` | `IN_PRODUCTION` | `STAKEHOLDER` or `CONTENT_MANAGER` | Rejection sends brief back to `DRAFT_BRIEF` with mandatory feedback notes. |
| `IN_PRODUCTION` | `QA_GATE` | `CREATIVE_SPECIALIST` or `CONTENT_MANAGER` | Valid `deliverableUrl` must be present. Resets QA check booleans. |
| `QA_GATE` | `READY_TO_PUBLISH` | `CONTENT_MANAGER` (Gatekeeper) | **Strict VETO Block**: All 4 QA checkboxes (`qaToneApproved`, `qaSpecsValidated`, `qaRightsCleared`, `qaGatekeeperSigned`) must be `true`. |
| `QA_GATE` | `IN_PRODUCTION` | Any operator | Revision request resets deliverables and records audit history note. |
| `READY_TO_PUBLISH` | `PUBLISHED` | `DISTRIBUTION_LEAD` or `CONTENT_MANAGER` | Sets `targetPublishAt`, unlocks Phase 5 retention rate tracking. |

---

## 3. RACI Governance Matrix

Governance enforces strict enterprise separation of duties across 4 specialized operator personas:

| RACI Role | Code Identifier | Primary Accountability | State Machine Authority |
| :--- | :--- | :--- | :--- |
| **Content Manager** | `CONTENT_MANAGER` | End-to-end workflow oversight, team assignment, capacity limits, and final QA gatekeeping sign-off. | Full admin override; exclusive authority to sign off Stage 4 QA Gatekeeper. |
| **Creative Specialist** | `CREATIVE_SPECIALIST` | Production pod execution, asset creation, deliverable rendering, and technical spec compliance. | Moves briefs from Production into QA Gate with deliverable links. |
| **Stakeholder** | `STAKEHOLDER` | Strategic alignment, executive briefing review, and binding 48-hour SLA approval. | Approves or rejects briefs in `SLA_REVIEW`. |
| **Distribution Lead** | `DISTRIBUTION_LEAD` | Omnichannel syndication, paid campaign allocation, and post-launch retention analytics. | Executes handoff to `PUBLISHED` and manages paid boosting. |

---

## 4. Dynamic 48-Hour SLA Engine

The SLA Engine (`src/lib/sla.ts`) operates on real-time millisecond timestamps:

### Calculations & Algorithms
```typescript
const now = Date.now();
const expiresAt = new Date(asset.slaExpiresAt).getTime();
const remainingMs = expiresAt - now;
const remainingHours = Math.round(remainingMs / 3600000);
```

### Visual Thresholds & Status Codes
1. **Green (Healthy)**: `remainingHours > 24`
   - SLA countdown displays in `#00E599` emerald.
   - Text: `e.g. 42h remaining (SLA On Track)`.
2. **Amber / Gold (Warning Risk)**: `0 <= remainingHours <= 24`
   - SLA countdown displays in `#F5A524` warning amber.
   - Triggers `isSlaRiskAsset()` filter badge: `e.g. 9h remaining (Urgent Review)`.
3. **Red (SLA Breached)**: `remainingHours < 0`
   - SLA countdown displays in `#FF4B55` breach red with pulsing badge.
   - Text: `e.g. 3h OVERDUE (SLA Breached)`.
   - Flashes active breach alert pill in Navbar.

---

## 5. Supabase Database Schema & Sync Engine

### Table 1: `public.profiles`
Stores extended user profile metadata synced directly from user settings:
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'CONTENT_MANAGER',
    department TEXT DEFAULT 'Global Content & Brand Operations',
    team TEXT DEFAULT 'Executive ContentOps Pod',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 2: `public.content_assets`
Stores all lifecycle state, RACI attribution, deliverable links, and SLA timestamps:
```sql
CREATE TABLE public.content_assets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    pillar TEXT NOT NULL,
    format_tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT_BRIEF',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    parent_id TEXT,
    parent_title TEXT,
    hook_strategy TEXT,
    target_audience TEXT,
    platform_specs TEXT,
    safe_zone_requirements TEXT,
    target_kpi TEXT,
    raw_intake_notes TEXT,
    sla_hours INTEGER DEFAULT 48,
    sla_started_at TIMESTAMPTZ,
    sla_expires_at TIMESTAMPTZ,
    is_sla_breached BOOLEAN DEFAULT false,
    qa_tone_approved BOOLEAN DEFAULT false,
    qa_specs_validated BOOLEAN DEFAULT false,
    qa_rights_cleared BOOLEAN DEFAULT false,
    qa_gatekeeper_signed BOOLEAN DEFAULT false,
    qa_signed_by_id TEXT,
    qa_signed_by_name TEXT,
    qa_signed_at TIMESTAMPTZ,
    deliverable_url TEXT,
    attachment_count INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    retention_rate_3s INTEGER,
    reach_impressions TEXT,
    is_winning_format BOOLEAN DEFAULT false,
    paid_eligible BOOLEAN DEFAULT false,
    sent_to_paid_ads BOOLEAN DEFAULT false,
    created_by_id TEXT,
    assigned_to_id TEXT,
    target_publish_at TIMESTAMPTZ,
    history JSONB DEFAULT '[]'::jsonb,
    generated_hooks JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 3: `public.logs` (Post-Deployment Telemetry)
Stores client-side diagnostic telemetry, unhandled exceptions, and SLA breaches:
```sql
CREATE TABLE public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'fatal')),
    event TEXT NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    user_id TEXT,
    user_role TEXT,
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Profile Synchronization Workflow
When an operator modifies their profile settings in `SettingsModal.tsx`:
1. Metadata is packaged into `ProfileDbRow`.
2. `syncUserProfileToSupabase(user)` performs an idempotent upsert:
   ```typescript
   await supabase.from('profiles').upsert({
     id: user.id,
     name: user.name,
     avatar_url: user.avatarUrl,
     role: user.role,
     department: user.department,
     team: user.team,
     updated_at: new Date().toISOString()
   });
   ```
3. If offline or in sandbox mode, fallback stores state in `localStorage` without breaking application flow.

---

## 6. Executive Dashboard & Telemetry Algorithms

The `Dashboard` (`src/components/Dashboard.tsx` and `src/lib/dashboardMetrics.ts`) calculates 30-day velocity metrics using deterministic domain logic:

1. **Velocity Throughput**: 30-day moving window tracking daily outputs categorized into `Hero`, `Hub`, and `Hygiene` tiers.
2. **SLA Compliance Rate**:
   $$\text{Compliance Rate} = \frac{\text{On-Time Cleared}}{\text{On-Time Cleared} + \text{Breached}} \times 100$$
3. **Stage Latency Benchmark**:
   - `1. Brief Drafting`: Target $\le 12\text{h}$
   - `2. Stakeholder Review`: Target $\le 48\text{h}$
   - `3. Production Pod`: Target $\le 48\text{h}$
   - `4. QA Gatekeeper`: Target $\le 24\text{h}$
   - `5. Syndication Handoff`: Target $\le 12\text{h}$
4. **Empty State Guard**:
   When `assets.length === 0`, all summary statistics default safely to baseline constants (e.g. 0% or initial readiness telemetry), completely preventing `NaN`, division-by-zero, or undefined UI errors.

---

## 7. 1-to-10+ Asset Multiplier

The Multiplier engine (`src/components/AssetMultiplierModal.tsx`) decomposes 1 primary **Hero** asset into derivative platform-tailored formats:

- **16:9 Landscape**: YouTube Long-form & Keynote deck.
- **9:16 Vertical Reel**: TikTok / Instagram Reels / YouTube Shorts (-14 LUFS, safe margin zones).
- **1:1 Square Carousel**: LinkedIn Multi-slide PDF & Quote Cards.
- **Micro-Hooks**: Generates 3 hook variations (Contrarian, Curiosity Gap, Direct Value).
- **Derivative Lineage**: Derivative assets maintain `parentId` and `parentTitle` linking back to the parent Hero asset for end-to-end attribution.

---

## 8. Automated Test Suite (36 Tests)

The test suite runs with Node's native test runner (`node:test`) via `tsx` with zero configuration overhead:

```bash
npx tsx --test src/lib/*.test.ts src/components/qa/*.test.ts
```

### Coverage Summary:
- **`stateMachine.test.ts`**: Verifies all 5 transitions, mandatory fields, role authorization, and QA gatekeeper 4-point veto block.
- **`sla.test.ts`**: Verifies millisecond clock calculations, green/gold/red thresholds, and SLA breach triggers.
- **`auth.test.ts`**: Verifies clean production slate (`INITIAL_ASSETS = []`), `DEMO_SEED_ASSETS` templates, and session persistence.
- **`supabase.test.ts` & `profileSync.test.ts`**: Verifies bidirectional snake_case to camelCase conversion, metadata team extraction, and offline fallback.
- **`dashboardMetrics.test.ts`**: Verifies 30-day trend generation, SLA distribution slices, and KPI calculation.
- **`qaValidation.test.ts`**: Verifies media playback formatting, video/image deliverable detection, and gatekeeper veto enforcement.
- **`logger.test.ts`**: Verifies structured error info extraction, circular reference safe serialization, user context tracking, log level routing (`info`, `warn`, `error`, `fatal`), and in-memory ring buffer limits.

---

## 9. Client-Side Telemetry & Production Monitoring

Production stability is enforced via `src/lib/logger.ts` and `src/components/ErrorBoundary.tsx`:

1. **Structured Log Payload**:
   - `level`: `'info' | 'warn' | 'error' | 'fatal'`
   - `event`: Event tag (e.g. `state_machine_guard_rejected`, `window_uncaught_error`, `unhandled_promise_rejection`, `react_error_boundary`, `supabase_asset_upsert_failed`)
   - `message`: Sanitized error or warning message
   - `stack`: Normalized stack trace
   - `context`: JSON-serialized dictionary with circular reference protection
   - `user_id` / `user_role`: Active operator context synchronized on login
   - `url` & `user_agent`: Current client execution environment
   - `created_at`: UTC ISO timestamp
2. **Anti-Recursion Shield**:
   - If a Supabase network request fails while transmitting a log, the logger suppresses secondary errors to prevent infinite request loops.
3. **In-Memory Ring Buffer**:
   - Maintains the last 100 log records in memory (`getRecentLogs()`, `clearRecentLogs()`), enabling diagnostic inspection even in offline or unconfigured environments.
4. **React Error Boundary & Window Listeners**:
   - Catches unhandled promise rejections and React component render errors, automatically dispatches telemetry to `public.logs`, and presents operators with a recovery UI including a one-click "Copy Diagnostics" tool.
