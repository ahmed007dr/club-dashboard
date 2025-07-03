import sqlite3
import os

def get_table_info(db_path, table_name):
    """Get the record count and estimated size of a table."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Get record count
        cursor.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
        row_count = cursor.fetchone()[0]
        # Try to get table size using dbstat
        size = 0
        try:
            cursor.execute(f"SELECT SUM(pgsize) FROM dbstat WHERE name = ?", (table_name,))
            size = cursor.fetchone()[0] or 0
        except sqlite3.OperationalError as e:
#             print(f"dbstat not available for {table_name}: {e}")
            # Fallback: Estimate size by summing lengths of text/binary columns
            cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
            columns = [row[1] for row in cursor.fetchall()]
            if row_count > 0:
                query = f"SELECT " + ", ".join([f"LENGTH(\"{col}\")" for col in columns]) + f" FROM \"{table_name}\""
                cursor.execute(query)
                for row in cursor.fetchall():
                    size += sum(l or 0 for l in row)  # Sum lengths, treat NULL as 0
        conn.close()
        return row_count, size
    except sqlite3.OperationalError as e:
#         print(f"Error accessing table {table_name}: {e}")
        return 0, 0

def get_all_tables(db_path):
    """Get a list of all tables in the database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()
        return tables
    except sqlite3.OperationalError as e:
#         print(f"Error retrieving tables: {e}")
        return []

def get_db_file_size(db_path):
    """Get the file size of the database in bytes."""
    try:
        return os.path.getsize(db_path)
    except OSError as e:
#         print(f"Error getting file size for {db_path}: {e}")
        return 0

def compare_databases(old_db_path, new_db_path):
    """Compare two SQLite databases and print differences."""
#     print("\n=== Database Comparison Report ===")
    
    # Check file sizes
    old_file_size = get_db_file_size(old_db_path)
    new_file_size = get_db_file_size(new_db_path)
#     print(f"\nFile sizes:")
#     print(f"Old database ({old_db_path}): {old_file_size} bytes (~{old_file_size / 1024 / 1024:.2f} MB)")
#     print(f"New database ({new_db_path}): {new_file_size} bytes (~{new_file_size / 1024 / 1024:.2f} MB)")
    
    # Get all tables from both databases
    old_tables = set(get_all_tables(old_db_path))
    new_tables = set(get_all_tables(new_db_path))
    
    # Find tables present in one database but not the other
    old_only = old_tables - new_tables
    new_only = new_tables - old_tables
    common_tables = old_tables & new_tables
    
    # Print tables only in old database
    if old_only:
#         print("\nTables only in old database:")
        for table in old_only:
            row_count, size = get_table_info(old_db_path, table)
#             print(f"{table}: {row_count} records, {size} bytes (dbstat or estimated)")
    
    # Print tables only in new database
    if new_only:
#         print("\nTables only in new database:")
        for table in new_only:
            row_count, size = get_table_info(new_db_path, table)
#             print(f"{table}: {row_count} records, {size} bytes (dbstat or estimated)")
    
    # Compare common tables
#     print("\nComparison of common tables:")
    total_old_size = 0
    total_new_size = 0
#     print(f"{'Table':<30} {'Old Records':<12} {'New Records':<12} {'Old Size (bytes)':<16} {'New Size (bytes)':<16} {'Size Difference':<16}")
#     print("-" * 100)
    
    for table in sorted(common_tables):
        old_count, old_size = get_table_info(old_db_path, table)
        new_count, new_size = get_table_info(new_db_path, table)
        size_diff = old_size - new_size
        total_old_size += old_size
        total_new_size += new_size
#         print(f"{table:<30} {old_count:<12} {new_count:<12} {old_size:<16} {new_size:<16} {size_diff:<16}")
    
    # Print total sizes
#     print("\nTotal table sizes (dbstat or estimated):")
#     print(f"Old database: {total_old_size} bytes (~{total_old_size / 1024 / 1024:.2f} MB)")
#     print(f"New database: {total_new_size} bytes (~{total_new_size / 1024 / 1024:.2f} MB)")
#     print(f"Size difference: {total_old_size - total_new_size} bytes (~{(total_old_size - total_new_size) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    OLD_DB_PATH = r"F:\club\clubx\src\db_old_old.sqlite3"
    NEW_DB_PATH = r"F:\club\clubx\src\db.sqlite3"
    
    # Check if files exist
    if not os.path.exists(OLD_DB_PATH):
#         print(f"Error: {OLD_DB_PATH} does not exist")
    elif not os.path.exists(NEW_DB_PATH):
#         print(f"Error: {NEW_DB_PATH} does not exist")
    else:
        compare_databases(OLD_DB_PATH, NEW_DB_PATH)