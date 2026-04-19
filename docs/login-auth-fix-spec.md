# Login Auth Fix Spec

- Scope: login authentication flow only.
- Goal: a wrong password must never preserve or appear to reuse a previous authenticated session.
- Rules:
  - Login requests must clear any existing local session before attempting a new password login.
  - Login failures must redirect back to `/login`, not the marketing homepage.
  - If a valid authenticated session already exists, `/login` should not present a fake second login flow.
  - Dashboard protection must redirect unauthenticated users to `/login`.
- Compatibility:
  - Keep Supabase Auth as the source of truth.
  - Do not change database schemas or user profile fields.

- Opening `/login` should clear any existing local session first.
