from rest_framework.test import APIRequestFactory
from students.views import StudentViewSet
from users.models import User
import json

def run_test():
    try:
        user = User.objects.get(email='mohsinsd@gmail.com')
        factory = APIRequestFactory()
        request = factory.get('/api/students/students/', {'page': 1, 'page_size': 25, 'ordering': 'admission_number'})
        request.user = user
        request.tenant = user.tenant
        
        view = StudentViewSet.as_view({'get': 'list'})
        response = view(request)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.data
            if isinstance(data, dict):
                print(f"Count: {data.get('count')}")
                results = data.get('results', [])
                print(f"Results length: {len(results)}")
                if results:
                    print(f"First result keys: {results[0].keys()}")
            else:
                print(f"Data length: {len(data)}")
        else:
            print(f"Error data: {response.data}")
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    run_test()
