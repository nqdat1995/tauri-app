export type Theme = {
  fontFamily: string;
  fontSizes: { base: string; sm: string; md: string; lg: string; xl: string };
  colors: {
    bg: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    muted: string;
    brand: string;
    brandSoft: string;
    border: string;
    shadow: string;
  };
  radius: string;
  radiusLg: string;
  spacing: { xs: string; sm: string; md: string; lg: string; xl: string };
  breakpoints: { mobile: string };
};

export const ui: Theme = {
  fontFamily:
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif',
  fontSizes: { base: '16px', sm: '13px', md: '15px', lg: '18px', xl: '24px' },
  colors: {
    bg: '#f4f6fb',
    surface: '#ffffff',
    surfaceStrong: '#eef1f9',
    text: '#1f2937',
    muted: '#6b7280',
    brand: '#5b44ff',
    brandSoft: 'rgba(91, 68, 255, 0.12)',
    border: '#e5e7eb',
    shadow: '0 24px 80px rgba(99, 102, 241, 0.08)'
  },
  radius: '14px',
  radiusLg: '24px',
  spacing: { xs: '6px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  breakpoints: { mobile: '980px' }
};

export function applyTheme(theme: Theme = ui) {
  const r = document.documentElement;
  r.style.setProperty('--font-family', theme.fontFamily);
  r.style.setProperty('--font-size-base', theme.fontSizes.base);
  r.style.setProperty('--font-size-sm', theme.fontSizes.sm);
  r.style.setProperty('--font-size-md', theme.fontSizes.md);
  r.style.setProperty('--font-size-lg', theme.fontSizes.lg);
  r.style.setProperty('--font-size-xl', theme.fontSizes.xl);

  r.style.setProperty('--bg', theme.colors.bg);
  r.style.setProperty('--surface', theme.colors.surface);
  r.style.setProperty('--surface-strong', theme.colors.surfaceStrong);
  r.style.setProperty('--text', theme.colors.text);
  r.style.setProperty('--muted', theme.colors.muted);
  r.style.setProperty('--brand', theme.colors.brand);
  r.style.setProperty('--brand-soft', theme.colors.brandSoft);
  r.style.setProperty('--border', theme.colors.border);
  r.style.setProperty('--shadow', theme.colors.shadow);

  r.style.setProperty('--radius', theme.radius);
  r.style.setProperty('--radius-lg', theme.radiusLg);

  r.style.setProperty('--gap-xs', theme.spacing.xs);
  r.style.setProperty('--gap-sm', theme.spacing.sm);
  r.style.setProperty('--gap-md', theme.spacing.md);
  r.style.setProperty('--gap-lg', theme.spacing.lg);
  r.style.setProperty('--gap-xl', theme.spacing.xl);

  r.style.setProperty('--breakpoint-mobile', theme.breakpoints.mobile);
}

export default ui;
