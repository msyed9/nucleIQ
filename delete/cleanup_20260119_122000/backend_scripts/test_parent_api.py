import requests

# Parent login
login_url = "http://localhost:8000/api/parent/auth/login/"
login_data = {
    "email": "parent@test.com",
    "password": "parent123"
}

print("Testing parent login...")
response = requests.post(login_url, json=login_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json() if response.ok else response.text}")

if response.ok:
    tokens = response.json()
    access_token = tokens.get("access")
    
    # Test fetching students
    print("\nTesting fetching students...")
    students_url = "http://localhost:8000/api/parent/students/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    students_response = requests.get(students_url, headers=headers)
    print(f"Status Code: {students_response.status_code}")
    print(f"Response: {students_response.json() if students_response.ok else students_response.text}")