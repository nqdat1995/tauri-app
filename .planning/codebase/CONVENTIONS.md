# CONVENTIONS

## Code conventions
- TypeScript is used across the frontend, with explicit type annotations for props and local state.
- React function components are the primary UI pattern.
- Component files use PascalCase names matching exported component names.
- UI strings are currently written in Vietnamese.
- `useEffect` is used for side effects such as theme application and window control.

## Styling conventions
- Global CSS is defined in `src/styles.css` and shared across the app.
- Theme tokens are centralized in `src/config/ui.ts`.
- Color, spacing, and radius values are exposed as CSS variables for runtime styling.
- Class names are simple and semantic, such as `app`, `sidebar`, `page-header`, and `video-card`.

## Project conventions
- The app follows a page-per-feature pattern under `src/pages/`.
- Shared components live under `src/components/`.
- Configuration and theme code lives under `src/config/`.
- Native desktop integration is isolated under `src-tauri/`.

## Potential improvement areas
- Add linting and formatting rules to enforce consistent style.
- Standardize component props and text localization.
- Establish naming conventions for event handlers, state setters, and helper functions.
- Add more granular reusable components for repeated UI patterns.
