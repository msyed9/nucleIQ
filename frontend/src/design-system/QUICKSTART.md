# NucleiQ Design System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Import Global Styles

Add this to your `main.tsx` or `App.tsx`:

```tsx
import '@/design-system/global.css';
```

### Step 2: Use Components

```tsx
import { Button, Card, Input, KPICard } from '@/design-system';
import { Users } from 'lucide-react';

function MyComponent() {
  return (
    <Card padding="lg">
      <KPICard
        icon={Users}
        label="Total Students"
        value="1,234"
        colorScheme="blue"
      />
      
      <Input
        label="Email"
        type="email"
        placeholder="admin@school.com"
      />
      
      <Button variant="primary">
        Save Changes
      </Button>
    </Card>
  );
}
```

### Step 3: Use Design Tokens

```tsx
import { colors, spacing } from '@/design-system';

const MyStyledComponent = styled.div`
  background: ${colors.primary[500]};
  padding: ${spacing[4]};
`;
```

## 📦 Available Components

| Component | Use Case | Example |
|-----------|----------|---------|
| **Button** | Actions, CTAs | `<Button variant="primary">Save</Button>` |
| **Card** | Containers, sections | `<Card padding="lg">Content</Card>` |
| **Input** | Form fields | `<Input label="Name" required />` |
| **Badge** | Status indicators | `<Badge variant="success">Active</Badge>` |
| **KPICard** | Dashboard metrics | `<KPICard icon={Users} value="1,234" />` |

## 🎨 Color Palette

### Primary (Trust Blue)
- `colors.primary[500]` - #2196F3 - Main actions
- `colors.primary[700]` - #1976D2 - Hover states

### Secondary (Growth Green)
- `colors.secondary[500]` - #8BC34A - Success, growth
- `colors.secondary[700]` - #689F38 - Hover states

### Semantic
- `colors.success[500]` - #4CAF50 - Success states
- `colors.warning[500]` - #FFC107 - Warnings
- `colors.error[500]` - #F44336 - Errors
- `colors.info[500]` - #2196F3 - Information

## 📏 Spacing Scale (8px grid)

```tsx
spacing[2]  // 8px  - Small gaps
spacing[4]  // 16px - Default spacing
spacing[6]  // 24px - Card padding
spacing[8]  // 32px - Section spacing
spacing[12] // 48px - Large sections
```

## 🔤 Typography

```tsx
// Headings
typography.textStyles.h1  // 48px, bold
typography.textStyles.h2  // 36px, bold
typography.textStyles.h3  // 30px, semibold

// Body
typography.textStyles.body       // 16px, regular
typography.textStyles.bodySmall  // 14px, regular

// UI
typography.textStyles.label   // 14px, semibold
typography.textStyles.caption // 12px, regular
```

## ✅ Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Minimum 44px touch targets** for mobile
3. **Use semantic colors** (success, error) over specific colors
4. **Provide ARIA labels** for accessibility
5. **Test keyboard navigation**

## 🎯 Common Patterns

### Dashboard KPI Grid
```tsx
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
  gap: '1.5rem' 
}}>
  <KPICard icon={Users} label="Students" value="1,234" colorScheme="blue" />
  <KPICard icon={Staff} label="Staff" value="87" colorScheme="green" />
</div>
```

### Form Layout
```tsx
<Card padding="lg">
  <Input label="Email" type="email" required fullWidth />
  <Input label="Password" type="password" required fullWidth />
  <Button variant="primary" fullWidth>Sign In</Button>
</Card>
```

### Status Badge
```tsx
<Badge variant={status === 'active' ? 'success' : 'warning'}>
  {status}
</Badge>
```

## 📱 Responsive Design

All components are mobile-first:
- Breakpoint: 768px
- Touch targets: 44px minimum
- Responsive typography automatically scales

## 🌙 Dark Mode

Dark mode is automatic via `prefers-color-scheme`. No additional code needed!

## 📚 Full Documentation

See [README.md](./README.md) for complete documentation.

## 🆘 Need Help?

- Check the [examples](./examples/) folder
- Review component props in TypeScript definitions
- Contact the design system team

---

**Happy coding!** 🎉
