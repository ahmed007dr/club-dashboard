from locust import HttpUser, task, between
import random
import uuid

class DeviceManagementUser(HttpUser):
    wait_time = between(1, 3) 

    def on_start(self):
        self.client.headers.update({
            'User-Agent': f"LocustTestDevice/{uuid.uuid4()}",
            'Accept-Language': 'en-US'
        })

        login_data = {
            "username": "admin",  
            "password": "123"     
        }

        response = self.client.post("/login/", json=login_data)
        
        if response.status_code == 200:
            self.access_token = response.json().get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.access_token}'
            })
        else:
            print(f"Login failed: {response.text}")

    @task(2)
    def access_protected_endpoint(self):
        if hasattr(self, 'access_token'):
            response = self.client.get("/api/user/profile/")
            if response.status_code == 403:
                print(f"Device not authorized: {response.text}")
            elif response.status_code == 200:
                print(f"Profile accessed successfully: {response.json()}")

    @task(1)
    def logout(self):
        if hasattr(self, 'access_token'):
            response = self.client.post("/logout/", json={"refresh": "dummy_refresh_token"})
            if response.status_code == 205:
                print("Logout successful")
            else:
                print(f"Logout failed: {response.text}")

    @task(3)
    def simulate_multiple_devices(self):
        self.client.headers.update({
            'User-Agent': f"LocustTestDevice/{uuid.uuid4()}"
        })

        login_data = {
            "username": "admin",
            "password": "123"
        }

        response = self.client.post("/login/", json=login_data)
        if response.status_code == 403:
            print(f"Max device limit reached: {response.text}")
        elif response.status_code == 200:
            print(f"New device login successful: {response.json()}")