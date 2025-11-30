# Essedeum - Digital Typewriter + Wiki Story Manager

A local-first Story Manager application (Scrivener alternative) built with Tauri v2, React, TypeScript, Tailwind CSS, and SQLite.

## Features

- **Multi-Project Support**: Create and manage multiple stories/worlds independently
- **3-Pane Layout**: Chapters sidebar, writing environment, and wiki/lore panel
- **Digital Typewriter**: Distraction-free writing experience with TipTap editor
- **Wiki/Lore Management**: Keep track of characters, locations, and other story elements per project
- **Local-First**: All data stored locally in SQLite database
- **Auto-Save**: Automatic saving with 2-second debounce
- **Dark Theme**: Modern, clean, and easy on the eyes
- **Project Isolation**: Each project has its own chapters and lore entries

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Editor**: TipTap (rich text editor)
- **Backend**: Tauri v2 (Rust)
- **Database**: SQLite (via @tauri-apps/plugin-sql)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run tauri dev
```

3. Build for production:
```bash
npm run tauri build
```

## Project Structure

```
essedeum/
├── src/
│   ├── components/
│   │   ├── Editor.tsx          # TipTap editor component
│   │   ├── WikiPanel.tsx       # Lore/wiki sidebar
│   │   └── ProjectSelector.tsx # Project management UI
│   ├── lib/
│   │   ├── db.ts               # SQLite database service
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles (Tailwind)
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Rust entry point
│   │   └── lib.rs              # Tauri application setup
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
└── package.json                # Node dependencies
```

## Database Schema

### Projects Table
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT (project/story name)
- `description`: TEXT (project description)
- `created_at`: TEXT (ISO timestamp)
- `updated_at`: TEXT (ISO timestamp)

### Chapters Table
- `id`: INTEGER PRIMARY KEY
- `project_id`: INTEGER (foreign key to projects)
- `title`: TEXT (chapter title)
- `content`: TEXT (chapter content in HTML)
- `sort_order`: INTEGER (for ordering chapters)

### Lore Table
- `id`: INTEGER PRIMARY KEY
- `project_id`: INTEGER (foreign key to projects)
- `title`: TEXT (lore entry name)
- `type`: TEXT (Character, Location, Item, Event, Concept)
- `content`: TEXT (lore entry content in HTML)

## Usage

### Managing Projects

1. On first launch, you'll see the project selector
2. Click **New Project** to create your first story/world
3. Enter a project name and optional description
4. Click on the project name in the top-left to switch between projects
5. Edit or delete projects from the project selector

### Managing Chapters

1. Click the **+** button in the Chapters sidebar to create a new chapter
2. Click on a chapter to select and edit it
3. Double-click a chapter title to edit it inline
4. Delete a chapter by hovering over it and clicking the trash icon

### Writing

- The center pane provides a distraction-free writing environment
- Use the toolbar for basic formatting (Bold, Italic, Headings)
- Content auto-saves after 2 seconds of inactivity

### Managing Lore

1. Click the **+** button in the Wiki panel to add a new lore entry
2. Enter a name and select a type (Character, Location, etc.)
3. Click on a lore entry to edit its content in the main editor
4. Lore entries are automatically grouped by type

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + Alt + 1/2/3**: Heading levels

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
