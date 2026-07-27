import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.canvas};
    font-family: ${({ theme }) => theme.typography.body};
    font-synthesis: none;
    --navy: ${({ theme }) => theme.colors.brand900};
    --navy-deep: ${({ theme }) => theme.colors.brand950};
    --teal: ${({ theme }) => theme.colors.primary};
    --teal-hover: ${({ theme }) => theme.colors.primaryHover};
    --teal-soft: ${({ theme }) => theme.colors.primarySoft};
    --teal-subtle: ${({ theme }) => theme.colors.primarySubtle};
    --amber: ${({ theme }) => theme.colors.accent};
    --amber-soft: ${({ theme }) => theme.colors.accentSoft};
    --ink: ${({ theme }) => theme.colors.text};
    --muted: ${({ theme }) => theme.colors.textMuted};
    --subtle: ${({ theme }) => theme.colors.textSubtle};
    --line: ${({ theme }) => theme.colors.border};
    --line-strong: ${({ theme }) => theme.colors.borderStrong};
    --surface: ${({ theme }) => theme.colors.surface};
    --surface-muted: ${({ theme }) => theme.colors.surfaceMuted};
    --canvas: ${({ theme }) => theme.colors.canvas};
    --canvas-deep: ${({ theme }) => theme.colors.canvasDeep};
    --danger: ${({ theme }) => theme.colors.danger};
    --danger-soft: ${({ theme }) => theme.colors.dangerSoft};
    --success: ${({ theme }) => theme.colors.success};
    --success-soft: ${({ theme }) => theme.colors.successSoft};
    --warning: ${({ theme }) => theme.colors.warning};
    --warning-soft: ${({ theme }) => theme.colors.warningSoft};
    --white: ${({ theme }) => theme.colors.white};
    --on-dark: ${({ theme }) => theme.colors.onDark};
    --on-dark-muted: ${({ theme }) => theme.colors.onDarkMuted};
    --chart-grid: ${({ theme }) => theme.colors.chartGrid};
    --chart-balance: ${({ theme }) => theme.colors.chartBalance};
    --focus-ring: ${({ theme }) => theme.colors.focusRing};
    --overlay: ${({ theme }) => theme.colors.overlay};
    --nav-hover: ${({ theme }) => theme.colors.navHover};
    --nav-border: ${({ theme }) => theme.colors.navBorder};
    --nav-active: ${({ theme }) => theme.colors.navActive};
    --gradient-brand: ${({ theme }) => theme.gradients.brand};
    --gradient-primary: ${({ theme }) => theme.gradients.primary};
    --gradient-accent: ${({ theme }) => theme.gradients.accent};
    --gradient-canvas: ${({ theme }) => theme.gradients.canvas};
    --gradient-login: ${({ theme }) => theme.gradients.login};
    --shadow-xs: ${({ theme }) => theme.shadows.xs};
    --shadow-sm: ${({ theme }) => theme.shadows.sm};
    --shadow-md: ${({ theme }) => theme.shadows.md};
    --shadow-lg: ${({ theme }) => theme.shadows.lg};
    --shadow-primary: ${({ theme }) => theme.shadows.primary};
    --font-body: ${({ theme }) => theme.typography.body};
    --font-display: ${({ theme }) => theme.typography.display};
  }
  * { box-sizing: border-box; }
  html { min-width: 320px; background: var(--canvas); scroll-behavior: smooth; }
  body { margin: 0; min-height: 100vh; background: var(--gradient-canvas); color: var(--ink); }
  button, input, select, textarea { font: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, p { margin-top: 0; }
  h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.035em; }
  ::selection { background: var(--teal-soft); color: var(--navy); }
  :focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;
