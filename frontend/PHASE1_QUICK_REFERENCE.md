# Phase 1 Quick Reference Card

## 🚀 Quick Start

### 1. Toast Notifications (Replace alert())

```typescript
// Import
import { useToast, ToastContainer } from '@/design-system';

// Setup
const { toasts, removeToast, success, error, warning, info } = useToast();

// Use
success('Operation successful!');
error('Something went wrong');
warning('Please review your input');
info('New feature available');

// Render
<ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
```

### 2. Skeleton Loading (Replace spinners)

```typescript
// Import
import { Skeleton, TableSkeleton, CardSkeleton } from '@/design-system';

// Table
{loading ? <TableSkeleton rows={5} columns={6} /> : <table>...</table>}

// Card
{loading ? <CardSkeleton showAvatar lines={3} /> : <Card>...</Card>}

// Custom
<Skeleton width="100%" height={20} count={3} />
```

### 3. Page Layout (Consistent structure)

```typescript
// Import
import { PageLayout } from '@/design-system';

// Use
<PageLayout
  title="Students"
  subtitle="Manage student records"
  actions={<Button>Add</Button>}
>
  {/* Your content */}
</PageLayout>
```

---

## 📋 Common Patterns

### Pattern 1: CRUD Operations
```typescript
const { success, error } = useToast();

const handleCreate = async () => {
  try {
    await api.post('/data', formData);
    success('Created successfully!');
    navigate('/list');
  } catch (err) {
    error(err.response?.data?.message || 'Failed to create');
  }
};
```

### Pattern 2: Form Validation
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name) {
    warning('Name is required');
    return;
  }
  
  // ... submit logic
};
```

### Pattern 3: Loading States
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().finally(() => setLoading(false));
}, []);

if (loading) return <TableSkeleton rows={5} columns={6} />;
```

### Pattern 4: Toast with Action
```typescript
success('Item deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreItem()
  }
});
```

---

## 🎨 Toast Variants

| Variant | Use Case | Icon |
|---------|----------|------|
| `success()` | Successful operations | ✅ CheckCircle |
| `error()` | Errors, failures | ❌ AlertCircle |
| `warning()` | Validation, conflicts | ⚠️ AlertTriangle |
| `info()` | Informational messages | ℹ️ Info |

---

## 💀 Skeleton Variants

| Component | Use Case |
|-----------|----------|
| `<Skeleton />` | Single line/block |
| `<TableSkeleton />` | Data tables |
| `<CardSkeleton />` | Card layouts |

---

## 📐 PageLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Page title |
| `subtitle` | string | - | Page description |
| `actions` | ReactNode | - | Action buttons |
| `maxWidth` | 'sm'\|'md'\|'lg'\|'xl'\|'full' | 'xl' | Max content width |
| `showBack` | boolean | false | Show back button |
| `onBack` | function | - | Back button handler |

---

## ⚡ Pro Tips

1. **Always wrap with ToastContainer**
   ```typescript
   return (
     <>
       <ToastContainer toasts={toasts} onDismiss={removeToast} />
       {/* Your content */}
     </>
   );
   ```

2. **Use specific error messages**
   ```typescript
   // ❌ Bad
   error('Error');
   
   // ✅ Good
   error(err.response?.data?.message || 'Failed to save student');
   ```

3. **Skeleton should match content structure**
   ```typescript
   // If you have a table with 6 columns
   <TableSkeleton rows={5} columns={6} />
   ```

4. **Use PageLayout for all pages**
   ```typescript
   // Consistent structure across app
   <PageLayout title="..." subtitle="..." actions={...}>
   ```

---

## 🐛 Common Mistakes

### ❌ Don't Do This
```typescript
// Using alert()
alert('Success!');

// No ToastContainer
const { success } = useToast();
success('Test'); // Won't show!

// Blocking loading
{loading && <div>Loading...</div>}
```

### ✅ Do This Instead
```typescript
// Use toast
const { toasts, removeToast, success } = useToast();
success('Success!');

// Add ToastContainer
<ToastContainer toasts={toasts} onDismiss={removeToast} />

// Skeleton loading
{loading ? <TableSkeleton /> : <table>...</table>}
```

---

## 📱 Mobile Considerations

- Toasts are full-width on mobile
- PageLayout reduces padding on mobile
- Skeleton animations respect `prefers-reduced-motion`

---

## 🎯 Migration Checklist

- [ ] Import `useToast` hook
- [ ] Initialize toast methods
- [ ] Add `<ToastContainer />`
- [ ] Replace all `alert()` calls
- [ ] Replace loading spinners with skeletons
- [ ] Wrap page in `<PageLayout>`
- [ ] Test on mobile
- [ ] Test in dark mode

---

## 📚 Full Documentation

- [Phase 1 Implementation Guide](./PHASE1_IMPLEMENTATION_GUIDE.md)
- [Alert Migration Checklist](./ALERT_MIGRATION_CHECKLIST.md)
- [Phase 1 Summary](./PHASE1_COMPLETE_SUMMARY.md)
- [Design System README](./src/design-system/README.md)

---

**Keep this card handy while migrating pages!**
