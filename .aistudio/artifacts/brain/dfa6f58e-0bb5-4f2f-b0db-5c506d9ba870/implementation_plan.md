# Local Storage Validation & Automatic In-Place Migration Plan

## 1. Overview & Objectives
We will introduce a comprehensive local storage schema validation and automatic in-place migration utility that runs during initialization of the `App` component. When structural discrepancies, missing fields, legacy keys, or invalid enum values are detected in browser storage, the migration script will repair records in-place while preserving user edits and surface a dismissible notification detailing the repairs performed.

---

## 2. Validated Local Storage Keys & Target Schemas

The validation and migration system will audit and repair all four application storage keys (plus legacy key migration):

1. **Pipeline Assets (`contentops_assets_data_v2` & legacy `contentops_assets_data` / `contentops_assets_data_v1`)**
   - **Legacy Migration**: If `contentops_assets_data_v2` is missing but a legacy key exists, migrate its records into `contentops_assets_data_v2` and clean up the obsolete key.
   - **Array & Record Structure Check**: Verify the stored value parses as a non-empty JSON array of objects. If completely unparseable or not an array, restore `INITIAL_ASSETS`.
   - **In-Place Field Repair (`ContentAsset` Interface)**:
     - Verify required string identifiers (`id`, `title`, `createdById`, `createdAt`, `updatedAt`). Backfill from matching seed asset in `INITIAL_ASSETS` (by `id`) or generate safe defaults while keeping user-modified properties.
     - Validate strict enum fields against allowed sets:
       - `pillar`: `'STRATEGY_SERIES' | 'CONTENT_OPS' | 'CROSS_FUNCTIONAL' | 'BRAND_QA' | 'INTELLIGENCE_OPTIMIZATION'` (default: `'CONTENT_OPS'`)
       - `formatTier`: `'HERO' | 'HUB' | 'HYGIENE'` (default: `'HUB'`)
       - `status`: `'DRAFT_BRIEF' | 'SLA_REVIEW' | 'IN_PRODUCTION' | 'QA_GATE' | 'READY_TO_PUBLISH' | 'PUBLISHED'` (default: `'DRAFT_BRIEF'`)
       - `priority`: `'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'` (default: `'MEDIUM'`)
     - Validate numeric & boolean SLA fields (`slaHours` as positive number defaulting to `48`, `isSlaBreached` as boolean, valid ISO date strings for `slaStartedAt` / `slaExpiresAt` when in `SLA_REVIEW`).
     - Validate mandatory 4-point QA Gatekeeper booleans (`qaToneApproved`, `qaSpecsValidated`, `qaRightsCleared`, `qaGatekeeperSigned`) and enforce RACI invariant (if `status === 'READY_TO_PUBLISH'` or `'PUBLISHED'`, ensure QA booleans are consistent).
     - Validate Phase 5 feedback fields (`isWinningFormat`, `paidEligible`, `retentionRate3s` numeric/null) and `generatedHooks` array items (`{ type, script }`).
     - Validate `history` audit log entries so malformed entries are repaired or normalized without losing history.

2. **Active Operator Selection (`contentops_active_user`)**
   - Verify the stored user ID string corresponds to a known user in `SEED_USERS` or the active `AuthSession.user.id`. If invalid or orphaned, repair to the session user ID or default `SEED_USERS[0].id` (`u-elena`).

3. **Authentication Session (`contentops_auth_session`)**
   - Verify stored JSON matches the `AuthSession` interface (`user.id`, `user.name`, `user.email`, valid `user.role` enum, valid `provider` in `'google' | 'email' | 'sso'`, and valid ISO `loginAt` timestamp).
   - Repair missing non-critical fields in-place (e.g., missing `role`, `provider`, or `loginAt`) or clear corrupted session data gracefully so the app never crashes on startup.

4. **AI Engine Configuration (`contentops_ai_config`)**
   - Verify stored JSON matches `AiConfig` (`apiKey` string, `baseUrl` string, `model` string) and backfill any missing string properties with default environment/fallback values.

---

## 3. Architecture & File Changes

### A. Create `/src/lib/storageMigration.ts`
- Define type guards and field-level validators for `ContentAsset`, `AuthSession`, `User`, and `AiConfig`.
- Implement `validateAndMigrateStorage(): StorageMigrationReport`:
  - Returns the validated/repaired `assets`, `activeUser`, `authSession`, and `aiConfig` alongside a structured `StorageMigrationReport`:
    - `hadDiscrepancies: boolean`
    - `repairedKeys: string[]`
    - `repairedAssetCount: number`
    - `migratedFromLegacyKey: boolean`
    - `summaryMessages: string[]` (human-readable list of repairs performed, e.g., *"Repaired 2 asset records with missing QA checklist fields"*).
  - Writes the corrected payloads back to `localStorage` immediately so subsequent reloads are clean.

### B. Update `/src/App.tsx`
- Run `validateAndMigrateStorage()` once during initial state setup in `App` to hydrate `assets`, `authSession`, and `currentUser` from the validated result.
- Store the `StorageMigrationReport` in state if `hadDiscrepancies` is `true`.
- Render a sleek, dismissible notification banner in the `App` workspace when repairs or migrations occur:
  - Styled to match the Thrill ContentOps dark surface system (`#121620` / `#181E2C` with `#F5A524` or `#00E599` status accent and high-contrast typography).
  - Displays a concise summary of what was automatically repaired, an expandable or inline detail list of repaired keys/fields, and a **"Dismiss"** button.

---

## 4. Verification Plan
- **Automated Compilation & Lint**: Run `compile_applet` to ensure zero TypeScript or build errors.
- **Runtime Verification**: Verify the application loads cleanly with existing localStorage data, repairs injected malformed localStorage entries in-place while preserving custom fields, and displays the dismissible repair notification when discrepancies are corrected.
