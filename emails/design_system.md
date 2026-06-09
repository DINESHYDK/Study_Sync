# StudySync Email Design System

This design system defines the visual and structural language for all transactional and lifecycle emails sent by StudySync. The system matches the StudySync web app UI, extending the flat, dark-pastel mint-teal theme to the inbox.

---

## 1. Color Tokens

We use a premium dark theme color palette. Since many email clients do not support `@media (prefers-color-scheme)` queries consistently, all emails are styled as **dark mode by default**.

| Token | CSS Value | Application |
| :--- | :--- | :--- |
| **Background** | `#0a0a0f` | Main canvas background |
| **Surface** | `#12121a` | Main content card wrapper |
| **Surface Strong** | `#1a1a27` | Inner tables, list items, statistics containers |
| **Border** | `#2a2a3d` | Dividers, card borders, table cells |
| **Text Primary** | `#f0f0ff` | Headings, body copy |
| **Text Muted** | `#7878a3` | Labels, captions, footer copy |
| **Accent Mint/Teal** | `#2dd4bf` | Primary CTAs, highlights, success states |
| **Accent Sky/Blue** | `#38bdf8` | Secondary metrics, links, secondary states |
| **Accent Gold/Amber** | `#f59e0b` | Streak achievements, warnings |

---

## 2. Typography Scale

Emails load the Google Fonts **Space Grotesk** (for headings) and **Inter** (for body copy), falling back to standard system sans-serif fonts in clients that disable web fonts.

* **Main Headings (H1)**: `28px` to `32px` (Space Grotesk, Bold, Tracking -0.02em, Line-Height 1.25)
* **Sub-Headings (H2)**: `20px` to `22px` (Space Grotesk, Semi-Bold, Line-Height 1.3)
* **Body Copy**: `15px` to `16px` (Inter, Regular, Line-Height 1.5, Text Muted or Text Primary)
* **Monospace / Metric Data**: `24px` to `36px` (JetBrains Mono, Semi-Bold, for OTPs and timers)
* **Footnote / Labels**: `12px` (Inter, Regular, Text Muted)

---

## 3. Spacing System

All vertical and horizontal margins must be set explicitly using table cell paddings to prevent inconsistent rendering across Outlook and Gmail.

* **Outer Container Padding**: `24px` (Desktop) / `16px` (Mobile)
* **Card Inner Padding**: `40px` (Desktop) / `24px` (Mobile)
* **Component Gap**: `20px` to `24px` of vertical space
* **List Item Padding**: `12px` top/bottom, `16px` left/right

---

## 4. Component Library

### Reusable Logo Placement
The StudySync logo should be centered at the top of every email, with a max-width of `32px` for the icon and a clean text wordmark:
```html
<img src="https://studysync.dineshydk.dev/logo.png" alt="StudySync Logo" width="32" height="32" style="display: inline-block; vertical-align: middle; border-radius: 8px;">
<span style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: bold; color: #ffffff; vertical-align: middle; margin-left: 8px; letter-spacing: -0.02em;">StudySync</span>
```

### Primary Action Button (Teal CTA)
* **Background Color**: `#2dd4bf` (mint-teal)
* **Text Color**: `#081e24` (dark slate)
* **Border Radius**: `10px`
* **Padding**: `12px 24px`
* **CSS Properties**:
```css
display: inline-block;
background-color: #2dd4bf;
color: #081e24 !important;
font-family: 'Inter', sans-serif;
font-size: 15px;
font-weight: 600;
text-decoration: none;
border-radius: 10px;
padding: 12px 24px;
text-align: center;
```

### Inner Cards / Metric Panels
* **Background Color**: `#1a1a27`
* **Border**: `1px solid #2a2a3d`
* **Border Radius**: `12px`
* **Padding**: `16px 20px`

---

## 5. Email Client Compatibility & Dark Mode Notes

1. **Inline All Styles**: Do not rely on external CSS. Every tag must contain inline `style="..."` attributes.
2. **Table Layouts**: Use tables (`<table role="presentation">`) for layout grids. Divs are unsupported or poorly supported in older versions of Outlook.
3. **Image Alt Tags**: Always provide descriptive `alt` tags and specify explicit widths and heights on images.
4. **Dark Mode Client Support**:
   * Add `<meta name="color-scheme" content="dark">` to the head.
   * Add `<meta name="supported-color-schemes" content="dark">` to the head.
   * By designing the core HTML with dark background colors (`#0a0a0f`), the emails will render consistently in both default dark mode and light mode clients.
