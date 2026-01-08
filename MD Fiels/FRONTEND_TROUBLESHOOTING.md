# NucleIQ - Frontend Troubleshooting Guide

## Common Issues and Solutions

### 1. Missing Dependencies Error

**Error:**
```
Failed to resolve import "package-name" from "src/..."
```

**Solution:**
```bash
# Install dependencies
docker-compose exec frontend npm install

# Or if running locally
cd frontend
npm install
```

---

### 2. Module Not Found Errors

**Error:**
```
Cannot find module '@mui/...' or 'react-...'
```

**Solution:**
```bash
# Clear node_modules and reinstall
docker-compose exec frontend rm -rf node_modules package-lock.json
docker-compose exec frontend npm install

# Or rebuild the container
docker-compose down
docker-compose up -d --build frontend
```

---

### 3. TypeScript Errors

**Error:**
```
Type 'X' is not assignable to type 'Y'
```

**Solution:**
1. Check if types are installed:
```bash
npm install --save-dev @types/package-name
```

2. Common type packages needed:
- `@types/react`
- `@types/react-dom`
- `@types/lodash`
- `@types/node`

---

### 4. Vite Build Errors

**Error:**
```
[vite] Internal server error
```

**Solution:**
```bash
# Clear Vite cache
docker-compose exec frontend rm -rf node_modules/.vite

# Restart dev server
docker-compose restart frontend
```

---

### 5. Port Already in Use

**Error:**
```
Port 5173 is already in use
```

**Solution:**
```bash
# Stop the container
docker-compose stop frontend

# Remove the container
docker-compose rm -f frontend

# Start again
docker-compose up -d frontend
```

---

### 6. Hot Module Replacement (HMR) Not Working

**Solution:**
1. Check `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true, // Important for Docker
    },
    hmr: {
      overlay: true,
    },
  },
});
```

2. Restart the frontend container:
```bash
docker-compose restart frontend
```

---

### 7. Import Path Errors

**Error:**
```
Module not found: Can't resolve '../../components/...'
```

**Solution:**
1. Check if the file exists at the specified path
2. Verify the import path is correct (case-sensitive)
3. Use absolute imports with path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"]
    }
  }
}
```

---

### 8. CSS/Style Not Loading

**Solution:**
```bash
# Check if CSS file is imported
import './styles.css';

# For Material-UI, ensure theme provider is set up
import { ThemeProvider } from '@mui/material/styles';
```

---

### 9. API Connection Issues

**Error:**
```
Network Error / CORS Error
```

**Solution:**
1. Check `vite.config.ts` proxy settings:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
});
```

2. Verify backend is running:
```bash
docker-compose ps
docker-compose logs backend
```

---

### 10. React Query Errors

**Error:**
```
No QueryClient set, use QueryClientProvider to set one
```

**Solution:**
Ensure `QueryClientProvider` wraps your app in `App.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

---

## Quick Fixes

### Complete Reset
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: This deletes data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

### Frontend Only Reset
```bash
# Stop frontend
docker-compose stop frontend

# Remove frontend container
docker-compose rm -f frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Install dependencies
docker-compose exec frontend npm install
```

### Check Logs
```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f
```

---

## Dependency Installation Checklist

After adding new packages to `package.json`:

1. **Install in container:**
```bash
docker-compose exec frontend npm install
```

2. **Verify installation:**
```bash
docker-compose exec frontend npm list package-name
```

3. **Restart if needed:**
```bash
docker-compose restart frontend
```

---

## Current Dependencies Status

### Core Dependencies ✅
- ✅ React 18.3.1
- ✅ TypeScript 5.7.2
- ✅ Vite 6.0.5
- ✅ Material-UI 5.14.0

### Phase 11 Dependencies ✅
- ✅ react-beautiful-dnd 13.1.1
- ✅ lodash 4.17.21
- ✅ date-fns 4.1.0

### Utility Dependencies ✅
- ✅ react-hot-toast 2.6.0
- ✅ axios 1.7.9
- ✅ react-query 5.62.8
- ✅ react-router-dom 6.28.0

---

## Performance Tips

1. **Use React.memo for expensive components**
2. **Lazy load routes:**
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

3. **Optimize bundle size:**
```bash
npm run build
npm run preview
```

4. **Check bundle analyzer:**
```bash
npm install --save-dev rollup-plugin-visualizer
```

---

## Development Workflow

1. **Start development:**
```bash
docker-compose up -d
```

2. **Watch logs:**
```bash
docker-compose logs -f frontend
```

3. **Make changes** - HMR will auto-reload

4. **If issues occur:**
```bash
docker-compose restart frontend
```

5. **For major changes:**
```bash
docker-compose down
docker-compose up -d --build
```

---

## Production Build

```bash
# Build for production
docker-compose exec frontend npm run build

# Preview production build
docker-compose exec frontend npm run preview

# Check build size
docker-compose exec frontend ls -lh dist/
```

---

## Contact & Support

If issues persist:
1. Check Docker logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Review DEPLOYMENT_CHECKLIST.md
4. Check IMPLEMENTATION_COMPLETE.md for feature details

---

**Last Updated:** January 3, 2026  
**Status:** All dependencies installed ✅
