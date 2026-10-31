// Theme-aware palette: every colour is a CSS variable so `.dark` can remap it.
// Dark mode mirrors each scale (50↔950, 100↔900 … 500 stays) which keeps
// contrast relationships intact: light tints become deep tints, dark text
// becomes light text, and mid-tone accents (buttons, badges) barely move.
import defaultColors from 'tailwindcss/colors';

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const DEFAULT_PALETTES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
];

// Brand palettes: [reference default palette used to fill missing shades, overrides].
const CUSTOM_PALETTES = {
  primary: ['orange', {
    50: '#fff8f0', 100: '#ffe8cc', 200: '#ffd199', 300: '#ffba66', 400: '#ffa333',
    500: '#FF8C00', 600: '#e67e00', 700: '#cc7000', 800: '#b36200', 900: '#995400',
  }],
  accent: ['orange', { 50: '#fff3e0', 500: '#ff9800', 600: '#f57c00' }],
  midnight: ['slate', {}],
  saffron: ['amber', {
    50: '#fff8e7', 100: '#ffefc4', 200: '#ffdf94', 300: '#ffcb5c', 400: '#FFB830',
    500: '#FF8C00', 600: '#e67e00', 700: '#b36200', 800: '#8a4b00',
  }],
  violet: ['violet', {
    50: '#f5f0ff', 100: '#ede6ff', 300: '#c4a8f5', 400: '#a855f7', 500: '#8B5CF6',
    600: '#7C3AED', 700: '#6D28D9', 800: '#4C1D95', 900: '#2D1B69',
  }],
  gold: ['yellow', {
    50: '#fefbf0', 100: '#fcf3d5', 200: '#f9e6a8', 300: '#f5d87a', 400: '#E8C14A',
    500: '#D4AF37', 600: '#b89230', 700: '#8c6a1c', 800: '#6b5016',
  }],
  crimson: ['rose', {
    50: '#fff0f3', 100: '#ffe4ea', 200: '#fecdd6', 400: '#f43f5e', 500: '#BE123C',
    600: '#9f1239', 700: '#881337',
  }],
  jade: ['emerald', {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 400: '#34d399', 500: '#059669',
    600: '#047857', 700: '#065f46', 800: '#064e3b',
  }],
  cream: ['stone', { 50: '#FFFBF5', 100: '#FFF5E6', 200: '#FFE8CC' }],
};

// Always-dark brand surfaces (hero panels); identical in both themes.
const STATIC_PALETTES = {
  deep: { 900: '#1A0A2E', 800: '#2d1555', 700: '#3d1f70' },
};

const WHITE_LIGHT = '#ffffff';
// Cards/panels in dark mode: a warm plum-black that keeps the saffron accents rich.
const WHITE_DARK = '#1b1626';

function rgbChannels(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

const mirror = (shade) => SHADES[SHADES.length - 1 - SHADES.indexOf(shade)];
const ref = (name, shade) => `rgb(var(--c-${name}-${shade}) / <alpha-value>)`;

const colors = { white: 'rgb(var(--c-white) / <alpha-value>)' };
const lightVars = { '--c-white': rgbChannels(WHITE_LIGHT) };
const darkVars = { '--c-white': rgbChannels(WHITE_DARK) };

function register(name, full) {
  colors[name] = {};
  for (const shade of SHADES) {
    colors[name][shade] = ref(name, shade);
    lightVars[`--c-${name}-${shade}`] = rgbChannels(full[shade]);
    darkVars[`--c-${name}-${shade}`] = rgbChannels(full[mirror(shade)]);
  }
}

for (const name of DEFAULT_PALETTES) register(name, defaultColors[name]);
for (const [name, [base, overrides]] of Object.entries(CUSTOM_PALETTES)) {
  register(name, { ...defaultColors[base], ...overrides });
}
Object.assign(colors, STATIC_PALETTES);

const kpi = (name, a, b) =>
  `linear-gradient(135deg, rgb(var(--c-${name}-${a})) 0%, rgb(var(--c-${name}-${b})) 100%)`;

export const themeColors = colors;

export const themeBackgroundImages = {
  'kpi-saffron': kpi('saffron', 50, 100),
  'kpi-crimson': kpi('crimson', 50, 100),
  'kpi-violet': kpi('violet', 50, 100),
  'kpi-jade': kpi('jade', 50, 100),
  'kpi-gold': kpi('amber', 50, 100),
  'kpi-deep': kpi('midnight', 50, 100),
};

/** Tailwind plugin emitting the light/dark variable sets. */
export function themeVariablesPlugin({ addBase }) {
  addBase({
    // `.theme-static` pins a subtree (e.g. dark hero panels) to the light values.
    ':root, .theme-static': lightVars,
    '.dark': darkVars,
    '.dark .theme-static': lightVars,
    // White text sits on saffron/plum surfaces; it must stay white in dark mode.
    '.dark .text-white': { '--c-white': rgbChannels(WHITE_LIGHT) },
  });
}
