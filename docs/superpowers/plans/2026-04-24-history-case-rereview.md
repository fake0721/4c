# History Case Re-review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-place "重新复盘" flow to the history cases page so completed review cases can be edited without leaving the page, while preserving a revision trail.

**Architecture:** Keep `review_cases` as the source of truth for the latest review result and add a separate `review_case_revisions` table for change history. Load lightweight edit data through the history cases page data loader, expose dedicated API actions for modal load/save, and render the editor as a focused modal component owned by the history cases page.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Supabase SQL schema scripts, Supabase server client, existing `/api/inner-data` JSON API.

---

## File Structure

### Files to Create
- `supabase/phase-10-review-case-revisions.sql`
  - Create the `review_case_revisions` table, indexes, RLS, and authenticated owner policies.
- `lib/dashboard/review-case-revisions.ts`
  - Define revision snapshot types and helpers for snapshot extraction and summary formatting.
- `components/dashboard/pages/history-cases/history-case-rereview-modal.tsx`
  - Render the lightweight re-review modal, form fields, loading/error states, and revision summary list.
- `docs/superpowers/plans/2026-04-24-history-case-rereview.md`
  - This implementation plan.

### Files to Modify
- `lib/dashboard/history-cases.ts`
  - Extend `HistoryCaseRow` with edit-ready values and keep server-loaded list rows aligned with the modal defaults.
- `app/api/inner-data/route.ts`
  - Add actions to load re-review modal data and save re-review changes transactionally.
- `components/dashboard/pages/history-cases/history-cases-page.tsx`
  - Add the `重新复盘` action, modal state, fetch/save handlers, optimistic row refresh, and notice handling.

### Files to Inspect While Implementing
- `supabase/phase-2-rules-and-review.sql`
  - Match current review table conventions and existing RLS style.
- `lib/dashboard/reviews.ts`
  - Confirm updated `review_cases` fields remain compatible with `/dashboard/reviews?reviewCaseId=...`.

### Testing / Verification Commands
- `npm run lint`
- `npm run build`
- Manual browser verification on `/dashboard/history-cases` and `/dashboard/reviews?reviewCaseId=...`

### Notes
- The repo currently has no established automated UI test suite for this area. Do not add Jest/Vitest/Playwright as part of this feature.
- Prefer small commits after each completed task.

### Task 1: Add Revision Storage Schema

**Files:**
- Create: `supabase/phase-10-review-case-revisions.sql`
- Inspect: `supabase/phase-2-rules-and-review.sql`

- [ ] **Step 1: Review the existing review schema and RLS style**

Inspect:
- `supabase/phase-2-rules-and-review.sql`

Confirm:
- naming conventions for review tables
- owner-based RLS policy structure
- whether existing review tables use `auth.uid()` or `user_id` checks directly

- [ ] **Step 2: Write the new SQL migration for revision history**

Create `supabase/phase-10-review-case-revisions.sql` with:
- `review_case_revisions` table
- `review_case_id` foreign key to `review_cases`
- `user_id` foreign key to `auth.users`
- `before_snapshot jsonb`
- `after_snapshot jsonb`
- `created_at timestamptz default now()`
- index on `(review_case_id, created_at desc)`
- RLS enablement
- select/insert policies limited to the owning user

- [ ] **Step 3: Self-check the migration content for consistency**

Verify in the file:
- foreign keys use `on delete cascade`
- policies only expose the owner’s rows
- no extra columns beyond the approved spec

Expected:
- The migration is focused only on revision storage and security.

- [ ] **Step 4: Commit the schema task**

Run:
```bash
git add supabase/phase-10-review-case-revisions.sql
git commit -m "feat: add review case revision storage"
```

### Task 2: Add Shared Revision Mapping Helpers

**Files:**
- Create: `lib/dashboard/review-case-revisions.ts`
- Inspect: `lib/dashboard/history-cases.ts`
- Inspect: `app/api/inner-data/route.ts`

- [ ] **Step 1: Define the snapshot and summary types**

Create types for:
- `ReviewCaseSnapshot`
- `ReviewCaseRevisionSummary`

Include fields:
- `finalErrorType`
- `finalRiskLevel`
- `reviewNote`
- `updatedAt`

- [ ] **Step 2: Add helper functions for snapshot extraction**

Implement helpers such as:
- `buildReviewCaseSnapshot(reviewCaseRow)`
- `summarizeReviewCaseRevision(beforeSnapshot, afterSnapshot, createdAt)`

Summary output should support:
- type change text
- risk change text
- note-changed boolean or label

- [ ] **Step 3: Keep the helpers UI-agnostic**

Verify:
- no React imports
- no API response shaping mixed with DB reads
- summary labels are generic enough to reuse in both API and UI

- [ ] **Step 4: Commit the helper task**

Run:
```bash
git add lib/dashboard/review-case-revisions.ts
git commit -m "feat: add review case revision helpers"
```

### Task 3: Extend History Case Read Models

**Files:**
- Modify: `lib/dashboard/history-cases.ts`
- Inspect: `lib/dashboard/reviews.ts`

- [ ] **Step 1: Extend `HistoryCaseRow` with edit-ready fields**

Add:
- `issueTypeValue`
- `riskValue`
- `reviewNote`

Make sure they are populated from:
- `review_cases.final_error_type`
- `review_cases.final_risk_level`
- `review_cases.review_note`

- [ ] **Step 2: Keep display labels and raw values aligned**

Update the row mapping so that:
- `typeLabel` stays display-ready
- `riskLabel` stays display-ready
- `issueTypeValue` and `riskValue` preserve raw values for editing

- [ ] **Step 3: Verify downstream compatibility**

Review:
- existing filters still use display labels
- history rows still sort by `updatedAt`
- no existing consumer breaks due to the new fields being added

- [ ] **Step 4: Commit the read-model task**

Run:
```bash
git add lib/dashboard/history-cases.ts
git commit -m "feat: extend history case data for rereview"
```

### Task 4: Add Re-review Load and Save API Actions

**Files:**
- Modify: `app/api/inner-data/route.ts`
- Create: `lib/dashboard/review-case-revisions.ts`
- Inspect: `supabase/phase-10-review-case-revisions.sql`

- [ ] **Step 1: Add a load action for the modal**

Add a new POST action, for example:
- `history-case-rereview-load`

Behavior:
- validate `reviewCaseId`
- ensure the record belongs to the current user
- ensure `review_status === "completed"`
- return:
  - latest editable fields
  - readonly case metadata
  - recent revision summaries

- [ ] **Step 2: Add the save action**

Add:
- `history-case-rereview`

Behavior:
- validate payload
- load current row as `before_snapshot`
- update `review_cases`
- insert one `review_case_revisions` row
- return:
  - updated history row payload for table refresh
  - recent revision summaries
  - success message

- [ ] **Step 3: Keep the write path atomic in practice**

Implement save flow so that:
- if the main update fails, no revision is written
- if revision insert fails, the request returns failure instead of pretending success
- invalid status and missing ownership return explicit errors

If the project uses no DB transaction wrapper here, keep the code ordered and fail-fast, and add clear error handling around the revision insert.

- [ ] **Step 4: Reuse shared summary helpers**

Use `lib/dashboard/review-case-revisions.ts` instead of rebuilding summary strings inline in the route.

- [ ] **Step 5: Commit the API task**

Run:
```bash
git add app/api/inner-data/route.ts lib/dashboard/review-case-revisions.ts
git commit -m "feat: add history case rereview api"
```

### Task 5: Build the Re-review Modal UI

**Files:**
- Create: `components/dashboard/pages/history-cases/history-case-rereview-modal.tsx`
- Inspect: `components/dashboard/pages/reviews/review-detail.tsx`

- [ ] **Step 1: Create a focused modal component**

Build a client component that accepts:
- open/close state
- readonly case metadata
- editable form values
- revision summaries
- loading/saving/error props
- callbacks for field changes and save

- [ ] **Step 2: Implement the approved form scope**

Render only:
- 异常类型
- 风险等级
- 复盘说明

Render readonly context above the form:
- 问题名称
- 来源日志
- 最近复盘时间
- 事件 ID

- [ ] **Step 3: Add the revision summary section**

Show:
- empty state when no prior revisions exist
- latest few revision summaries when present

Do not add:
- full diff viewer
- navigation to a dedicated history page

- [ ] **Step 4: Keep the component visually aligned with the existing dashboard**

Match:
- existing modal overlay pattern from `history-cases-page.tsx`
- existing form field styling from dashboard review UI

- [ ] **Step 5: Commit the modal task**

Run:
```bash
git add components/dashboard/pages/history-cases/history-case-rereview-modal.tsx
git commit -m "feat: add history case rereview modal"
```

### Task 6: Integrate Modal Actions Into the History Cases Page

**Files:**
- Modify: `components/dashboard/pages/history-cases/history-cases-page.tsx`
- Create: `components/dashboard/pages/history-cases/history-case-rereview-modal.tsx`

- [ ] **Step 1: Add per-row `重新复盘` entry points**

Update the action cell so:
- only `已复盘` rows show `重新复盘`
- `查看复盘` and `删除` keep their current behavior

- [ ] **Step 2: Add page state for modal load/edit/save**

Add state for:
- selected row
- modal visibility
- modal loading
- modal saving
- modal error
- editable draft values
- revision summary list

- [ ] **Step 3: Wire the load request**

On `重新复盘` click:
- open modal
- call `history-case-rereview-load`
- populate the form with returned values
- show a loading state while data is in flight

- [ ] **Step 4: Wire the save request and row refresh**

On save:
- call `history-case-rereview`
- update the matching row in local `rows` state
- replace modal revision summaries with the returned latest list
- keep the modal open on failure
- show success notice on completion

- [ ] **Step 5: Keep filters and pagination stable after local refresh**

Verify:
- updating one row does not reset the current page
- existing filters remain applied
- the refreshed row still participates in current filtering and sorting rules

- [ ] **Step 6: Commit the page integration task**

Run:
```bash
git add components/dashboard/pages/history-cases/history-cases-page.tsx components/dashboard/pages/history-cases/history-case-rereview-modal.tsx
git commit -m "feat: add rereview flow to history cases page"
```

### Task 7: Verify Cross-page Consistency

**Files:**
- Inspect: `lib/dashboard/reviews.ts`
- Inspect: `components/dashboard/pages/history-cases/history-cases-page.tsx`
- Inspect: `app/api/inner-data/route.ts`

- [ ] **Step 1: Confirm review detail pages still consume the same updated fields**

Review `lib/dashboard/reviews.ts` and confirm it already reads:
- `final_error_type`
- `final_risk_level`
- `review_note`

Expected:
- `/dashboard/reviews?reviewCaseId=...` will show updated values after refresh without extra feature work.

- [ ] **Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected:
- no new lint errors in touched files

- [ ] **Step 3: Run production build**

Run:
```bash
npm run build
```

Expected:
- successful Next.js production build

- [ ] **Step 4: Perform manual browser verification**

Check:
1. `已复盘` rows show `重新复盘`
2. modal default values match the selected row
3. save updates the row in-place
4. revision summary appears after the first edit
5. non-`已复盘` rows do not show `重新复盘`
6. `/dashboard/reviews?reviewCaseId=...` shows the updated review content after refresh

- [ ] **Step 5: Commit the verification task**

Run:
```bash
git add .
git commit -m "test: verify history case rereview flow"
```

## Execution Notes
- Do not broaden scope into knowledge-base backfill, rule generation, or full version history browsing.
- If `history-cases-page.tsx` becomes too crowded during implementation, prefer moving modal-only state helpers into the new modal file or a local helper rather than adding unrelated abstractions.
- Preserve all existing delete behavior and notices.
- If the SQL migration cannot be applied immediately in the target environment, gate the UI behind successful API responses rather than shipping a broken save path.
