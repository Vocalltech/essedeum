import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let isInitializing = false;

export function isDBReady() {
  return db !== null;
}

async function ensureDB() {
  if (!db) {
    await initDB();
  }
  if (!db) {
    throw new Error("Database failed to initialize");
  }
  return db;
}

export interface Project {
  id?: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id?: number;
  project_id: number;
  title: string;
  content: string;
  synopsis?: string;
  sort_order: number;
  parent_id?: number | null;
  type?: "folder" | "document";
}

export interface Snapshot {
  id?: number;
  chapter_id: number;
  content: string;
  label: string;
  created_at?: string;
}

export interface Lore {
  id?: number;
  project_id: number;
  title: string;
  type: string;
  content: string;
  image_data?: string;
}

export interface Relationship {
  id?: number;
  project_id: number;
  source_id: number;
  target_id: number;
  label: string;
}

export interface RelationshipWithDetails extends Relationship {
  source_title?: string;
  source_type?: string;
  target_title?: string;
  target_type?: string;
}

export type MemoryType =
  | "plot_point"
  | "world_rule"
  | "character_decision"
  | "style_note"
  | "ai_insight";

export interface ChatMemory {
  id?: number;
  project_id: number;
  content: string;
  type: MemoryType;
  created_at?: string;
}

export interface MapPin {
  id?: number;
  project_id: number;
  lore_id: number;
  x: number;
  y: number;
  label: string;
}

export interface MapPinWithDetails extends MapPin {
  lore_title?: string;
  lore_type?: string;
}

export async function initDB(): Promise<void> {
  if (db) return;
  if (isInitializing) return;

  isInitializing = true;

  try {
    db = await Database.load("sqlite:essedeum.db");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        synopsis TEXT DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        parent_id INTEGER,
        type TEXT NOT NULL DEFAULT 'document',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES chapters(id) ON DELETE CASCADE
      )
    `);

    try {
      await db.execute(
        "ALTER TABLE chapters ADD COLUMN parent_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE",
      );
    } catch {}

    try {
      await db.execute(
        "ALTER TABLE chapters ADD COLUMN type TEXT NOT NULL DEFAULT 'document'",
      );
    } catch {}

    try {
      await db.execute(
        "ALTER TABLE chapters ADD COLUMN synopsis TEXT DEFAULT ''",
      );
    } catch {}

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chapter_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      )
    `);

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

    try {
      await db.execute("ALTER TABLE lore ADD COLUMN image_data TEXT");
    } catch {}

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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS map_pins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        lore_id INTEGER NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        label TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (lore_id) REFERENCES lore(id) ON DELETE CASCADE
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

export async function getProjects(): Promise<Project[]> {
  const database = await ensureDB();
  try {
    return await database.select<Project[]>(
      "SELECT * FROM projects ORDER BY updated_at DESC",
    );
  } catch (error) {
    console.error("Failed to get projects:", error);
    throw error;
  }
}

export async function createProject(
  name: string,
  description: string,
): Promise<number> {
  const database = await ensureDB();
  try {
    const result = await database.execute(
      "INSERT INTO projects (name, description) VALUES (?, ?)",
      [name, description],
    );
    return result.lastInsertId as number;
  } catch (error) {
    console.error("Failed to create project:", error);
    throw error;
  }
}

export async function updateProject(
  id: number,
  name: string,
  description: string,
): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute(
      "UPDATE projects SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
      [name, description, id],
    );
  } catch (error) {
    console.error("Failed to update project:", error);
    throw error;
  }
}

export async function deleteProject(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM projects WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

// ==================== CHAPTER OPERATIONS ====================

export async function getChapters(projectId: number): Promise<Chapter[]> {
  const database = await ensureDB();
  try {
    return await database.select<Chapter[]>(
      "SELECT * FROM chapters WHERE project_id = ? ORDER BY sort_order ASC",
      [projectId],
    );
  } catch (error) {
    console.error("Failed to get chapters:", error);
    throw error;
  }
}

export async function saveChapter(chapter: Chapter): Promise<number> {
  const database = await ensureDB();
  try {
    if (chapter.id) {
      await database.execute(
        "UPDATE chapters SET title = ?, content = ?, synopsis = ?, sort_order = ?, parent_id = ?, type = ? WHERE id = ?",
        [
          chapter.title,
          chapter.content,
          chapter.synopsis || "",
          chapter.sort_order,
          chapter.parent_id || null,
          chapter.type || "document",
          chapter.id,
        ],
      );
      await database.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [chapter.project_id],
      );
      return chapter.id;
    } else {
      const result = await database.execute(
        "INSERT INTO chapters (project_id, title, content, synopsis, sort_order, parent_id, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          chapter.project_id,
          chapter.title,
          chapter.content,
          chapter.synopsis || "",
          chapter.sort_order,
          chapter.parent_id || null,
          chapter.type || "document",
        ],
      );
      await database.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [chapter.project_id],
      );
      return result.lastInsertId as number;
    }
  } catch (error) {
    console.error("Failed to save chapter:", error);
    throw error;
  }
}

export async function deleteChapter(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM chapters WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    throw error;
  }
}

// ==================== SNAPSHOT OPERATIONS ====================

export async function getSnapshots(chapterId: number): Promise<Snapshot[]> {
  const database = await ensureDB();
  try {
    return await database.select<Snapshot[]>(
      "SELECT * FROM chapter_snapshots WHERE chapter_id = ? ORDER BY created_at DESC",
      [chapterId],
    );
  } catch (error) {
    console.error("Failed to get snapshots:", error);
    throw error;
  }
}

export async function saveSnapshot(snapshot: Snapshot): Promise<number> {
  const database = await ensureDB();
  try {
    const result = await database.execute(
      "INSERT INTO chapter_snapshots (chapter_id, content, label) VALUES (?, ?, ?)",
      [snapshot.chapter_id, snapshot.content, snapshot.label],
    );
    return result.lastInsertId as number;
  } catch (error) {
    console.error("Failed to save snapshot:", error);
    throw error;
  }
}

export async function deleteSnapshot(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM chapter_snapshots WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete snapshot:", error);
    throw error;
  }
}

// ==================== LORE OPERATIONS ====================

export async function getLore(projectId: number): Promise<Lore[]> {
  const database = await ensureDB();
  try {
    return await database.select<Lore[]>(
      "SELECT * FROM lore WHERE project_id = ? ORDER BY title ASC",
      [projectId],
    );
  } catch (error) {
    console.error("Failed to get lore:", error);
    throw error;
  }
}

export async function saveLore(lore: Lore): Promise<number> {
  const database = await ensureDB();
  try {
    if (lore.id) {
      await database.execute(
        "UPDATE lore SET title = ?, type = ?, content = ? WHERE id = ?",
        [lore.title, lore.type, lore.content, lore.id],
      );
      await database.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [lore.project_id],
      );
      return lore.id;
    } else {
      const result = await database.execute(
        "INSERT INTO lore (project_id, title, type, content) VALUES (?, ?, ?, ?)",
        [lore.project_id, lore.title, lore.type, lore.content],
      );
      await database.execute(
        "UPDATE projects SET updated_at = datetime('now') WHERE id = ?",
        [lore.project_id],
      );
      return result.lastInsertId as number;
    }
  } catch (error) {
    console.error("Failed to save lore:", error);
    throw error;
  }
}

export async function updateLoreImage(
  loreId: number,
  imageData: string | null,
): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("UPDATE lore SET image_data = ? WHERE id = ?", [
      imageData,
      loreId,
    ]);
  } catch (error) {
    console.error("Failed to update lore image:", error);
    throw error;
  }
}

export async function deleteLore(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM lore WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete lore:", error);
    throw error;
  }
}

// ==================== RELATIONSHIP OPERATIONS ====================

export async function getRelationships(
  projectId: number,
): Promise<RelationshipWithDetails[]> {
  const database = await ensureDB();
  try {
    return await database.select<RelationshipWithDetails[]>(
      `
      SELECT
        r.*,
        s.title as source_title,
        s.type as source_type,
        t.title as target_title,
        t.type as target_type
      FROM relationships r
      JOIN lore s ON r.source_id = s.id
      JOIN lore t ON r.target_id = t.id
      WHERE r.project_id = ?
      `,
      [projectId],
    );
  } catch (error) {
    console.error("Failed to get relationships:", error);
    throw error;
  }
}

export async function getRelationshipsForLore(
  loreId: number,
): Promise<RelationshipWithDetails[]> {
  const database = await ensureDB();
  try {
    return await database.select<RelationshipWithDetails[]>(
      `
      SELECT
        r.*,
        s.title as source_title,
        s.type as source_type,
        t.title as target_title,
        t.type as target_type
      FROM relationships r
      JOIN lore s ON r.source_id = s.id
      JOIN lore t ON r.target_id = t.id
      WHERE r.source_id = ? OR r.target_id = ?
      `,
      [loreId, loreId],
    );
  } catch (error) {
    console.error("Failed to get relationships for lore:", error);
    throw error;
  }
}

export async function addRelationship(
  projectId: number,
  sourceId: number,
  targetId: number,
  label: string,
): Promise<number> {
  const database = await ensureDB();
  try {
    const result = await database.execute(
      "INSERT INTO relationships (project_id, source_id, target_id, label) VALUES (?, ?, ?, ?)",
      [projectId, sourceId, targetId, label],
    );
    return result.lastInsertId as number;
  } catch (error) {
    console.error("Failed to add relationship:", error);
    throw error;
  }
}

export async function deleteRelationship(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM relationships WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete relationship:", error);
    throw error;
  }
}

// ==================== MEMORY OPERATIONS ====================

export async function saveMemory(memory: ChatMemory): Promise<number> {
  const database = await ensureDB();
  try {
    const result = await database.execute(
      "INSERT INTO chat_memories (project_id, content, type) VALUES (?, ?, ?)",
      [memory.project_id, memory.content, memory.type],
    );
    return result.lastInsertId as number;
  } catch (error) {
    console.error("Failed to save memory:", error);
    throw error;
  }
}

export async function getRecentMemories(
  projectId: number,
  limit: number = 10,
): Promise<ChatMemory[]> {
  const database = await ensureDB();
  try {
    return await database.select<ChatMemory[]>(
      "SELECT * FROM chat_memories WHERE project_id = ? ORDER BY created_at DESC LIMIT ?",
      [projectId, limit],
    );
  } catch (error) {
    console.error("Failed to get memories:", error);
    throw error;
  }
}

export async function getAllMemories(projectId: number): Promise<ChatMemory[]> {
  const database = await ensureDB();
  try {
    return await database.select<ChatMemory[]>(
      "SELECT * FROM chat_memories WHERE project_id = ? ORDER BY type, created_at DESC",
      [projectId],
    );
  } catch (error) {
    console.error("Failed to get all memories:", error);
    throw error;
  }
}

export async function deleteMemory(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM chat_memories WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete memory:", error);
    throw error;
  }
}

export async function updateMemory(
  id: number,
  content: string,
  type: MemoryType,
): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute(
      "UPDATE chat_memories SET content = ?, type = ? WHERE id = ?",
      [content, type, id],
    );
  } catch (error) {
    console.error("Failed to update memory:", error);
    throw error;
  }
}

// ==================== GENERATIVE AI HELPERS ====================

export async function getRandomChapterExcerpts(
  projectId: number,
  count: number = 3,
  maxLength: number = 1000,
): Promise<string[]> {
  const database = await ensureDB();
  try {
    const chapters = await database.select<Chapter[]>(
      "SELECT * FROM chapters WHERE project_id = ? AND length(content) > 100",
      [projectId],
    );

    if (chapters.length === 0) return [];

    const excerpts: string[] = [];
    const usedChapterIds = new Set<number>();

    for (let i = 0; i < count && usedChapterIds.size < chapters.length; i++) {
      const availableChapters = chapters.filter(
        (c) => !usedChapterIds.has(c.id!),
      );
      if (availableChapters.length === 0) break;

      const randomIndex = Math.floor(Math.random() * availableChapters.length);
      const chapter = availableChapters[randomIndex];
      usedChapterIds.add(chapter.id!);

      const plainText = chapter.content
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (plainText.length <= maxLength) {
        excerpts.push(`From "${chapter.title}":\n${plainText}`);
      } else {
        const maxStart = plainText.length - maxLength;
        const startPos = Math.floor(Math.random() * maxStart);

        let excerpt = plainText.substring(startPos, startPos + maxLength);

        const firstSpace = excerpt.indexOf(" ");
        if (firstSpace !== -1 && firstSpace < 50) {
          excerpt = excerpt.substring(firstSpace + 1);
        }

        const lastSpace = excerpt.lastIndexOf(" ");
        if (lastSpace !== -1 && lastSpace > excerpt.length - 50) {
          excerpt = excerpt.substring(0, lastSpace);
        }

        excerpts.push(`From "${chapter.title}":\n...${excerpt}...`);
      }
    }

    return excerpts;
  } catch (error) {
    console.error("Failed to get random excerpts:", error);
    return [];
  }
}

// ==================== MAP PINS OPERATIONS ====================

export async function getMapPins(
  projectId: number,
): Promise<MapPinWithDetails[]> {
  const database = await ensureDB();
  try {
    return await database.select<MapPinWithDetails[]>(
      `SELECT m.*, l.title as lore_title, l.type as lore_type
       FROM map_pins m
       LEFT JOIN lore l ON m.lore_id = l.id
       WHERE m.project_id = ?`,
      [projectId],
    );
  } catch (error) {
    console.error("Failed to load map pins:", error);
    throw error;
  }
}

export async function saveMapPin(
  pin: Omit<MapPin, "id"> | MapPin,
): Promise<MapPin> {
  const database = await ensureDB();
  try {
    if ("id" in pin && pin.id) {
      await database.execute(
        "UPDATE map_pins SET lore_id = ?, x = ?, y = ?, label = ? WHERE id = ?",
        [pin.lore_id, pin.x, pin.y, pin.label, pin.id],
      );
      return pin as MapPin;
    } else {
      const result = await database.execute(
        "INSERT INTO map_pins (project_id, lore_id, x, y, label) VALUES (?, ?, ?, ?, ?)",
        [pin.project_id, pin.lore_id, pin.x, pin.y, pin.label],
      );
      return { ...pin, id: result.lastInsertId } as MapPin;
    }
  } catch (error) {
    console.error("Failed to save map pin:", error);
    throw error;
  }
}

export async function deleteMapPin(id: number): Promise<void> {
  const database = await ensureDB();
  try {
    await database.execute("DELETE FROM map_pins WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete map pin:", error);
    throw error;
  }
}
