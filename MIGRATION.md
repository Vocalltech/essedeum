# Migration Guide

## Database Schema Changes

If you were using a previous version of Essedeum, the database schema has been updated to support multiple projects.

### What Changed

1. **New `projects` table** - Stores project/story information
2. **Updated `chapters` table** - Now includes `project_id` foreign key
3. **Updated `lore` table** - Now includes `project_id` foreign key

### Automatic Migration

The app will automatically create the new tables when you launch it. However, if you have existing data from a previous version, you'll need to migrate it manually.

### Manual Migration (if you have existing data)

If you have existing chapters and lore entries without a project_id, you can run this SQL to migrate them:

```sql
-- Create a default project
INSERT INTO projects (name, description) VALUES ('My Story', 'Migrated from previous version');

-- Get the project ID (should be 1 if this is your first project)
-- Update all chapters to belong to this project
UPDATE chapters SET project_id = 1 WHERE project_id IS NULL OR project_id = 0;

-- Update all lore entries to belong to this project
UPDATE lore SET project_id = 1 WHERE project_id IS NULL OR project_id = 0;
```

### Database Location

The SQLite database is located at:
- **macOS**: `~/Library/Application Support/com.solutions.essedeum/essedeum.db`
- **Windows**: `%APPDATA%\com.solutions.essedeum\essedeum.db`
- **Linux**: `~/.local/share/com.solutions.essedeum/essedeum.db`

You can use any SQLite browser (like [DB Browser for SQLite](https://sqlitebrowser.org/)) to manually inspect or modify the database if needed.

### Starting Fresh

If you prefer to start fresh with the new multi-project structure, simply delete the old database file and restart the app. It will create a new database with the correct schema.

## New Features

- **Multiple Projects**: Create separate projects for different stories or worlds
- **Project Switching**: Easily switch between projects via the project selector
- **Project Management**: Edit project names/descriptions, delete projects
- **Data Isolation**: Each project has its own chapters and lore entries
- **Better Organization**: Keep multiple stories organized in one app

