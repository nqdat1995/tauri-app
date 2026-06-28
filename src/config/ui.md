# UI tokens (src/config/ui.ts)

This document lists the theme tokens available in `src/config/ui.ts` and the CSS variables set by `applyTheme()`.

## Theme shape

- `fontFamily` (string)
- `fontSizes` (object): `base`, `sm`, `md`, `lg`, `xl`
- `colors` (object): `bg`, `surface`, `surfaceStrong`, `text`, `muted`, `brand`, `brandSoft`, `border`, `shadow`
- `radius` (string)
- `radiusLg` (string)
- `spacing` (object): `xs`, `sm`, `md`, `lg`, `xl`
- `breakpoints` (object): `mobile`

## CSS variables written by `applyTheme()`

- `--font-family`
- `--font-size-base`, `--font-size-sm`, `--font-size-md`, `--font-size-lg`, `--font-size-xl`
- `--bg`, `--surface`, `--surface-strong`, `--text`, `--muted`, `--brand`, `--brand-soft`, `--border`, `--shadow`
- `--radius`, `--radius-lg`
- `--gap-xs`, `--gap-sm`, `--gap-md`, `--gap-lg`, `--gap-xl`
- `--breakpoint-mobile`

## Default values (from `ui` export)

- `--font-family`: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif
- `--font-size-base`: `16px` (sm: `13px`, md: `15px`, lg: `18px`, xl: `24px`)
- `--bg`: `#f4f6fb`
- `--surface`: `#ffffff`
- `--surface-strong`: `#eef1f9`
- `--text`: `#1f2937`
- `--muted`: `#6b7280`
- `--brand`: `#5b44ff`
- `--brand-soft`: `rgba(91, 68, 255, 0.12)`
- `--border`: `#e5e7eb`
- `--shadow`: `0 24px 80px rgba(99, 102, 241, 0.08)`
- `--radius`: `14px`, `--radius-lg`: `24px`
- spacing (`--gap-*`): xs `6px`, sm `8px`, md `16px`, lg `24px`, xl `32px`
- `--breakpoint-mobile`: `980px`

## How to use

1. Import and call `applyTheme()` early in your app (e.g. in `src/App.tsx` or `src/main.tsx`).

```ts
import applyTheme from './config/ui';
applyTheme();
```

2. Use the CSS variables in your stylesheets:

```css
body { font-family: var(--font-family); background: var(--bg); color: var(--text); }
.card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
```

3. To change the theme at runtime, create a `Theme` object that matches the exported shape and call `applyTheme(myTheme)`.

## Notes

- `applyTheme()` writes variables to `:root`, making them available globally.
- Prefer referencing variables in `src/styles.css` to keep components consistent.
