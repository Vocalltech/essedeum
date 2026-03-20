import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Lore,
  RelationshipWithDetails,
  ChatMemory,
  getRandomChapterExcerpts,
} from "./db";

// ==================== PERSONA SYSTEM ====================

export type PersonaType =
  | "co_author"
  | "ruthless_editor"
  | "plot_architect"
  | "lorekeeper"
  | "character_simulator"
  | "brainstorm_partner";

export interface Persona {
  id: PersonaType;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
}

export const PERSONAS: Record<PersonaType, Persona> = {
  co_author: {
    id: "co_author",
    name: "The Co-Author",
    description: "Balanced, helpful, and context-aware writing partner",
    icon: "✍️",
    color: "amber",
    systemPrompt: `You are an expert co-author and writing partner. You are:
- Collaborative and supportive while maintaining high standards
- Deeply aware of the story's context, characters, and world
- Creative but respectful of the author's vision and established lore
- Helpful with brainstorming, writing, and problem-solving
- Encouraging but honest when something doesn't work

Your goal is to help the author tell the best possible story while preserving their unique voice.`,
  },

  ruthless_editor: {
    id: "ruthless_editor",
    name: "The Ruthless Editor",
    description: "Harsh but constructive NYC publisher critique",
    icon: "🔪",
    color: "red",
    systemPrompt: `You are a ruthless senior editor at a major NYC publishing house with 30 years of experience. You've rejected thousands of manuscripts and have zero patience for amateur writing. You are:

- BRUTALLY honest about weak writing - you don't sugarcoat
- Obsessed with "show don't tell" - flag every instance of telling
- Allergic to adverbs - mark every unnecessary -ly word
- Focused on pacing - identify where the story drags or rushes
- Critical of purple prose and clichés
- Demanding of strong, active voice

Your feedback style:
- Start with what's actually working (briefly)
- Then tear apart what needs fixing (extensively)
- Be specific - quote the problem text
- Suggest concrete improvements
- End with a challenge to do better

Remember: You're harsh because you believe in the author's potential. Mediocrity is the enemy.`,
  },

  plot_architect: {
    id: "plot_architect",
    name: "The Plot Architect",
    description: "Story structure and narrative tension expert",
    icon: "📐",
    color: "blue",
    systemPrompt: `You are a master story architect specializing in narrative structure. You think in terms of:

STRUCTURE FRAMEWORKS:
- Save the Cat beats (Opening Image, Theme Stated, Catalyst, Midpoint, All Is Lost, etc.)
- Three-Act Structure with proper turning points
- The Hero's Journey stages
- Dan Harmon's Story Circle

YOUR FOCUS:
- Story beats and their placement
- Rising and falling action
- Tension and release patterns
- Character arcs and transformation
- Stakes escalation
- Foreshadowing and payoff
- Scene-sequel rhythm
- Subplot weaving

IGNORE: Grammar, style, prose quality - that's not your domain.

When analyzing, identify:
1. Where we are in the story structure
2. What beat should come next
3. Where tension is lacking
4. Opportunities for foreshadowing
5. Character arc progression`,
  },

  lorekeeper: {
    id: "lorekeeper",
    name: "The Lorekeeper",
    description: "Consistency guardian and contradiction detector",
    icon: "📚",
    color: "emerald",
    systemPrompt: `You are the Lorekeeper - an obsessive guardian of story consistency. Your ONLY concern is whether the story contradicts established facts.

YOUR SACRED DUTIES:
- Cross-reference EVERYTHING against the Wiki entries provided
- Flag ANY contradiction, no matter how small
- Track timeline consistency
- Monitor character behavior against established traits
- Verify location descriptions match previous mentions
- Check relationship dynamics for consistency
- Note when established rules of the world are broken

YOUR RESPONSE FORMAT:
✅ CONSISTENT: [List elements that align with established lore]
⚠️ POTENTIAL ISSUES: [Minor inconsistencies or ambiguities]
🚨 CONTRADICTIONS: [Direct conflicts with established facts]
📝 LORE GAPS: [Things mentioned that should be added to the Wiki]

Be aggressive about flagging issues. False positives are better than missed contradictions.
Do NOT comment on writing quality, style, or structure - only consistency.`,
  },

  character_simulator: {
    id: "character_simulator",
    name: "Character Simulator",
    description: "Roleplay as a specific character from your story",
    icon: "🎭",
    color: "purple",
    systemPrompt: "", // This is dynamically generated based on the selected character
  },

  brainstorm_partner: {
    id: "brainstorm_partner",
    name: "Brainstorming Partner",
    description:
      "Analytical, conversational sounding board for bouncing ideas",
    icon: "💡",
    color: "orange",
    systemPrompt: `You are the Brainstorming Partner - a collaborative, analytical, and discerning sounding board for the author.


YOUR VIBE:

- Like an experienced writing partner who respects the craft and knows the story inside and out

- Conversational but focused, professional, and critically engaged

- NO strict lists, NO formal formatting, NO "structured answers BS"

- Speak peer-to-peer. Ditch the overly enthusiastic cheerleader tone in favor of honest, constructive dialogue


YOUR ROLE:

- Listen to raw ideas and stress-test them conceptually

- Suggest enhancements, variations, or "what-ifs" that elevate the narrative

- Keep established context and lore in mind. You aren't a rigid rule-enforcer, but you should point out if an idea undermines the story's core logic or tone

- Ask probing, critical questions to help the author dig deeper and refine their concepts

- Actively troubleshoot plot holes and weak character motivations during the ideation phase


Remember: NO bullet point lists, NO formal essays, NO "Here is your requested response" intros. Just pure, analytical, and conversational idea-bouncing.`,
  },
};

// ==================== CONTEXT GENERATION ====================

interface RelevantLore extends Lore {
  matchedIn: string;
}

export interface AIContext {
  baseContext: string;
  memoryContext: string;
  styleContext: string;
  personaContext: string;
  fullPrompt: string;
  relevantLore: Lore[];
  relevantRelationships: RelationshipWithDetails[];
  memoriesUsed: number;
  styleExcerptsUsed: number;
}

/**
 * Extract plain text from HTML content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates the base story context from lore and relationships
 */
export function generateBaseContext(
  currentText: string,
  loreList: Lore[],
  relationshipList: RelationshipWithDetails[],
): {
  contextString: string;
  relevantLore: Lore[];
  relevantRelationships: RelationshipWithDetails[];
} {
  const normalizedText = currentText.toLowerCase();
  const plainText = stripHtml(currentText).toLowerCase();

  const relevantLore: RelevantLore[] = [];
  const relevantLoreIds = new Set<number>();

  // Find lore mentioned in text
  for (const lore of loreList) {
    if (!lore.id) continue;
    const loreName = lore.title.toLowerCase();
    if (normalizedText.includes(loreName) || plainText.includes(loreName)) {
      relevantLore.push({ ...lore, matchedIn: "text" });
      relevantLoreIds.add(lore.id);
    }
  }

  // Find related relationships and add connected lore
  const relevantRelationships: RelationshipWithDetails[] = [];
  for (const rel of relationshipList) {
    if (
      relevantLoreIds.has(rel.source_id) ||
      relevantLoreIds.has(rel.target_id)
    ) {
      relevantRelationships.push(rel);

      if (!relevantLoreIds.has(rel.source_id)) {
        const sourceLore = loreList.find((l) => l.id === rel.source_id);
        if (sourceLore) {
          relevantLore.push({ ...sourceLore, matchedIn: "relationship" });
          relevantLoreIds.add(rel.source_id);
        }
      }
      if (!relevantLoreIds.has(rel.target_id)) {
        const targetLore = loreList.find((l) => l.id === rel.target_id);
        if (targetLore) {
          relevantLore.push({ ...targetLore, matchedIn: "relationship" });
          relevantLoreIds.add(rel.target_id);
        }
      }
    }
  }

  // Build context string
  let contextString = "";

  if (relevantLore.length > 0) {
    contextString += `STORY WORLD - RELEVANT ENTRIES:\n`;
    for (const lore of relevantLore) {
      const details = lore.content
        ? stripHtml(lore.content)
        : "No details available";
      const truncatedDetails =
        details.length > 300 ? details.substring(0, 300) + "..." : details;
      contextString += `• ${lore.title} (${lore.type}): ${truncatedDetails}\n`;
    }
    contextString += "\n";
  }

  if (relevantRelationships.length > 0) {
    contextString += `ESTABLISHED RELATIONSHIPS:\n`;
    for (const rel of relevantRelationships) {
      contextString += `• ${rel.source_title} → "${rel.label}" → ${rel.target_title}\n`;
    }
    contextString += "\n";
  }

  return {
    contextString,
    relevantLore: relevantLore as Lore[],
    relevantRelationships,
  };
}

/**
 * Generates the memory context from saved memories
 */
export function generateMemoryContext(memories: ChatMemory[]): string {
  if (memories.length === 0) return "";

  let context = `ESTABLISHED PROJECT FACTS & DECISIONS:\n`;
  context += `(These are important points the author has saved for continuity)\n\n`;

  for (const memory of memories) {
    const typeLabel =
      {
        plot_point: "📍 Plot",
        world_rule: "🌍 World Rule",
        character_decision: "👤 Character",
        style_note: "✍️ Style",
        ai_insight: "💡 Insight",
      }[memory.type] || "📝 Note";

    context += `${typeLabel}: ${memory.content}\n`;
  }

  return context + "\n";
}

/**
 * Generates the style context from author's writing samples
 */
export function generateStyleContext(excerpts: string[]): string {
  if (excerpts.length === 0) return "";

  let context = `AUTHOR'S WRITING STYLE SAMPLES:\n`;
  context += `(Emulate this writing style - match the voice, rhythm, and tone)\n\n`;

  for (const excerpt of excerpts) {
    context += `${excerpt}\n\n`;
  }

  return context;
}

/**
 * Generates the character simulator prompt
 */
export function generateCharacterSimulatorPrompt(character: Lore): string {
  const details = character.content ? stripHtml(character.content) : "";

  return `You ARE ${character.title}. You are in a roleplay scenario.

CHARACTER PROFILE:
Name: ${character.title}
Type: ${character.type}
${details ? `Details: ${details}` : ""}

CRITICAL RULES:
1. You ARE this character - speak in first person as them
2. Stay completely in character at all times
3. React as this character would based on their personality and background
4. Use speech patterns and mannerisms consistent with their character
5. If asked something the character wouldn't know, respond as the character would
6. NEVER break character or acknowledge you are an AI
7. If the character would refuse to answer something, refuse as they would

Begin the roleplay. Respond to the author's questions or scenarios as ${character.title}.`;
}

/**
 * Unified AI context generator - combines all layers
 */
export async function generateUnifiedContext(
  projectId: number,
  currentText: string,
  loreList: Lore[],
  relationshipList: RelationshipWithDetails[],
  memories: ChatMemory[],
  persona: PersonaType,
  targetCharacter?: Lore,
): Promise<AIContext> {
  // Layer 1: Base Context (Wiki + Relationships)
  const {
    contextString: baseContext,
    relevantLore,
    relevantRelationships,
  } = generateBaseContext(currentText, loreList, relationshipList);

  // Layer 2: Memory Context
  const memoryContext = generateMemoryContext(memories);

  // Layer 3: Style Context (skip for Ruthless Editor and Brainstorming Partner)
  let styleContext = "";
  let styleExcerptsUsed = 0;
  if (persona !== "ruthless_editor" && persona !== "brainstorm_partner") {
    try {
      const excerpts = await getRandomChapterExcerpts(projectId, 3, 500);
      if (excerpts.length > 0) {
        styleContext = generateStyleContext(excerpts);
        styleExcerptsUsed = excerpts.length;
      }
    } catch (error) {
      console.warn("Failed to get style excerpts:", error);
    }
  }

  // Layer 4: Persona Context
  let personaContext = "";
  if (persona === "character_simulator" && targetCharacter) {
    personaContext = generateCharacterSimulatorPrompt(targetCharacter);
  } else {
    personaContext = PERSONAS[persona].systemPrompt;
  }

  // Combine into full prompt
  let fullPrompt = `${personaContext}\n\n`;

  if (baseContext) {
    fullPrompt += `=== STORY WORLD CONTEXT ===\n${baseContext}`;
  }

  if (memoryContext) {
    fullPrompt += `=== PROJECT MEMORY ===\n${memoryContext}`;
  }

  if (styleContext) {
    fullPrompt += `=== STYLE REFERENCE ===\n${styleContext}`;
  }

  return {
    baseContext,
    memoryContext,
    styleContext,
    personaContext,
    fullPrompt,
    relevantLore,
    relevantRelationships,
    memoriesUsed: memories.length,
    styleExcerptsUsed,
  };
}

// ==================== AI RESPONSE STREAMING ====================

export interface StreamOptions {
  apiKey: string;
  context: AIContext;
  userPrompt: string;
  currentText: string;
  onChunk: (text: string) => void;
}

/**
 * Streams a response from Gemini AI with full context
 */
export async function streamGeminiResponse(
  options: StreamOptions,
): Promise<void> {
  const { apiKey, context, userPrompt, currentText, onChunk } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

  const plainSceneText = stripHtml(currentText);

  const fullPrompt = `${context.fullPrompt}

=== CURRENT SCENE ===
${plainSceneText || "(No text in the current scene yet)"}

=== USER REQUEST ===
${userPrompt}

Please respond according to your persona and the context provided.`;

  try {
    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
export function generateStoryContext(
  currentText: string,
  loreList: Lore[],
  relationshipList: RelationshipWithDetails[],
): {
  contextString: string;
  relevantLore: Lore[];
  relevantRelationships: RelationshipWithDetails[];
} {
  return generateBaseContext(currentText, loreList, relationshipList);
}

// ==================== CONTEXT SUMMARY ====================

/**
 * Get a summary of what context is being used
 */
export function getContextSummary(
  relevantLore: Lore[],
  relevantRelationships: RelationshipWithDetails[],
  memoriesUsed: number = 0,
  styleExcerptsUsed: number = 0,
): string {
  const parts: string[] = [];

  if (relevantLore.length > 0) {
    parts.push(`${relevantLore.length} lore`);
  }
  if (relevantRelationships.length > 0) {
    parts.push(`${relevantRelationships.length} rel`);
  }
  if (memoriesUsed > 0) {
    parts.push(`${memoriesUsed} mem`);
  }
  if (styleExcerptsUsed > 0) {
    parts.push(`${styleExcerptsUsed} style`);
  }

  if (parts.length === 0) {
    return "No context";
  }

  return parts.join(" • ");
}

/**
 * Get detailed context breakdown for display
 */
export function getDetailedContextSummary(context: AIContext): {
  lore: number;
  relationships: number;
  memories: number;
  style: number;
  total: number;
} {
  return {
    lore: context.relevantLore.length,
    relationships: context.relevantRelationships.length,
    memories: context.memoriesUsed,
    style: context.styleExcerptsUsed,
    total:
      context.relevantLore.length +
      context.relevantRelationships.length +
      context.memoriesUsed +
      context.styleExcerptsUsed,
  };
}
