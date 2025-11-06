#!/usr/bin/env python3
"""
Database migration script to add group support to existing databases
Run this script to upgrade your database schema
"""
import sqlite3
import os
import sys

# Determine database path
if os.path.exists('data/monitoring.db'):
    DATABASE = 'data/monitoring.db'
elif os.path.exists('../data/monitoring.db'):
    DATABASE = '../data/monitoring.db'
elif os.path.exists('backend/data/monitoring.db'):
    DATABASE = 'backend/data/monitoring.db'
else:
    print("❌ Could not find monitoring.db")
    print("Please run this script from the project root or backend directory")
    sys.exit(1)

print(f"📁 Found database at: {DATABASE}")

def check_column_exists(cursor, table, column):
    """Check if a column exists in a table"""
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def check_table_exists(cursor, table):
    """Check if a table exists"""
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None

def migrate_database():
    """Add missing columns and tables for group support"""
    print("\n🔄 Starting database migration...\n")
    
    db = sqlite3.connect(DATABASE)
    cursor = db.cursor()
    
    try:
        # Create groups table if not exists
        if not check_table_exists(cursor, 'groups'):
            print("✓ Creating 'groups' table...")
            cursor.execute('''
                CREATE TABLE groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    icon TEXT DEFAULT 'fa-server',
                    description TEXT,
                    color TEXT DEFAULT '#667eea',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("  ✓ Table 'groups' created")
        else:
            print("⊙ Table 'groups' already exists")
        
        # Add group_id column to hosts table if not exists
        if not check_column_exists(cursor, 'hosts', 'group_id'):
            print("✓ Adding 'group_id' column to 'hosts' table...")
            cursor.execute('ALTER TABLE hosts ADD COLUMN group_id INTEGER')
            print("  ✓ Column 'group_id' added")
        else:
            print("⊙ Column 'group_id' already exists in 'hosts' table")
        
        # Add enable_key_mapping column to hosts table if not exists
        if not check_column_exists(cursor, 'hosts', 'enable_key_mapping'):
            print("✓ Adding 'enable_key_mapping' column to 'hosts' table...")
            cursor.execute('ALTER TABLE hosts ADD COLUMN enable_key_mapping INTEGER DEFAULT 1')
            print("  ✓ Column 'enable_key_mapping' added")
        else:
            print("⊙ Column 'enable_key_mapping' already exists in 'hosts' table")
        
        # Commit changes
        db.commit()
        
        # Verify migration
        print("\n📊 Verifying migration...")
        cursor.execute("PRAGMA table_info(hosts)")
        host_columns = [row[1] for row in cursor.fetchall()]
        print(f"  Hosts table columns: {', '.join(host_columns)}")
        
        cursor.execute("PRAGMA table_info(groups)")
        group_columns = [row[1] for row in cursor.fetchall()]
        print(f"  Groups table columns: {', '.join(group_columns)}")
        
        # Show statistics
        cursor.execute("SELECT COUNT(*) FROM hosts")
        host_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM groups")
        group_count = cursor.fetchone()[0]
        
        print(f"\n📈 Database statistics:")
        print(f"  Total hosts: {host_count}")
        print(f"  Total groups: {group_count}")
        
        print("\n✅ Migration completed successfully!")
        print("\n💡 Next steps:")
        print("  1. Restart the Flask backend server")
        print("  2. Refresh your browser")
        print("  3. Start creating groups and organizing your hosts")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("  DATABASE MIGRATION - Adding Group Support")
    print("=" * 70)
    
    # Backup reminder
    print("\n⚠️  IMPORTANT: This script will modify your database")
    print("   Make sure you have a backup if needed")
    print(f"\n   Database: {DATABASE}")
    
    response = input("\n   Continue with migration? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        migrate_database()
    else:
        print("\n❌ Migration cancelled")
        sys.exit(0)
