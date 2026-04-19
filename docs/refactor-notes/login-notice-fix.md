# Login Notice Fix

- Module: login notice only.
- Normalized known sign-in error messages into Chinese before redirecting back to `/login`.
- Moved the auth notice below the fixed login navbar and raised its layer so it is immediately visible.
- Kept the existing login form layout and redirect flow unchanged.
- Build verification: `npm run build` passed.
