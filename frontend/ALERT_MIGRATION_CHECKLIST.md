# Alert() Migration Checklist

## Summary
Found **100+ instances** of `alert()` calls across the frontend codebase that need to be replaced with the new Toast notification system.

## Priority Files (High Traffic Pages)

### 🔴 Critical Priority
1. **UserManagement.tsx** - 4 alerts (user CRUD operations)
2. **RolesPermissions.tsx** - 2 alerts (PARTIALLY DONE - still has 2 remaining)
3. **LibraryManagement.tsx** - 8 alerts (book circulation)
4. **TimetableBuilder.tsx** - 6 alerts (scheduling conflicts)
5. **AddStudent.tsx** - 2 alerts (admission process)

### 🟡 High Priority  
6. **AcademicSetup.tsx** - 6 alerts (academic year setup)
7. **RemarksManager.tsx** - 4 alerts (student remarks)
8. **DocumentManager.tsx** - 5 alerts (document uploads)
9. **LibraryMembers.tsx** - 4 alerts (member enrollment)
10. **FinanceDashboard.tsx** - Multiple alerts

### 🟢 Medium Priority
11. **TransportAllocations.tsx** - 1 alert
12. **StudentsList.tsx** - 1 alert
13. **ReportBuilder.tsx** - 2 alerts
14. **DigitalResources.tsx** - 3 alerts
15. **LibraryBooks.tsx** - 1 alert
16. **ParentShop.tsx** - 1 alert (checkout)

## Migration Template

### Step 1: Import Toast Hook
```typescript
import { useToast, ToastContainer } from '@/design-system';
```

### Step 2: Initialize Hook
```typescript
const { toasts, removeToast, success, error, warning, info } = useToast();
```

### Step 3: Add ToastContainer
```typescript
return (
  <>
    <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
    {/* existing JSX */}
  </>
);
```

### Step 4: Replace alert() Calls

**Before:**
```typescript
alert('Operation successful!');
alert('Error: ' + error.message);
```

**After:**
```typescript
success('Operation successful!');
error('Error: ' + error.message);
```

## Specific Replacements

### UserManagement.tsx
```typescript
// Line 132
- alert('User roles updated successfully!');
+ success('User roles updated successfully!');

// Line 136
- alert(error.response?.data?.message || 'Failed to save user roles');
+ error(error.response?.data?.message || 'Failed to save user roles');

// Line 169
- alert(error.response?.data?.message || 'Failed to save user');
+ error(error.response?.data?.message || 'Failed to save user');

// Line 186
- alert(error.response?.data?.message || 'Failed to delete user');
+ error(error.response?.data?.message || 'Failed to delete user');
```

### TimetableBuilder.tsx
```typescript
// Line 257 - Use warning for conflicts
- alert('A class is already scheduled at this time!');
+ warning('A class is already scheduled at this time!');

// Line 302 - Format conflict list better
- alert('Conflicts detected:\\n' + conflicts.join('\\n'));
+ error('Conflicts detected: ' + conflicts.join(', '));

// Line 315, 340, 360 - Error handling
- alert(err.response?.data?.message || 'Error creating timetable slot');
+ error(err.response?.data?.message || 'Error creating timetable slot');
```

### LibraryManagement.tsx
```typescript
// Line 101
- alert('Book issued successfully!');
+ success('Book issued successfully!');

// Line 104
- alert(`Error: ${error.response?.data?.error || 'Failed to issue book'}`);
+ error(error.response?.data?.error || 'Failed to issue book');

// Line 118 - Show fine amount
- alert(`Book returned! Fine: ₹${data.fine_amount}`);
+ warning(`Book returned! Fine: ₹${data.fine_amount}`);

// Line 131 - Validation error
- alert('Please enter both barcode and member ID');
+ warning('Please enter both barcode and member ID');
```

### AddStudent.tsx
```typescript
// Line 156 - Success with emoji
- alert(t('students.add_success', { defaultValue: 'Student admitted and enrolled successfully! 🎉' }));
+ success(t('students.add_success', { defaultValue: 'Student admitted and enrolled successfully! 🎉' }));

// Line 160
- alert(t('students.add_error', { defaultValue: 'Failed to admit student. Please check all fields.' }));
+ error(t('students.add_error', { defaultValue: 'Failed to admit student. Please check all fields.' }));
```

## Special Cases

### Confirmation Dialogs
Some `alert()` calls are actually used for confirmation. These should use a proper Modal component instead:

```typescript
// Before
if (!confirm('Are you sure you want to delete?')) return;

// After - Create a confirmation modal
const [showConfirm, setShowConfirm] = useState(false);

// In JSX
<Modal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Delete"
>
  <p>Are you sure you want to delete this item?</p>
  <Button onClick={handleDelete}>Delete</Button>
</Modal>
```

### Multi-line Messages
```typescript
// Before
alert('Conflicts detected:\\n' + conflicts.join('\\n'));

// After - Use toast with better formatting
error('Conflicts detected: ' + conflicts.join(', '));

// Or create a custom toast with list
error(
  <>
    <strong>Conflicts detected:</strong>
    <ul>
      {conflicts.map(c => <li key={c}>{c}</li>)}
    </ul>
  </>
);
```

## Progress Tracking

- [x] RolesPermissions.tsx (Partial - 2/4 done)
- [ ] UserManagement.tsx (0/4)
- [ ] TimetableBuilder.tsx (0/6)
- [ ] LibraryManagement.tsx (0/8)
- [ ] AddStudent.tsx (0/2)
- [ ] AcademicSetup.tsx (0/6)
- [ ] RemarksManager.tsx (0/4)
- [ ] DocumentManager.tsx (0/5)
- [ ] LibraryMembers.tsx (0/4)
- [ ] 90+ other files

## Estimated Effort

- **Per file**: 5-15 minutes
- **Total files**: ~50 files with alerts
- **Total time**: 4-12 hours
- **Recommended**: Batch process 5-10 files per session

## Testing After Migration

For each migrated file:
1. [ ] Test success scenarios
2. [ ] Test error scenarios
3. [ ] Verify toast appears in correct position
4. [ ] Verify toast auto-dismisses
5. [ ] Test on mobile
6. [ ] Test in dark mode

## Notes

- Keep original `alert()` messages as comments during migration for reference
- Test each page after migration
- Consider adding action buttons to toasts where appropriate (e.g., "Undo" for delete)
- Use appropriate toast variants:
  - `success()` - Successful operations
  - `error()` - Errors and failures
  - `warning()` - Validation issues, conflicts
  - `info()` - Informational messages

---

**Start with the Critical Priority files and work your way down!**
