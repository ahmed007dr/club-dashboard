import os
import shutil
import subprocess
import logging
from pathlib import Path
from django.conf import settings
import django

# Configure logging with UTF-8 encoding to avoid Unicode issues
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

# Define constants
BASE_DIR = Path(__file__).resolve().parent
APPS = [
    "core", "accounts", "attendance", "members", "staff",
    "subscriptions", "tickets", "invites", "receipts", "finance",
    "devices", "payroll"
]
DB_PATH = BASE_DIR / "db.sqlite3"
STATIC_PATH = BASE_DIR / "static"

def create_static_dir():
    """Create static directory if it doesn't exist."""
    try:
        STATIC_PATH.mkdir(exist_ok=True)
        logger.info("Created/verified static directory.")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

def delete_migrations(app_name):
    """Delete migration files and __pycache__ for an app."""
    migrations_path = BASE_DIR / app_name / "migrations"
    try:
        if migrations_path.exists():
            for item in migrations_path.iterdir():
                if item.name != "__init__.py" and (item.suffix in [".py", ".pyc"] or item.name == "__pycache__"):
                    if item.is_file():
                        item.unlink()
                    elif item.is_dir():
                        shutil.rmtree(item)
            logger.info(f"Cleared migrations for app: {app_name}")
        else:
            logger.warning(f"Migrations directory not found for app: {app_name}")
    except Exception as e:
        logger.error(f"Failed to clear migrations for {app_name}: {e}")

def delete_sqlite_db():
    """Delete the SQLite database file."""
    try:
        if DB_PATH.exists():
            DB_PATH.unlink()
            logger.info("Deleted SQLite database.")
        else:
            logger.info("No SQLite database found to delete.")
    except Exception as e:
        logger.error(f"Failed to delete SQLite database: {e}")

def run_cmd(cmd, check=True):
    """Run a shell command with error handling."""
    logger.info(f"Running: {cmd}")
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, check=check
        )
        if result.stdout:
            logger.info(result.stdout)
        if result.stderr:
            logger.warning(result.stderr)
        return result.returncode
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}: {e.stderr}")
        return e.returncode
    except Exception as e:
        logger.error(f"Unexpected error running command: {e}")
        return 1

def create_superuser():
    """Create a default superuser."""
    logger.info("Creating superuser...")
    shell_cmd = (
        "from django.contrib.auth import get_user_model; "
        "User = get_user_model(); "
        "if not User.objects.filter(username='admin').exists(): "
        "User.objects.create_superuser("
        "username='admin', email='admin@example.com', password='admin123');"
    )
    result = run_cmd(f"echo \"{shell_cmd}\" | python manage.py shell", check=False)
    if result == 0:
        logger.info("Superuser created successfully.")
    else:
        logger.warning("Superuser creation may have failed or user already exists.")

def run_dummy_data():
    """Run the dummy data script."""
    dummy_data_path = BASE_DIR / "dummy_small.py"
    if dummy_data_path.exists():
        logger.info("Running dummy data script...")
        result = run_cmd("python dummy_small.py")
        if result == 0:
            logger.info("Dummy data created successfully.")
        else:
            logger.error("Failed to create dummy data. Check logs for details.")
    else:
        logger.warning("dummy_small.py not found, skipping data population.")

if __name__ == "__main__":
    logger.info("Starting Django Migration Reset...")

    # Create static directory
    create_static_dir()

    # Delete migrations for all apps
    for app in APPS:
        delete_migrations(app)

    # Delete SQLite database
    delete_sqlite_db()

    # Make new migrations
    logger.info("Generating new migrations...")
    run_cmd("python manage.py makemigrations")

    # Apply migrations
    logger.info("Applying new migrations...")
    run_cmd("python manage.py migrate")

    # Run dummy data script
    run_dummy_data()

    # # Create superuser
    # create_superuser()

    logger.info("Project is clean and ready!")