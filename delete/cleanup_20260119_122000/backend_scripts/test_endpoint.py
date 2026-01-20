import requests

# Login first
login_resp = requests.post("http://localhost:8000/api/parent/auth/login/", json={"email": "parent@test.com", "password": "parent123"})
print(f"Login Status: {login_resp.status_code}")

if login_resp.ok:
    token = login_resp.json()["access"]
    
    # Try fetching students
    students_resp = requests.get(
        "http://localhost:8000/api/parent/students/",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Students Status: {students_resp.status_code}")
    if students_resp.ok:
        print("Students data:", students_resp.json())
    else:
        print("Error:", students_resp.text[:500])