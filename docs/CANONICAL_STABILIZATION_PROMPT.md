# Canonical Stabilization & Security Implementation Prompt

Audit the entire Cognitive Care NER repository and make the deployed application behave as one coherent latest-level product. Before changing code, consult current official web guidance for accessible navigation/focus management, JavaScript lifecycle/error handling, OWASP browser security, and Supabase RLS/sync patterns.

Requirements:
1. Treat game-engine-v6.js as the single canonical game engine. Remove or stop loading legacy game engines, legacy game controls, and duplicate session wrappers.
2. Ensure exactly one game Exit control exists, is accessible, cancels stale timers/callbacks, prevents hidden-session mutations, and returns cleanly to Home.
3. Make navigation single-owner: Home, Progress, Play, Reminders, and You. The You control opens one accessible drawer with Escape-to-close, focus restoration, aria-expanded/aria-controls, inert background, and no duplicate legacy navigation listeners.
4. Consolidate previous-level features into the latest runtime without breaking required functionality. Remove obsolete duplicate source trees and runtime files when they are no longer referenced.
5. Add runtime crash recovery for uncaught errors and rejected promises, while preserving the app shell instead of leaving a blank screen.
6. Make offline-first session persistence idempotent. Completed v6 sessions and game results receive stable client IDs and synchronize through the authenticated Supabase client with RLS; never expose a service-role key.
7. Harden security: strict CSP where supported, secure response headers, input escaping/validation, RLS policies, explicit deny policies for private admin data, protected audit logging, and no client-side privilege escalation.
8. Reconcile the deployed Supabase schema with the application: profiles, caregiver links, cognitive sessions, game results, reminders/tasks, alerts, privacy consents, admin reporting, audit logging, and the secure sync queue must exist and be RLS-protected.
9. Remove fake "synced" states. A record becomes synced only after the authenticated cloud layer acknowledges the write.
10. Run repeated validation: JavaScript syntax, configuration checks, static reference checks, Docker HTTP smoke tests, GitHub Actions quality gate, Supabase security/performance advisors, and final runtime-owner scans. Fix every discovered blocker and rerun the checks.

Do not claim a feature is fixed unless its source, runtime ownership, persistence path, and validation path are consistent. Prefer small deterministic modules, explicit ownership, idempotent identifiers, accessible controls, and safe failure behavior.