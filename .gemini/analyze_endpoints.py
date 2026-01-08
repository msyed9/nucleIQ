import os
import re
from pathlib import Path
from collections import defaultdict

# Paths
BACKEND_PATH = Path(r"c:\ECOLAB-ETS\RnD\nucleIQ\backend")
FRONTEND_PATH = Path(r"c:\ECOLAB-ETS\RnD\nucleIQ\frontend\src")

# Storage
backend_endpoints = defaultdict(list)
frontend_calls = defaultdict(list)

def extract_backend_endpoints():
    """Extract all API endpoints from Django urls.py files"""
    for urls_file in BACKEND_PATH.rglob("urls.py"):
        if "config" in str(urls_file):
            continue
        
        app_name = urls_file.parent.name
        try:
            with open(urls_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Find path() patterns
            patterns = re.findall(r"path\(['\"]([^'\"]+)['\"]", content)
            for pattern in patterns:
                # Clean up the pattern
                clean_pattern = pattern.replace('<int:pk>', '{id}').replace('<uuid:pk>', '{id}')
                clean_pattern = clean_pattern.replace('<int:id>', '{id}').replace('<uuid:id>', '{id}')
                clean_pattern = clean_pattern.replace('<str:slug>', '{slug}')
                
                # Build full endpoint
                if app_name == "users":
                    endpoint = f"/api/{clean_pattern}"
                else:
                    endpoint = f"/api/{app_name}/{clean_pattern}"
                    
                backend_endpoints[app_name].append(endpoint)
        except Exception as e:
            print(f"Error reading {urls_file}: {e}")

def extract_frontend_calls():
    """Extract all API calls from frontend TypeScript/TSX files"""
    for ts_file in FRONTEND_PATH.rglob("*.ts*"):
        if "node_modules" in str(ts_file) or ".d.ts" in str(ts_file):
            continue
            
        try:
            with open(ts_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Find api.get/post/put/patch/delete calls
            api_calls = re.findall(r"api\.(get|post|put|patch|delete)\(['\"]([^'\"]+)['\"]", content)
            
            for method, endpoint in api_calls:
                # Clean up template literals
                clean_endpoint = re.sub(r'\$\{[^}]+\}', '{id}', endpoint)
                
                file_rel = ts_file.relative_to(FRONTEND_PATH)
                frontend_calls[clean_endpoint].append({
                    'file': str(file_rel),
                    'method': method.upper()
                })
        except Exception as e:
            print(f"Error reading {ts_file}: {e}")

def analyze_gaps():
    """Analyze gaps between backend and frontend"""
    
    # Flatten backend endpoints
    all_backend = set()
    for app, endpoints in backend_endpoints.items():
        for endpoint in endpoints:
            # Normalize endpoint
            normalized = endpoint.rstrip('/')
            all_backend.add(normalized)
            all_backend.add(normalized + '/')  # Add both versions
    
    # Flatten frontend calls
    all_frontend = set(frontend_calls.keys())
    
    # Find orphaned backend endpoints (not called from frontend)
    orphaned_backend = []
    for endpoint in sorted(all_backend):
        endpoint_clean = endpoint.rstrip('/')
        endpoint_slash = endpoint_clean + '/'
        
        # Check if this endpoint is called from frontend
        is_called = False
        for fe_endpoint in all_frontend:
            fe_clean = fe_endpoint.rstrip('/')
            if fe_clean == endpoint_clean or fe_clean in endpoint_clean or endpoint_clean in fe_clean:
                is_called = True
                break
        
        if not is_called and endpoint_clean:
            orphaned_backend.append(endpoint)
    
    # Find missing backend endpoints (called from frontend but not implemented)
    missing_backend = []
    for fe_endpoint in sorted(all_frontend):
        fe_clean = fe_endpoint.rstrip('/')
        
        # Check if this endpoint exists in backend
        is_implemented = False
        for be_endpoint in all_backend:
            be_clean = be_endpoint.rstrip('/')
            if be_clean == fe_clean or be_clean in fe_clean or fe_clean in be_clean:
                is_implemented = True
                break
        
        if not is_implemented:
            missing_backend.append({
                'endpoint': fe_endpoint,
                'calls': frontend_calls[fe_endpoint]
            })
    
    return orphaned_backend, missing_backend

def generate_report():
    """Generate comprehensive gap analysis report"""
    
    print("=" * 80)
    print("NUCLEIQ API ENDPOINT GAP ANALYSIS")
    print("=" * 80)
    print()
    
    extract_backend_endpoints()
    extract_frontend_calls()
    
    orphaned, missing = analyze_gaps()
    
    # Report 1: Orphaned Backend Endpoints
    print("## 1. ORPHANED BACKEND ENDPOINTS (Not Called from Frontend)")
    print("=" * 80)
    print(f"Total: {len(orphaned)} endpoints")
    print()
    
    orphaned_by_app = defaultdict(list)
    for endpoint in orphaned:
        # Extract app name
        parts = endpoint.split('/')
        if len(parts) >= 3:
            app = parts[2]
            orphaned_by_app[app].append(endpoint)
    
    for app in sorted(orphaned_by_app.keys()):
        print(f"\n### {app.upper()}")
        for endpoint in sorted(orphaned_by_app[app]):
            print(f"  - {endpoint}")
    
    # Report 2: Missing Backend Endpoints
    print("\n\n## 2. MISSING BACKEND ENDPOINTS (Called from Frontend but Not Implemented)")
    print("=" * 80)
    print(f"Total: {len(missing)} endpoints")
    print()
    
    for item in missing:
        print(f"\n### {item['endpoint']}")
        for call in item['calls']:
            print(f"  - {call['method']} in {call['file']}")
    
    # Report 3: Backend Endpoint Summary
    print("\n\n## 3. BACKEND ENDPOINT SUMMARY BY MODULE")
    print("=" * 80)
    for app in sorted(backend_endpoints.keys()):
        print(f"\n### {app.upper()} ({len(backend_endpoints[app])} endpoints)")
        for endpoint in sorted(set(backend_endpoints[app]))[:10]:  # Show first 10
            print(f"  - {endpoint}")
        if len(backend_endpoints[app]) > 10:
            print(f"  ... and {len(backend_endpoints[app]) - 10} more")
    
    # Report 4: Frontend API Call Summary
    print("\n\n## 4. FRONTEND API CALL SUMMARY")
    print("=" * 80)
    print(f"Total unique endpoints called: {len(frontend_calls)}")
    print()
    
    # Group by module
    fe_by_module = defaultdict(list)
    for endpoint in frontend_calls.keys():
        parts = endpoint.split('/')
        if len(parts) >= 2:
            module = parts[1] if parts[1] else 'root'
            fe_by_module[module].append(endpoint)
    
    for module in sorted(fe_by_module.keys()):
        print(f"\n### {module.upper()} ({len(fe_by_module[module])} calls)")
        for endpoint in sorted(set(fe_by_module[module]))[:5]:
            print(f"  - {endpoint}")
        if len(fe_by_module[module]) > 5:
            print(f"  ... and {len(fe_by_module[module]) - 5} more")

if __name__ == "__main__":
    generate_report()
