# Login Notice Fix Spec

- Scope: login error notice only.
- Goal: sign-in failures should show clear Chinese messages in a visible area below the login navbar.
- Rules:
  - Authentication provider messages exposed to end users should be normalized into Chinese when the meaning is known.
  - The auth notice must not be covered by the login navbar.
  - The notice should remain lightweight and not change the page layout structure.
- Compatibility:
  - Keep Supabase Auth as the source of truth.
  - Do not change the login form field names or redirect paths.
