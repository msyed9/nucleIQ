# NucleiQ Design System

A comprehensive, accessible design system for the NucleiQ School ERP platform, optimized for government schools and low-tech users.

## 🎨 Design Principles

1. **Trust-First**: Calming blue/green color palette that evokes education and reliability
2. **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios and ARIA labels
3. **Mobile-First**: 44px minimum touch targets, responsive typography, optimized for low-bandwidth
4. **Consistency**: Reusable components and design tokens for unified experience
5. **Localization**: Telugu/English support with Inter font family

## 📦 Installation

The design system is already integrated into the project. Import components and tokens as needed:

```tsx
import { Button, Card, Input, Badge, KPICard } from '@/design-system';
import { colors, typography, spacing } from '@/design-system';
```

## 🎯 Design Tokens

### Colors

Education-focused color palette with semantic meanings:

```tsx
import { colors } from '@/design-system';

// Primary - Trust Blue
colors.primary[500] // #2196F3
colors.primary[700] // #1976D2

// Secondary - Growth Green
colors.secondary[500] // #8BC34A
colors.secondary[700] // #689F38

// Accent - Warm Orange (CTAs)
colors.accent[500] // #FF9800

// Semantic Colors
colors.success[500] // #4CAF50
colors.warning[500] // #FFC107
colors.error[500] // #F44336
colors.info[500] // #2196F3
```

### Typography

Inter font family with responsive type scale:

```tsx
import { typography } from '@/design-system';

// Font sizes
typography.fontSize.base // 1rem (16px)
typography.fontSize['2xl'] // 1.5rem (24px)

// Text styles
typography.textStyles.h1 // { fontSize: '3rem', fontWeight: 700, ... }
typography.textStyles.body // { fontSize: '1rem', fontWeight: 400, ... }
```

### Spacing

8px grid system with semantic spacing:

```tsx
import { spacing, semanticSpacing } from '@/design-system';

// Base spacing
spacing[4] // 1rem (16px)
spacing[8] // 2rem (32px)

// Semantic spacing
semanticSpacing.cardPadding.md // 1.5rem (24px)
semanticSpacing.touchTarget.min // 2.75rem (44px)
```

### Shadows

Elevation system for depth and hierarchy:

```tsx
import { shadows } from '@/design-system';

shadows.card // '0 2px 8px rgba(0, 0, 0, 0.06)'
shadows.cardHover // '0 8px 24px rgba(0, 0, 0, 0.12)'
shadows.focusRing // '0 0 0 3px rgba(33, 150, 243, 0.1)'
```

## 🧩 Components

### Button

Accessible button with multiple variants and states.

```tsx
import { Button } from '@/design-system';
import { Save, ArrowRight } from 'lucide-react';

// Primary button
<Button variant="primary" size="lg">
  Save Changes
</Button>

// With icons
<Button variant="secondary" iconLeft={Save}>
  Save
</Button>

<Button variant="outline" iconRight={ArrowRight}>
  Next
</Button>

// Icon-only button
<Button variant="ghost" iconOnly={Save} aria-label="Save" />

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>

// Full width
<Button variant="primary" fullWidth>
  Submit
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `iconLeft`, `iconRight`, `iconOnly`: LucideIcon component

### Card

Flexible container component with elevation.

```tsx
import { Card } from '@/design-system';

// Basic card
<Card>
  <p>Card content</p>
</Card>

// With header and footer
<Card
  header={<h3>Student Details</h3>}
  footer={<Button>Edit</Button>}
  padding="lg"
>
  <p>Student information...</p>
</Card>

// Hoverable card
<Card hoverable>
  <p>Hover over me!</p>
</Card>

// Clickable card
<Card clickable onClick={() => console.log('Clicked!')}>
  <p>Click me!</p>
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean
- `clickable`: boolean
- `header`, `footer`: React.ReactNode

### Input

Accessible form input with validation states.

```tsx
import { Input } from '@/design-system';
import { Mail, Lock } from 'lucide-react';

// Basic input
<Input
  label="Email Address"
  type="email"
  placeholder="admin@school.com"
  required
/>

// With icons
<Input
  label="Email"
  type="email"
  iconLeft={Mail}
  helperText="We'll never share your email"
/>

// Error state
<Input
  label="Password"
  type="password"
  iconLeft={Lock}
  error="Password must be at least 8 characters"
/>

// Success state
<Input
  label="Username"
  type="text"
  success="Username is available"
/>

// Sizes
<Input size="sm" placeholder="Small input" />
<Input size="md" placeholder="Medium input" />
<Input size="lg" placeholder="Large input" />
```

**Props:**
- `label`: string
- `helperText`: string
- `error`: string
- `success`: string
- `iconLeft`, `iconRight`: LucideIcon component
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean

### Badge

Status indicators and labels.

```tsx
import { Badge } from '@/design-system';
import { CheckCircle } from 'lucide-react';

// Basic badges
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Overdue</Badge>

// With icon
<Badge variant="success" icon={CheckCircle}>
  Verified
</Badge>

// Dot indicator
<Badge variant="success" dot />

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: LucideIcon component
- `dot`: boolean

### KPI Card

Enhanced stat card for dashboard analytics.

```tsx
import { KPICard } from '@/design-system';
import { Users, GraduationCap, DollarSign, CheckCircle } from 'lucide-react';

// Basic KPI card
<KPICard
  icon={Users}
  label="Total Students"
  value="1,234"
  colorScheme="blue"
/>

// With trend indicator
<KPICard
  icon={GraduationCap}
  label="Total Staff"
  value={87}
  trend={{ value: 5, direction: 'up', label: 'vs last month' }}
  colorScheme="green"
/>

// Clickable KPI card
<KPICard
  icon={DollarSign}
  label="Pending Fees"
  value="₹2.4L"
  trend={{ value: 15, direction: 'up' }}
  colorScheme="orange"
  onClick={() => navigate('/fees')}
/>
```

**Props:**
- `icon`: LucideIcon component (required)
- `label`: string (required)
- `value`: string | number (required)
- `colorScheme`: 'blue' | 'green' | 'purple' | 'orange' | 'red' (required)
- `trend`: { value: number, direction: 'up' | 'down', label?: string }
- `hoverable`: boolean
- `onClick`: () => void

## 📱 Responsive Design

All components are mobile-first and responsive:

- **Touch Targets**: Minimum 44px (2.75rem) for mobile accessibility
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Typography**: Responsive font sizes that scale down on mobile

## 🌙 Dark Mode

All components support dark mode via `prefers-color-scheme`:

```tsx
import { darkColors, darkShadows } from '@/design-system';

// Dark mode colors are automatically applied
// No additional code needed
```

## ♿ Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus States**: Visible focus rings with 3px outline
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Touch Targets**: Minimum 44px for mobile

## 🌍 Internationalization

Components support Telugu/English with Inter font:

```tsx
// Telugu font support
font-family: 'Noto Sans Telugu', 'Inter', sans-serif;

// Use with i18next
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Button>{t('common.save')}</Button>
```

## 📖 Usage Examples

### Dashboard with KPI Cards

```tsx
import { KPICard } from '@/design-system';
import { Users, GraduationCap, DollarSign, CheckCircle } from 'lucide-react';

function Dashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
      <KPICard
        icon={Users}
        label="Total Students"
        value="1,234"
        trend={{ value: 5, direction: 'up' }}
        colorScheme="blue"
      />
      <KPICard
        icon={GraduationCap}
        label="Total Staff"
        value={87}
        trend={{ value: 2, direction: 'up' }}
        colorScheme="green"
      />
      <KPICard
        icon={CheckCircle}
        label="Today's Attendance"
        value="95.2%"
        trend={{ value: 1.2, direction: 'down' }}
        colorScheme="purple"
      />
      <KPICard
        icon={DollarSign}
        label="Pending Fees"
        value="₹2.4L"
        trend={{ value: 15, direction: 'up' }}
        colorScheme="orange"
      />
    </div>
  );
}
```

### Form with Validation

```tsx
import { Input, Button, Card } from '@/design-system';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  return (
    <Card padding="lg">
      <form>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconLeft={Mail}
          error={errors.email}
          required
          fullWidth
        />
        
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          iconLeft={Lock}
          error={errors.password}
          required
          fullWidth
        />
        
        <Button variant="primary" type="submit" fullWidth>
          Sign In
        </Button>
      </form>
    </Card>
  );
}
```

### Student List with Badges

```tsx
import { Card, Badge } from '@/design-system';

function StudentList({ students }) {
  return (
    <Card>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{student.class}</td>
              <td>
                <Badge 
                  variant={student.status === 'active' ? 'success' : 'warning'}
                >
                  {student.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
```

## 🎨 Customization

### Using Design Tokens in Custom Components

```tsx
import { colors, spacing, shadows, typography } from '@/design-system';

const CustomComponent = styled.div`
  background: ${colors.primary[500]};
  padding: ${spacing[4]};
  border-radius: ${spacing[2]};
  box-shadow: ${shadows.card};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.base};
  
  &:hover {
    box-shadow: ${shadows.cardHover};
  }
`;
```

### Creating Custom Variants

```tsx
import { Button } from '@/design-system';
import styled from 'styled-components';

const CustomButton = styled(Button)`
  &.ds-button--custom {
    background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  }
`;

<CustomButton variant="custom">Custom Variant</CustomButton>
```

## 📚 Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use semantic color names** (success, error) over specific colors (green, red)
3. **Ensure 44px minimum touch targets** for mobile
4. **Provide ARIA labels** for icon-only buttons
5. **Use proper heading hierarchy** (h1 → h2 → h3)
6. **Test with keyboard navigation** and screen readers
7. **Support dark mode** by using design tokens
8. **Keep components accessible** with proper focus states

## 🚀 Performance

- **Tree-shakeable**: Import only what you need
- **CSS-in-JS optimized**: Minimal runtime overhead
- **Lazy loading**: Components can be code-split
- **Small bundle size**: ~15KB gzipped for core components

## 📝 License

Internal use only for NucleiQ School ERP platform.

---

**Questions or feedback?** Contact the design system team.
