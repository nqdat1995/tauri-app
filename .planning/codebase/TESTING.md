# TESTING

## Current status
- The codebase does not contain any automated tests.
- There is no test runner, no test scripts in `package.json`, and no `__tests__` or `.test.tsx` files.
- The Rust/Tauri side also has no Rust unit tests or integration tests.

## Recommended entry points for tests
- Frontend component tests for UI modules in `src/components/` and `src/pages/`.
- Unit tests for utility functions and data formatting logic in `src/pages/Home/index.tsx`.
- End-to-end tests for the main navigation and file upload workflow.
- Tauri command tests for `greet` and any future native APIs.

## Tooling recommendations
- Add `vitest` or `jest` for frontend unit and component tests.
- Add `@testing-library/react` for React component testing.
- Add Rust tests under `src-tauri/src/` for backend command validation.
- Add a `test` script to `package.json` once tooling is chosen.

## Gaps
- No test coverage tracking is present.
- No static analysis or linting is configured.
- There is no automated validation of page rendering or app shell behavior.
