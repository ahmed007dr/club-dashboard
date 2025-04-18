import os ,django
import shutil
import subprocess


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

# المسار الحالي للمشروع
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# أسماء التطبيقات اللي فيها models
APPS = [
    "attendance", "core", "members", "staff",
    "subscriptions", "tickets", "invites",
    "receipts", "finance"
]

# حذف ملفات migrations داخل كل app
def delete_migrations(app_name):
    migrations_path = os.path.join(BASE_DIR, app_name, "migrations")
    if os.path.exists(migrations_path):
        for filename in os.listdir(migrations_path):
            file_path = os.path.join(migrations_path, filename)
            if filename != "__init__.py" and filename.endswith(".py"):
                os.remove(file_path)
            elif filename.endswith(".pyc"):
                os.remove(file_path)

# حذف قاعدة البيانات SQLite لو موجودة
def delete_sqlite_db():
    db_path = os.path.join(BASE_DIR, "db.sqlite3")
    if os.path.exists(db_path):
        os.remove(db_path)

def run_cmd(cmd):
    print(f"\n> Running: {cmd}")
    subprocess.run(cmd, shell=True)

if __name__ == "__main__":
    print("🔁 Resetting Django Migrations...")

    for app in APPS:
        delete_migrations(app)
        print(f"✅ Cleared migrations for app: {app}")

    delete_sqlite_db()
    print("🗑️ Deleted old SQLite database.")

    print("⚙️ Making new migrations...")
    run_cmd("python manage.py makemigrations")

    print("⚙️ Applying new migrations...")
    run_cmd("python manage.py migrate")

    print("\n🎉 Project is clean and ready!")
