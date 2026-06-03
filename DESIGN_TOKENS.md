# AcademIQ Design Tokens

Source inspected: `https://academiq-five.vercel.app/start`

## Fonts

- Heading: `DM Serif Display`, fallback `Georgia, serif`
- Body: `DM Sans`, fallback `system-ui, sans-serif`
- Mono token exposed by host CSS: `JetBrains Mono`, fallback `"Courier New", monospace`

The host preloads Next font assets and exposes them through:

- `--font-heading: "DM Serif Display", Georgia, serif`
- `--font-body: "DM Sans", system-ui, sans-serif`
- `--font-mono: "JetBrains Mono", "Courier New", monospace`

## Color Palette

- Brand subtle: `#fdf4fe`
- Brand muted: `#f8e6f9`
- Brand border: `#f0ccf3`
- Brand default: `#6b0472`
- Brand hover: `#520358`
- Background primary: `#f8fafc`
- Background surface: `#ffffff`
- Background sunken: `#f1f5f9`
- Background border: `#e2e8f0`
- Text primary: `#0f172a`
- Text secondary: `#475569`
- Text muted: `#94a3b8`
- Text inverse: `#ffffff`
- Success: `#16a34a`
- Success background: `#f0fdf4`
- Warning: `#d97706`
- Warning background: `#fffbeb`
- Danger: `#dc2626`
- Danger background: `#fef2f2`
- Info: `#0284c7`
- Info background: `#f0f9ff`

## Radius, Spacing, Shadow

- Radius md: `8px`
- Radius lg: `12px`
- Radius xl: `16px`
- Spacing base: `.25rem`, producing a 4px rhythm
- Sidebar width token: `16rem`
- Card shadow: `0 1px 3px #0000000f, 0 1px 2px #0000000a`
- Modal shadow: `0 20px 60px #00000026`

## Mood

AcademIQ is a light academic portal: quiet slate text, warm white surfaces, generous spacing, rounded cards, soft borders, and a deep plum brand accent. The virtual lab maps those tokens into a dark avionics console: DM Sans remains the body language, DM Serif is used sparingly for institutional headings, the plum brand appears in small identity details, and live telemetry uses sharper green/amber accents for engineering readability.
