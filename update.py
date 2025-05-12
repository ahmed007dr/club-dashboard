import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
import re
import shutil
from pathlib import Path

# Path to your Django project root
PROJECT_ROOT = Path('/path/to/your/project')  # Replace with your project path
BACKUP_DIR = PROJECT_ROOT / 'backup_files'

# Regex patterns for models.py
MODEL_CLASS_PATTERN = re.compile(r'class\s+(\w+)\s*\((\w+\.\w+\.)?Model\):')
TIMESTAMPED_MODEL_IMPORT_PATTERN = re.compile(r'from\s+audit_trail\.models\s+import\s+TimeStampedModel')

# Regex patterns for serializers.py
SERIALIZER_CLASS_PATTERN = re.compile(r'class\s+(\w+)\s*\((\w+\.\w+\.)?ModelSerializer\):')
TIMESTAMPED_SERIALIZER_IMPORT_PATTERN = re.compile(r'from\s+audit_trail\.serializers\s+import\s+TimeStampedSerializer')
META_FIELDS_PATTERN = re.compile(r'fields\s*=\s*\[([^\]]*)\]', re.MULTILINE)

# Fields to add to serializers
TIMESTAMPED_FIELDS = ['created_by', 'created_at', 'updated_by', 'updated_at']

def ensure_backup_dir():
    """Create backup directory if it doesn't exist."""
    if not BACKUP_DIR.exists():
        BACKUP_DIR.mkdir()

def backup_file(file_path):
    """Create a backup of the file."""
    backup_path = BACKUP_DIR / file_path.relative_to(PROJECT_ROOT)
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(file_path, backup_path)
    print(f"Backed up {file_path} to {backup_path}")

def update_models_file(file_path):
    """Update a single models.py file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if TimeStampedModel is already imported
    has_timestamped_import = bool(TIMESTAMPED_MODEL_IMPORT_PATTERN.search(content))

    # Find all model classes
    updated_content = content
    matches = MODEL_CLASS_PATTERN.findall(content)
    modified = False

    for model_name, module_prefix in matches:
        # Skip if the model already inherits from TimeStampedModel
        if module_prefix and 'TimeStampedModel' in module_prefix:
            continue
        # Only replace if it inherits directly from models.Model
        if module_prefix and 'models.' in module_prefix:
            old_inheritance = f'({module_prefix}Model)'
            new_inheritance = '(TimeStampedModel)'
            updated_content = updated_content.replace(
                f'class {model_name} {old_inheritance}',
                f'class {model_name} {new_inheritance}'
            )
            modified = True

    # Add import statement if needed and modified
    if modified and not has_timestamped_import:
        import_lines = [line for line in content.splitlines() if line.startswith('import') or line.startswith('from')]
        if import_lines:
            first_import = import_lines[0]
            updated_content = updated_content.replace(
                first_import,
                f"{first_import}\nfrom audit_trail.models import TimeStampedModel"
            )
        else:
            updated_content = f"from audit_trail.models import TimeStampedModel\n\n{updated_content}"

    if modified:
        backup_file(file_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes needed for {file_path}")

def update_serializers_file(file_path):
    """Update a single serializers.py file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if TimeStampedSerializer is already imported
    has_timestamped_import = bool(TIMESTAMPED_SERIALIZER_IMPORT_PATTERN.search(content))

    # Find all serializer classes
    updated_content = content
    matches = SERIALIZER_CLASS_PATTERN.findall(content)
    modified = False

    for serializer_name, module_prefix in matches:
        # Skip if the serializer already inherits from TimeStampedSerializer
        if module_prefix and 'TimeStampedSerializer' in module_prefix:
            continue
        # Only replace if it inherits directly from serializers.ModelSerializer
        if module_prefix and 'serializers.' in module_prefix:
            old_inheritance = f'({module_prefix}ModelSerializer)'
            new_inheritance = '(TimeStampedSerializer)'
            updated_content = updated_content.replace(
                f'class {serializer_name} {old_inheritance}',
                f'class {serializer_name} {new_inheritance}'
            )
            modified = True

    # Update fields in Meta class to include timestamped fields
    meta_matches = META_FIELDS_PATTERN.finditer(updated_content)
    for match in meta_matches:
        fields_str = match.group(1).strip()
        fields = [f.strip().strip("'\"") for f in fields_str.split(',') if f.strip()]
        new_fields = fields + [f for f in TIMESTAMPED_FIELDS if f not in fields]
        new_fields_str = ', '.join(f"'{f}'" for f in new_fields)
        updated_content = updated_content.replace(
            match.group(0),
            f"fields = [{new_fields_str}]"
        )
        modified = True

    # Add import statement if needed and modified
    if modified and not has_timestamped_import:
        import_lines = [line for line in content.splitlines() if line.startswith('import') or line.startswith('from')]
        if import_lines:
            first_import = import_lines[0]
            updated_content = updated_content.replace(
                first_import,
                f"{first_import}\nfrom audit_trail.serializers import TimeStampedSerializer"
            )
        else:
            updated_content = f"from audit_trail.serializers import TimeStampedSerializer\n\n{updated_content}"

    if modified:
        backup_file(file_path)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        print(f"Updated {file_path}")
    else:
        print(f"No changes needed for {file_path}")

def main():
    """Main function to update all models.py and serializers.py files."""
    ensure_backup_dir()

    # Find all models.py and serializers.py files in the project
    for app_dir in PROJECT_ROOT.iterdir():
        if app_dir.is_dir():
            # Update models.py
            models_file = app_dir / 'models.py'
            if models_file.exists():
                update_models_file(models_file)

            # Update serializers.py
            serializers_file = app_dir / 'serializers.py'
            if serializers_file.exists():
                update_serializers_file(serializers_file)

if __name__ == '__main__':
    main()