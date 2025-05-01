
# Project Setup Instructions

## ⚙️ Backend (Django) Setup

   Run the following script 
   ```
   python reset_migrations.py
   ```

2. **Create Superuser**  
   Use one of the following commands to create an admin user:

   ```
   winpty python manage.py createsuperuser
   ```

   or simply:

   ```
   python manage.py createsuperuser
   ```

   Then enter the following credentials:

   ```
   Username: admin  
   Email: a@a.com  
   Password: 123  
   Confirm Password: 123  
   ```

3. **Access Django Admin Dashboard**  
   Open the following URL in your browser:

   ```
   http://127.0.0.1:8000/admin
   ```

4. **Change User Role**  
   Inside the admin dashboard, edit the `role` field of the user and set it to:

   ```
   owner
   ```

   Now you're ready to navigate the frontend with full access.

---

## 🚀 Frontend (React) Setup

1. Navigate to the frontend directory:

   ```
   cd src/frontend/
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

---

You're all set. Enjoy developing! 💻🚀
```
