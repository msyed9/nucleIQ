import requests

# Get parent token
resp = requests.post(
    'http://localhost:8000/api/parent/auth/login/',
    json={'email': 'parent@test.com', 'password': 'parent123'}
)
token = resp.json()['access']
print(f'Parent Token: {token[:50]}...')

# Try to access admin API
resp2 = requests.get(
    'http://localhost:8000/api/students/',
    headers={'Authorization': f'Bearer {token}'}
)
print(f'\nAccess to /api/students/: {resp2.status_code}')
if resp2.status_code == 403:
    print(' BLOCKED (Expected)')
    print(f'Response: {resp2.json()}')
else:
    print(' SECURITY ISSUE: Parent can access admin API!')
    print(f'Response: {resp2.text[:200]}')