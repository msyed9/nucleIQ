# NucleIQ Design System - Visual Guide

## 🎨 Color Palette

### Primary Colors (Trust Blue)
```
██████ #E3F2FD  primary-50   - Lightest blue backgrounds
██████ #BBDEFB  primary-100  - Light blue highlights
██████ #2196F3  primary-500  - Main primary color ⭐
██████ #1976D2  primary-700  - Hover states, darker variant ⭐
██████ #0D47A1  primary-900  - Darkest blue accents
```

### Secondary Colors (Growth Green)
```
██████ #F1F8E9  secondary-50   - Lightest green backgrounds
██████ #8BC34A  secondary-500  - Main secondary color ⭐
██████ #689F38  secondary-700  - Hover states ⭐
```

### Accent Colors (Warm Orange)
```
██████ #FF9800  accent-500  - Main accent color ⭐
██████ #F57C00  accent-700  - Hover states ⭐
```

### Semantic Colors
```
██████ #4CAF50  Success  - Positive actions, confirmations
██████ #FFC107  Warning  - Caution, pending states
██████ #F44336  Error    - Errors, destructive actions
██████ #2196F3  Info     - Information, neutral highlights
```

### Neutral Colors
```
██████ #FFFFFF  neutral-0    - Pure white
██████ #FAFAFA  neutral-50   - Page background ⭐
██████ #F5F5F5  neutral-100  - Card backgrounds
██████ #E0E0E0  neutral-300  - Borders ⭐
██████ #9E9E9E  neutral-500  - Disabled text
██████ #616161  neutral-700  - Secondary text
██████ #212121  neutral-900  - Body text
██████ #000000  neutral-1000 - Pure black
```

### Text Colors
```
██████ #1A237E  text-primary    - Headings, important text ⭐
██████ #546E7A  text-secondary  - Body text, labels ⭐
██████ #78909C  text-tertiary   - Meta text, captions
██████ #B0BEC5  text-disabled   - Disabled state
██████ #FFFFFF  text-inverse    - Text on dark backgrounds
```

## 📏 Typography Scale

```
h1    48px / 3rem     Bold (700)    Headings
h2    36px / 2.25rem  Bold (700)    Section titles
h3    30px / 1.875rem Semibold (600) Subsection titles
h4    24px / 1.5rem   Semibold (600) Card headers
h5    20px / 1.25rem  Semibold (600) Small headers
h6    18px / 1.125rem Semibold (600) Smallest headers

Body Large  18px / 1.125rem  Regular (400)  Large body text
Body        16px / 1rem      Regular (400)  Default body text ⭐
Body Small  14px / 0.875rem  Regular (400)  Small body text

Label       14px / 0.875rem  Semibold (600) Form labels
Caption     12px / 0.75rem   Regular (400)  Captions, meta
Overline    12px / 0.75rem   Semibold (600) Uppercase labels

Button Lg   16px / 1rem      Semibold (600) Large buttons
Button      14px / 0.875rem  Semibold (600) Default buttons ⭐
Button Sm   12px / 0.75rem   Semibold (600) Small buttons
```

## 📐 Spacing Scale (8px Grid)

```
spacing[1]   4px   0.25rem   ▪
spacing[2]   8px   0.5rem    ▪▪
spacing[3]   12px  0.75rem   ▪▪▪
spacing[4]   16px  1rem      ▪▪▪▪ ⭐ Default spacing
spacing[5]   20px  1.25rem   ▪▪▪▪▪
spacing[6]   24px  1.5rem    ▪▪▪▪▪▪ ⭐ Card padding
spacing[8]   32px  2rem      ▪▪▪▪▪▪▪▪ ⭐ Section spacing
spacing[10]  40px  2.5rem    
spacing[12]  48px  3rem      ⭐ Large sections
spacing[16]  64px  4rem      
spacing[24]  96px  6rem      
```

## 🎯 Component Sizes

### Button Heights
```
Small   32px  (2rem)     Compact buttons
Medium  44px  (2.75rem)  Default, mobile touch target ⭐
Large   56px  (3.5rem)   Prominent CTAs
```

### Input Heights
```
Small   32px  (2rem)     Compact forms
Medium  44px  (2.75rem)  Default, mobile touch target ⭐
Large   56px  (3.5rem)   Prominent inputs
```

### Border Radius
```
sm      4px   (0.25rem)  Small elements
base    8px   (0.5rem)   Default
md      12px  (0.75rem)  Inputs, buttons ⭐
lg      16px  (1rem)     Cards ⭐
xl      24px  (1.5rem)   Large cards
2xl     32px  (2rem)     Extra large
full    9999px           Pills, circles
```

## 🌑 Shadow Elevation

```
xs      Subtle hover          0 1px 2px rgba(0,0,0,0.05)
sm      Small cards           0 2px 4px rgba(0,0,0,0.06)
base    Default elevation     0 4px 6px rgba(0,0,0,0.08)
md      Medium elevation      0 8px 12px rgba(0,0,0,0.1)
lg      High elevation        0 12px 24px rgba(0,0,0,0.12)
xl      Very high             0 20px 32px rgba(0,0,0,0.15)
2xl     Maximum elevation     0 24px 48px rgba(0,0,0,0.18)

card         Default cards    0 2px 8px rgba(0,0,0,0.06) ⭐
cardHover    Hover state      0 8px 24px rgba(0,0,0,0.12) ⭐
modal        Modals           0 20px 60px rgba(0,0,0,0.3)
dropdown     Dropdowns        0 8px 16px rgba(0,0,0,0.15)
focusRing    Focus state      0 0 0 3px rgba(33,150,243,0.1) ⭐
```

## ⚡ Transition Timing

```
Fast      150ms   Micro-interactions, hover states
Normal    200ms   Default transitions ⭐
Moderate  300ms   Larger animations
Slow      500ms   Emphasis animations

Easing Functions:
- ease-in-out    cubic-bezier(0.4, 0, 0.2, 1)  ⭐ Default
- ease-in        cubic-bezier(0.4, 0, 1, 1)
- ease-out       cubic-bezier(0, 0, 0.2, 1)
- bounce         cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

## 🧩 Component Variants

### Button
```
Primary     Blue gradient     Main actions ⭐
Secondary   Green gradient    Secondary actions
Outline     Transparent       Tertiary actions
Ghost       No border         Subtle actions
Danger      Red gradient      Destructive actions
Success     Green gradient    Confirmations
```

### Card
```
Default     Subtle shadow     Standard cards ⭐
Outlined    Border only       Minimal cards
Elevated    Strong shadow     Important cards
```

### Badge
```
Primary     Blue background   General labels
Secondary   Green background  Secondary info
Success     Green background  Success states ⭐
Warning     Yellow background Warning states ⭐
Error       Red background    Error states ⭐
Info        Blue background   Information
Neutral     Gray background   Neutral labels
```

### Input States
```
Default     Gray border       Normal state
Focus       Blue border       Active input ⭐
Error       Red border        Validation error ⭐
Success     Green border      Validation success
Disabled    Gray background   Disabled state
```

## 📱 Responsive Breakpoints

```
Mobile      < 768px    Single column, stacked layout
Tablet      768-1024px Two columns, compact spacing
Desktop     > 1024px   Multi-column, full spacing ⭐
```

### Touch Targets (Mobile)
```
Minimum     44px × 44px   WCAG requirement ⭐
Comfortable 48px × 48px   Recommended
Large       56px × 56px   Prominent actions
```

## ♿ Accessibility

### Color Contrast (WCAG 2.1 AA)
```
Normal Text     4.5:1   Minimum ratio ⭐
Large Text      3:1     18px+ or 14px+ bold
UI Components   3:1     Borders, icons
```

### Focus Indicators
```
Outline         2px solid blue
Offset          2px
Ring            3px rgba(33,150,243,0.1) ⭐
```

### ARIA Labels
```
Required for:
- Icon-only buttons
- Form inputs
- Interactive elements
- Status messages
```

## 🎨 Usage Guidelines

### When to Use Each Color

**Primary Blue (#2196F3)**
- Main navigation
- Primary buttons
- Links
- Active states
- Important highlights

**Secondary Green (#8BC34A)**
- Success messages
- Positive trends
- Growth indicators
- Secondary actions

**Accent Orange (#FF9800)**
- Call-to-action buttons
- Important notifications
- Pending fees
- Warnings that need attention

**Success Green (#4CAF50)**
- Confirmation messages
- Completed tasks
- Positive status
- Available states

**Warning Yellow (#FFC107)**
- Caution messages
- Pending states
- Alerts
- Incomplete tasks

**Error Red (#F44336)**
- Error messages
- Destructive actions
- Failed states
- Overdue items

### Typography Hierarchy

```
Page Title          h1 (48px)
Section Title       h2 (36px)
Subsection Title    h3 (30px)
Card Header         h4 (24px)
List Header         h5 (20px)
Small Header        h6 (18px)
Body Text           body (16px) ⭐
Small Text          bodySmall (14px)
Caption/Meta        caption (12px)
```

### Spacing Patterns

```
Between elements in a card:     spacing[4] (16px)
Card padding:                   spacing[6] (24px) ⭐
Section spacing:                spacing[8] (32px)
Page margins:                   spacing[4] (16px)
Gap in flex/grid:               spacing[4] (16px)
Between sections:               spacing[12] (48px)
```

## 📊 Component Composition

### Dashboard KPI Grid
```
Grid: repeat(auto-fit, minmax(280px, 1fr))
Gap: 1.5rem (24px)
Card: KPICard component
Hover: translateY(-4px)
```

### Form Layout
```
Container: Card with padding="lg"
Inputs: Stack with gap spacing[4]
Labels: Above inputs, semibold
Buttons: Full width on mobile
```

### Data Table
```
Header: Background neutral-50
Rows: Border-bottom neutral-300
Hover: Background neutral-50
Padding: spacing[4] (16px)
```

---

**Legend:**
⭐ = Most commonly used value
██████ = Color swatch
▪ = Spacing unit (4px)
