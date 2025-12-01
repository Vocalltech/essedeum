import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let isInitializing = false;

/**
 * Check if database is ready
 */
export function isDBReady(): boolean {
  return db !== null;
}

/**
 * Helper to ensure DB is initialized before operations
 */
async function ensureDB(): Promise<Database> {
  if (db) return db;

  // If already initializing, wait for it to complete
  if (isInitializing) {
    // Wait up to 5 seconds for initialization
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (db) return db;
      if (!isInitializing) break;
    }
  }

  throw new Error("Database not initialized");
}

export interface Project {
  id?: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id?: number;
  project_id: number;
  title: string;
  content: string;
  sort_order: number;
}

export interface Lore {
  id?: number;
  project_id: number;
  title: string;
  type: string;
  content: string;
  image_data?: string; // Base64 encoded image data
}

export interface Relationship {
  id?: number;
  project_id: number;
  source_id: number;
  target_id: number;
  label: string;
}

// Extended relationship with lore details for display
export interface RelationshipWithDetails extends Relationship {
  source_title?: string;
  source_type?: string;
  target_title?: string;
  target_type?: string;
}

// Memory types for the AI system
export type MemoryType = 'plot_point' | 'world_rule' | 'character_decision' | 'style_note' | 'ai_insight';

export interface ChatMemory {
  id?: number;
  project_id: number;
  content: string;
  type: MemoryType;
  created_at: string;
}

/**
 * Initialize the database connection and create tables if they don't exist
 */
export async function initDB(): Promise<void> {
  if (db) return; // Already initialized
  if (isInitializing) return; // Already in progress

  isInitializing = true;

  try {
    // Connect to SQLite database (creates file if it doesn't exist)
    db = await Database.load("sqlite:essedeum.db");

    // Create projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create chapters table with project_id
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create lore table with project_id
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lore (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        image_data TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Migration: Add image_data column if it doesn't exist (for existing databases)
    try {
      await db.execute(`ALTER TABLE lore ADD COLUMN image_data TEXT`);
    } catch {
      // Column already exists, ignore error
    }

    // Create relationships table for explicit connections between lore entries
    await db.execute(`
      CREATE TABLE IF NOT EXISTS relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (source_id) REFERENCES lore(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES lore(id) ON DELETE CASCADE
      )
    `);

    // Create chat_memories table for AI project memory
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'ai_insight',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    db = null;
    throw error;
  } finally {
    isInitializing = false;
  }
}

// ==================== PROJECT OPERATIONS ====================

/**
 * Get all projects
 */
export async function getProjects(): Promise<Project[]> {
  const database = await ensureDB();

  try {
    const result = await database.select<Project[]>(
      "SELECT * FROM projects ORDER BY updated_at DESC"
    );
    return result;
  } catch (error) {
    console.error("Failed to get projects:", error);
    throw error;
  }
}

/**
 * Create a new project
 */
export async function createProject(name: string, description: string = ''): Promise<number> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.execute(
      "INSERT INTO projects (name, description) VALUES (?, ?)",
      [name, description]
    );
    if (result.lastInsertId === undefined) {
      throw new Error("Failed to get insert ID for project");
    }
    return result.lastInsertId;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

/**
 * Update a project
 */
export async function updateProject(project: Project): Promise<void> {
  if (!db) throw new Error("Database not initialized");
  if (!project.id) throw new Error("Project ID is required");

  try {
    await db.execute(
      "UPDATE projects SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
      [project.name, project.description, project.id]
    );
  } catch (error) {
    console.error("Failed to update project:", error);
    throw error;
  }
}

/**
 * Delete a project (cascades to chapters and lore)
 */
export async function deleteProject(id: number): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.execute("DELETE FROM projects WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

// ==================== CHAPTER OPERATIONS ====================

/**
 * Get all chapters for a project ordered by sort_order
 */
export async function getChapters(projectId: number): Promise<Chapter[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.select<Chapter[]>(
      "SELECT * FROM chapters WHERE project_id = ? ORDER BY sort_order ASC",
      [projectId]
    );
    return result;
  } catch (error) {
    console.error("Failed to get chapters:", error);
    throw error;
  }
}

/**
 * Save or update a chapter
 */
export async function saveChapter(chapter: Chapter): Promise<number> {
  if (!db) throw new Error("Database not initialized");

  try {
    if (chapter.id) {
      // Update existing chapter
      await db.execute(
        "UPDATE chapters SET title = ?, content = ?, sort_order = ? WHERE id = ?",
        [chapter.title, chapter.content, chapter.sort_order, chapter.id]
      );

      // Update project's updated_at
      await db.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [chapter.project_id]
      );

      return chapter.id;
    } else {
      // Insert new chapter
      const result = await db.execute(
        "INSERT INTO chapters (project_id, title, content, sort_order) VALUES (?, ?, ?, ?)",
        [chapter.project_id, chapter.title, chapter.content, chapter.sort_order]
      );

      // Update project's updated_at
      await db.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [chapter.project_id]
      );

      if (result.lastInsertId === undefined) {
        throw new Error("Failed to get insert ID for chapter");
      }
      return result.lastInsertId;
    }
  } catch (error) {
    console.error("Failed to save chapter:", error);
    throw error;
  }
}

/**
 * Delete a chapter by ID
 */
export async function deleteChapter(id: number, projectId: number): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.execute("DELETE FROM chapters WHERE id = ?", [id]);

    // Update project's updated_at
    await db.execute(
      "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
      [projectId]
    );
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    throw error;
  }
}

// ==================== LORE OPERATIONS ====================

/**
 * Get all lore entries for a project
 */
export async function getLore(projectId: number): Promise<Lore[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.select<Lore[]>(
      "SELECT * FROM lore WHERE project_id = ? ORDER BY type, title ASC",
      [projectId]
    );
    return result;
  } catch (error) {
    console.error("Failed to get lore:", error);
    throw error;
  }
}

/**
 * Save or update a lore entry
 */
export async function saveLore(lore: Lore): Promise<number> {
  if (!db) throw new Error("Database not initialized");

  try {
    if (lore.id) {
      // Update existing lore
      await db.execute(
        "UPDATE lore SET title = ?, type = ?, content = ?, image_data = ? WHERE id = ?",
        [lore.title, lore.type, lore.content, lore.image_data || null, lore.id]
      );

      // Update project's updated_at
      await db.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [lore.project_id]
      );

      return lore.id;
    } else {
      // Insert new lore
      const result = await db.execute(
        "INSERT INTO lore (project_id, title, type, content, image_data) VALUES (?, ?, ?, ?, ?)",
        [lore.project_id, lore.title, lore.type, lore.content, lore.image_data || null]
      );

      // Update project's updated_at
      await db.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [lore.project_id]
      );

      if (result.lastInsertId === undefined) {
        throw new Error("Failed to get insert ID for lore");
      }
      return result.lastInsertId;
    }
  } catch (error) {
    console.error("Failed to save lore:", error);
    throw error;
  }
}

/**
 * Update lore image data
 */
export async function updateLoreImage(loreId: number, projectId: number, imageData: string | null): Promise<void> {
  const database = await ensureDB();

  try {
    await database.execute(
      "UPDATE lore SET image_data = ? WHERE id = ?",
      [imageData, loreId]
    );

    // Update project's updated_at
    await database.execute(
      "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
      [projectId]
    );
  } catch (error) {
    console.error("Failed to update lore image:", error);
    throw error;
  }
}

/**
 * Delete a lore entry by ID
 */
export async function deleteLore(id: number, projectId: number): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.execute("DELETE FROM lore WHERE id = ?", [id]);

    // Update project's updated_at
    await db.execute(
      "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
      [projectId]
    );
  } catch (error) {
    console.error("Failed to delete lore:", error);
    throw error;
  }
}

// ==================== RELATIONSHIP OPERATIONS ====================

/**
 * Get all relationships for a project with lore details
 */
export async function getRelationships(projectId: number): Promise<RelationshipWithDetails[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.select<RelationshipWithDetails[]>(
      `SELECT 
        r.id, r.project_id, r.source_id, r.target_id, r.label,
        s.title as source_title, s.type as source_type,
        t.title as target_title, t.type as target_type
      FROM relationships r
      LEFT JOIN lore s ON r.source_id = s.id
      LEFT JOIN lore t ON r.target_id = t.id
      WHERE r.project_id = ?
      ORDER BY r.id ASC`,
      [projectId]
    );
    return result;
  } catch (error) {
    console.error("Failed to get relationships:", error);
    throw error;
  }
}

/**
 * Get relationships for a specific lore entry (where it's source or target)
 */
export async function getRelationshipsForLore(loreId: number): Promise<RelationshipWithDetails[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.select<RelationshipWithDetails[]>(
      `SELECT 
        r.id, r.project_id, r.source_id, r.target_id, r.label,
        s.title as source_title, s.type as source_type,
        t.title as target_title, t.type as target_type
      FROM relationships r
      LEFT JOIN lore s ON r.source_id = s.id
      LEFT JOIN lore t ON r.target_id = t.id
      WHERE r.source_id = ? OR r.target_id = ?
      ORDER BY r.id ASC`,
      [loreId, loreId]
    );
    return result;
  } catch (error) {
    console.error("Failed to get relationships for lore:", error);
    throw error;
  }
}

/**
 * Add a new relationship between two lore entries
 */
export async function addRelationship(
  projectId: number,
  sourceId: number,
  targetId: number,
  label: string
): Promise<number> {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.execute(
      "INSERT INTO relationships (project_id, source_id, target_id, label) VALUES (?, ?, ?, ?)",
      [projectId, sourceId, targetId, label]
    );

    // Update project's updated_at
    await db.execute(
      "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
      [projectId]
    );

    if (result.lastInsertId === undefined) {
      throw new Error("Failed to get insert ID for relationship");
    }
    return result.lastInsertId;
  } catch (error) {
    console.error("Failed to add relationship:", error);
    throw error;
  }
}

/**
 * Delete a relationship by ID
 */
export async function deleteRelationship(id: number, projectId: number): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.execute("DELETE FROM relationships WHERE id = ?", [id]);

    // Update project's updated_at
    await db.execute(
      "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
      [projectId]
    );
  } catch (error) {
    console.error("Failed to delete relationship:", error);
    throw error;
  }
}

// ==================== MEMORY OPERATIONS ====================

/**
 * Save a memory to the project
 */
export async function saveMemory(
  projectId: number,
  content: string,
  type: MemoryType
): Promise<number> {
  const database = await ensureDB();

  try {
    const result = await database.execute(
      "INSERT INTO chat_memories (project_id, content, type) VALUES (?, ?, ?)",
      [projectId, content, type]
    );

    if (result.lastInsertId === undefined) {
      throw new Error("Failed to get insert ID for memory");
    }
    return result.lastInsertId;
  } catch (error) {
    console.error("Failed to save memory:", error);
    throw error;
  }
}

/**
 * Get recent memories for a project
 */
export async function getRecentMemories(
  projectId: number,
  limit: number = 10
): Promise<ChatMemory[]> {
  const database = await ensureDB();

  try {
    const result = await database.select<ChatMemory[]>(
      "SELECT * FROM chat_memories WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit]
    );
    return result;
  } catch (error) {
    console.error("Failed to get memories:", error);
    throw error;
  }
}

/**
 * Get all memories for a project
 */
export async function getAllMemories(projectId: number): Promise<ChatMemory[]> {
  const database = await ensureDB();

  try {
    const result = await database.select<ChatMemory[]>(
      "SELECT * FROM chat_memories WHERE project_id = ? ORDER BY created_at DESC",
      [projectId]
    );
    return result;
  } catch (error) {
    console.error("Failed to get all memories:", error);
    throw error;
  }
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(id: number): Promise<void> {
  const database = await ensureDB();

  try {
    await database.execute("DELETE FROM chat_memories WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete memory:", error);
    throw error;
  }
}

/**
 * Get random chapter excerpts for style analysis
 */
export async function getRandomChapterExcerpts(
  projectId: number,
  excerptCount: number = 3,
  excerptLength: number = 500
): Promise<string[]> {
  const database = await ensureDB();

  try {
    // Get all chapters with content
    const chapters = await database.select<Chapter[]>(
      "SELECT * FROM chapters WHERE project_id = ? AND content != '' AND content IS NOT NULL",
      [projectId]
    );

    if (chapters.length === 0) {
      return [];
    }

    const excerpts: string[] = [];
    const usedChapterIds = new Set<number>();

    // Try to get excerpts from different chapters
    for (let i = 0; i < excerptCount && usedChapterIds.size < chapters.length; i++) {
      // Pick a random chapter we haven't used yet
      const availableChapters = chapters.filter(c => c.id && !usedChapterIds.has(c.id));
      if (availableChapters.length === 0) break;

      const randomIndex = Math.floor(Math.random() * availableChapters.length);
      const chapter = availableChapters[randomIndex];

      if (chapter.id) {
        usedChapterIds.add(chapter.id);
      }

      // Extract plain text from HTML content
      const plainText = chapter.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (plainText.length < 50) continue; // Skip very short content

      // Pick a random starting position
      const maxStart = Math.max(0, plainText.length - excerptLength);
      const startPos = Math.floor(Math.random() * maxStart);

      // Extract excerpt, trying to start/end at word boundaries
      let excerpt = plainText.substring(startPos, startPos + excerptLength);

      // Try to start at a word boundary
      const firstSpace = excerpt.indexOf(' ');
      if (firstSpace > 0 && firstSpace < 50) {
        excerpt = excerpt.substring(firstSpace + 1);
      }

      // Try to end at a word boundary
      const lastSpace = excerpt.lastIndexOf(' ');
      if (lastSpace > excerpt.length - 50) {
        excerpt = excerpt.substring(0, lastSpace);
      }

      if (excerpt.length > 50) {
        excerpts.push(`[From "${chapter.title}"]: ${excerpt}`);
      }
    }

    return excerpts;
  } catch (error) {
    console.error("Failed to get chapter excerpts:", error);
    throw error;
  }
}
