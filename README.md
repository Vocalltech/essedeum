# Essedeum - Digital Typewriter + Wiki Story Manager

A local-first Story Manager application (Scrivener alternative) built with Tauri v2, React, TypeScript, Tailwind CSS, and SQLite.

## Features

- **Multi-Project Support**: Create and manage multiple stories/worlds independently
- **3-Pane Layout**: Chapters sidebar, writing environment, and wiki/lore panel
- **Digital Typewriter**: Distraction-free writing experience with TipTap editor
- **Hierarchical Document Management**: Organize chapters into folders and subfolders
- **Chapter Versioning**: Create and restore snapshots of your writing at any time
- **Chapter Synopsis**: Add brief summaries to chapters for quick reference
- **Advanced Wiki & Lore System**: Keep track of characters, locations, and other story elements per project
  - Lore Relationships (link lore entries, e.g., "Mentor of")
  - Rich Lore Entries with Images
  - Lore Templates (Character, Location, Item, Faction, Concept)
- **AI Story Assistant System**:
  - **6 Specialized Personas**: The Co-Author, The Ruthless Editor, The Plot Architect, The Lorekeeper, Character Simulator, Brainstorming Partner
  - **4-Layer Context System**: Builds prompts using Persona Identity, Story World Context, Project Memory, and Style Reference
  - **Deterministic RAG**: Injects relevant Wiki entries based on mentions in the text
  - **Project Memory System**: Save AI insights (plot points, world rules, character traits) as persistent project memories
  - **Ghostwriter Engine (Style Mimicry)**: Learns your writing style using dynamic excerpts from your chapters
- **AI Image Generation**: Generate character portraits, landscapes, and items directly from lore descriptions using Gemini models
- **Local-First**: All data stored locally in SQLite database
- **Auto-Save**: Automatic saving with 2-second debounce
- **Dark Theme**: Modern, clean, and easy on the eyes
- **Project Isolation**: Each project has its own chapters and lore entries

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Editor**: TipTap (rich text editor)
- **Backend**: Tauri v2 (Rust)
- **Database**: SQLite (via @tauri-apps/plugin-sql)
- **AI Integration**: Gemini API (`gemini-3.1-pro-preview` & `gemini-3.1-flash-image-preview`)
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

```text
essedeum/
├── src/
│   ├── components/
│   │   ├── Editor.tsx          # TipTap editor component
│   │   ├── WikiPanel.tsx       # Lore/wiki sidebar
│   │   └── ProjectSelector.tsx # Project management UI
│   ├── lib/
│   │   ├── ai.ts               # AI system and RAG implementation
│   │   ├── db.ts               # SQLite database service
│   │   ├── imageGen.ts         # AI Image generation
│   │   ├── templates.ts        # Lore entry templates
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
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT (project/story name)
- `description`: TEXT (project description)
- `created_at`: TEXT (ISO timestamp)
- `updated_at`: TEXT (ISO timestamp)

### Chapters Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `project_id`: INTEGER (foreign key to projects)
- `title`: TEXT (chapter/folder title)
- `content`: TEXT (chapter content in HTML)
- `synopsis`: TEXT (brief summary)
- `sort_order`: INTEGER (for ordering chapters)
- `parent_id`: INTEGER (for nested folders/documents)
- `type`: TEXT ('folder' or 'document')

### Chapter Snapshots Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `chapter_id`: INTEGER (foreign key to chapters)
- `content`: TEXT (snapshot content)
- `label`: TEXT (snapshot name/reason)
- `created_at`: TEXT (ISO timestamp)

### Lore Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `project_id`: INTEGER (foreign key to projects)
- `title`: TEXT (lore entry name)
- `type`: TEXT (Character, Location, Item, Faction, Concept)
- `content`: TEXT (lore entry content in HTML)
- `image_data`: TEXT (base64 image data)

### Relationships Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `project_id`: INTEGER (foreign key to projects)
- `source_id`: INTEGER (foreign key to lore)
- `target_id`: INTEGER (foreign key to lore)
- `label`: TEXT (connection type)

### Chat Memories Table
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `project_id`: INTEGER (foreign key to projects)
- `content`: TEXT (memory content)
- `type`: TEXT (plot_point, world_rule, character_decision, style_note, ai_insight)
- `created_at`: TEXT (ISO timestamp)

## Usage

### Managing Projects

1. On first launch, you'll see the project selector
2. Click **New Project** to create your first story/world
3. Enter a project name and optional description
4. Click on the project name in the top-left to switch between projects
5. Edit or delete projects from the project selector

### Managing Chapters

1. Click the **+** button in the Chapters sidebar to create a new chapter or folder
2. Drag and drop items to organize your manuscript hierarchically
3. Click on a chapter to select and edit it
4. Double-click a chapter title to edit it inline
5. Use the **Snapshot** feature in the editor toolbar to save versions of your chapters
6. Delete a chapter by hovering over it and clicking the trash icon

### Writing & AI Assistance

- The center pane provides a distraction-free writing environment
- Use the toolbar for basic formatting (Bold, Italic, Headings)
- Content auto-saves after 2 seconds of inactivity
- Invoke the AI Story Assistant to brainstorm, get editing feedback, or simulate character responses
- Select the appropriate **Persona** for your needs (Co-Author, Editor, Lorekeeper, Character Simulator, etc.)
- Save useful AI insights to **Project Memory** so the AI remembers them later

### Managing Lore & Relationships

1. Click the **+** button in the Wiki panel to add a new lore entry using predefined templates
2. Enter a name and select a type (Character, Location, Faction, etc.)
3. Click on a lore entry to edit its content in the main editor
4. Upload images or generate them with AI directly from the lore descriptions
5. Create **Relationships** between entries to map out character dynamics and world connections
6. The AI automatically reads your lore when you mention these items in your text!

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + Alt + 1/2/3**: Heading levels

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.