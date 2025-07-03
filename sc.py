
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()
import os
import re
import shutil
from pathlib import Path

# Directories to ignore
IGNORE_DIRS = {'node_modules', 'venv', '.git', '__pycache__', 'build', 'dist'}

# File extensions to process
FILE_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx'}

def backup_file(file_path):
    """Create a backup of the file"""
    backup_path = f"{file_path}.bak"
    shutil.copy2(file_path, backup_path)
    return backup_path

def count_and_comment_prints_and_logs(file_path):
    """Count and comment out print and console.log in the file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        print_count = 0
        console_count = 0
        new_lines = []
        modified = False

        # Determine comment character based on file extension
        comment_char = '#' if Path(file_path).suffix == '.py' else '//'

        # Regular expressions to identify print and console.log
        print_pattern = r'^\s*print\s*\(.*?\)\s*$|^\s*print\s+[\'"].*?[\'"]\s*$'
        console_pattern = r'^\s*console\.log\s*\(.*?\)\s*;\s*$'

        for line in lines:
            # Check for print statements
            if re.match(print_pattern, line):
                print_count += 1
                new_lines.append(f"{comment_char} {line.rstrip()}\n")
                modified = True
            # Check for console.log statements
            elif re.match(console_pattern, line):
                console_count += 1
                new_lines.append(f"{comment_char} {line.rstrip()}\n")
                modified = True
            else:
                new_lines.append(line)

        # If any print or console.log was found, save changes
        if modified:
            # Create a backup
            backup_file(file_path)
            with open(file_path, 'w', encoding='utf-8') as file:
                file.writelines(new_lines)
#             print(f"Modified: {file_path} (print: {print_count}, console.log: {console_count})")
        
        return print_count, console_count
    except Exception as e:
#         print(f"Error processing {file_path}: {e}")
        return 0, 0

def process_directory(directory):
    """Process all files in the directory recursively"""
    total_prints = 0
    total_consoles = 0
    for root, dirs, files in os.walk(directory):
        # Ignore specified directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if Path(file).suffix in FILE_EXTENSIONS:
                file_path = os.path.join(root, file)
                prints, consoles = count_and_comment_prints_and_logs(file_path)
                total_prints += prints
                total_consoles += consoles

#     print(f"Total print: {total_prints}, Total console.log: {total_consoles}")

if __name__ == "__main__":
    project_dir = input("Enter the project directory path (or press Enter to use current directory): ").strip()
    if not project_dir:
        project_dir = os.getcwd()
    
    if os.path.isdir(project_dir):
#         print(f"Processing files in: {project_dir}")
        process_directory(project_dir)
#         print("Operation completed!")
    else:
#         print("Error: Invalid path or not a directory.")
