import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

import shutil
import subprocess


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

APPS = [
    "core", "accounts", "attendance", "members", "staff",
    "subscriptions", "tickets", "invites", "receipts", "finance"
]

def create_static_dir():
    static_path = os.path.join(BASE_DIR, "static")
    if not os.path.exists(static_path):
        os.makedirs(static_path)
        print("📁 Created static directory.")

def delete_migrations(app_name):
    migrations_path = os.path.join(BASE_DIR, app_name, "migrations")
    if os.path.exists(migrations_path):
        for filename in os.listdir(migrations_path):
            file_path = os.path.join(migrations_path, filename)
            if filename != "__init__.py" and (filename.endswith(".py") or filename.endswith(".pyc")):
                os.remove(file_path)
        pycache_path = os.path.join(migrations_path, "__pycache__")
        if os.path.exists(pycache_path):
            shutil.rmtree(pycache_path)
        print(f"✅ Cleared migrations for app: {app}")

def delete_sqlite_db():
    db_path = os.path.join(BASE_DIR, "db.sqlite3")
    if os.path.exists(db_path):
        os.remove(db_path)
        print("🗑️ Deleted old SQLite database.")

def run_cmd(cmd):
    print(f"\n> Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    print(result.stderr)
    if result.returncode != 0:
        print(f"❌ Command failed with exit code {result.returncode}")
    return result.returncode

if __name__ == "__main__":
    print("🔁 Resetting Django Migrations...")
    create_static_dir()

    # Clear all __pycache__ directories
    print("🧹 Clearing all __pycache__ directories...")
    for root, dirs, _ in os.walk(BASE_DIR):
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            shutil.rmtree(pycache_path)
            print(f"Removed {pycache_path}")

    for app in APPS:
        delete_migrations(app)

    delete_sqlite_db()

    print("⚙️ Making new migrations...")
    for app in APPS:
        print(f"Generating migrations for {app}...")
        exit_code = run_cmd(f"python manage.py makemigrations {app}")
        if exit_code != 0:
            print(f"❌ Stopping due to migration error in {app}")
            break

    print("⚙️ Applying new migrations...")
    run_cmd("python manage.py migrate")

    print("\n🎉 Project is clean and ready!")