---
name: Celestial Gastronomy
colors:
  surface: '#19120a'
  surface-dim: '#19120a'
  surface-bright: '#40382e'
  surface-container-lowest: '#130d06'
  surface-container-low: '#211a12'
  surface-container: '#251e16'
  surface-container-high: '#302920'
  surface-container-highest: '#3c332a'
  on-surface: '#eee0d2'
  on-surface-variant: '#d7c3ae'
  inverse-surface: '#eee0d2'
  inverse-on-surface: '#372f26'
  outline: '#9f8e7a'
  outline-variant: '#524534'
  surface-tint: '#ffb955'
  primary: '#ffc880'
  on-primary: '#452b00'
  primary-container: '#f5a623'
  on-primary-container: '#644000'
  inverse-primary: '#835500'
  secondary: '#d2bcff'
  on-secondary: '#3c167c'
  secondary-container: '#533294'
  on-secondary-container: '#c3a6ff'
  tertiary: '#9bd9ff'
  on-tertiary: '#00344a'
  tertiary-container: '#3ac2ff'
  on-tertiary-container: '#004d6a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb4'
  primary-fixed-dim: '#ffb955'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#633f00'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bcff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#533294'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7cd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#19120a'
  on-background: '#eee0d2'
  surface-variant: '#3c332a'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: auto
---

## Brand & Style
The design system embodies a premium, futuristic aesthetic tailored for a high-end AI concierge. It evokes a sense of exclusivity and technological sophistication, positioning the product as an intelligent guide through the culinary world.

The visual direction is **Glassmorphism** set against a deep, atmospheric backdrop. It utilizes translucent layers, vibrant background blurs, and subtle luminosity to create depth. The interface should feel like a high-tech "heads-up display" for dining, where elements appear to float over a vast, dark canvas. All interactions must feel fluid and responsive, utilizing soft glows rather than harsh shadows to indicate focus and state.

## Colors
The palette is centered on a "Deep Space" foundation. The primary background uses a subtle radial gradient starting from a dark navy (#161625) at the top right to deep charcoal (#0F0F13) at the bottom left.

- **Primary (Amber/Gold):** Reserved for high-intent actions, star ratings, and critical highlights. It represents the "warmth" of the dining experience.
- **Secondary (Violet):** Used for AI-generated suggestions, tags, and category badges to signify the "intelligence" layer.
- **Surface:** Components utilize a semi-transparent hex (#1A1A24) at 70% opacity to facilitate glassmorphism effects.
- **Borders:** All glass elements feature a 1px stroke of `rgba(255, 255, 255, 0.1)` to define edges against the dark background.

## Typography
The system uses **Outfit** exclusively to maintain a clean, geometric, and modern appearance. 

Headlines should be bold and tightly leaded to create a strong visual impact. For large display text, use a slight negative letter spacing to enhance the "premium" feel. Body text remains airy and highly legible with a generous line height. All labels and overlines should use medium or semi-bold weights to remain distinct even at smaller sizes against dark backgrounds.

## Layout & Spacing
This design system follows a **Mobile-First Fluid Grid** philosophy. On mobile devices, a 4-column grid is used with 20px side margins. On desktop, the content is centered within a 12-column fixed container (max-width: 1200px).

The spacing rhythm is based on a 4px baseline, but primary components should gravitate towards `md` (24px) for internal padding to ensure a luxurious, spacious feel. Overlap is encouraged; for instance, card elements can slightly break the container bounds or use negative margins to create a more dynamic, layered composition.

## Elevation & Depth
Depth is communicated through **translucency and blur** rather than traditional Y-axis shadows. 

1.  **Base Layer:** The deep charcoal gradient background.
2.  **Surface Layer:** Glass cards with `backdrop-filter: blur(12px)` and `rgba(26, 26, 36, 0.7)` background.
3.  **Floating Layer:** Modals and tooltips utilize a higher blur (20px) and a slightly brighter border (`rgba(255, 255, 255, 0.2)`).

Instead of drop shadows, use **Outer Glows** for active states. When a user interacts with a primary element, apply a soft, 15px-spread amber glow (`rgba(245, 166, 35, 0.3)`) to simulate the element emitting light.

## Shapes
The shape language is consistently **Rounded**. This softens the futuristic "tech" edge, making the AI feel more approachable and organic. 

- **Standard Cards:** Use `rounded-lg` (1rem / 16px).
- **Buttons and Inputs:** Use `rounded-lg` (1rem / 16px) for a consistent rhythm.
- **Tags and Badges:** Use `rounded-xl` (1.5rem / 24px) or full pill-shape to distinguish them from structural elements.
- **Images:** Must always feature the same corner radius as their parent containers to maintain the glass enclosure effect.

## Components
- **Buttons:** Primary buttons are solid Amber (#F5A623) with dark text (#0F0F13). Secondary buttons use the glass style with a white border. All buttons have a 300ms transition and scale slightly (0.98) on click.
- **Glass Cards:** The signature component. Featuring a 1px top-down linear gradient border (white at 20% to white at 5%) to simulate light hitting the top edge.
- **Input Fields:** Semi-transparent dark backgrounds with a 1px border. On focus, the border transitions to Primary Amber with a subtle inner glow.
- **Chips/Tags:** Secondary Violet (#7C5CBF) backgrounds at 20% opacity with solid violet text. Used for "AI-Powered" features or food categories.
- **Rating Stars:** Always Primary Amber, featuring a small "bloom" or glow effect when at 5 stars.
- **Interactive Lists:** List items should have a hover state that slightly brightens the glass background and shifts the content 4px to the right.
- **AI Pulse:** A custom component—a soft, pulsing violet glow behind AI-recommended restaurants to draw the eye without being intrusive.