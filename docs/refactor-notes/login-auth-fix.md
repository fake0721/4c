# Login Auth Fix

- Module: login authentication only.
- Cleared any existing local Supabase session before password sign-in attempts.
- Redirected login failures back to `/login` instead of the homepage.
- Added a login-page session reset hook and `/auth/session/clear` route to clear stale local cookies after failed sign-in attempts.
- Added a server-side guard so authenticated users do not stay on the login page unless the stale-session clear flow is active.
- Redirected unauthenticated dashboard requests to `/login`.
- Build verification: `npm run build` passed.
