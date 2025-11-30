import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lore, RelationshipWithDetails } from './db';

/**
 * Represents a piece of lore that's relevant to the current context
 */
interface RelevantLore extends Lore {
  matchedIn: string; // Where the match was found
}

/**
 * Generates a story context string based on the current text and available lore/relationships.
 * Uses deterministic RAG - only includes lore items that are mentioned in the text.
 */
export function generateStoryContext(
  currentText: string,
  loreList: Lore[],
  relationshipList: RelationshipWithDetails[]
): { contextString: string; relevantLore: Lore[]; relevantRelationships: RelationshipWithDetails[] } {
  // Normalize current text for case-insensitive matching
  const normalizedText = currentText.toLowerCase();
  
  // Also extract plain text from HTML if present
  const plainText = currentText
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')  // Replace &nbsp;
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .toLowerCase()
    .trim();

  // Find relevant lore items - those mentioned in the text
  const relevantLore: RelevantLore[] = [];
  const relevantLoreIds = new Set<number>();

  for (const lore of loreList) {
    if (!lore.id) continue;
    
    const loreName = lore.title.toLowerCase();
    
    // Check if the lore name appears in the text
    if (normalizedText.includes(loreName) || plainText.includes(loreName)) {
      relevantLore.push({ ...lore, matchedIn: 'text' });
      relevantLoreIds.add(lore.id);
    }
  }

  // Find relevant relationships - those involving relevant lore items
  const relevantRelationships: RelationshipWithDetails[] = [];

  for (const rel of relationshipList) {
    // Include relationship if either source or target is in relevant lore
    if (relevantLoreIds.has(rel.source_id) || relevantLoreIds.has(rel.target_id)) {
      relevantRelationships.push(rel);
      
      // Also add the other party to relevant lore if not already included
      if (!relevantLoreIds.has(rel.source_id)) {
        const sourceLore = loreList.find(l => l.id === rel.source_id);
        if (sourceLore) {
          relevantLore.push({ ...sourceLore, matchedIn: 'relationship' });
          relevantLoreIds.add(rel.source_id);
        }
      }
      if (!relevantLoreIds.has(rel.target_id)) {
        const targetLore = loreList.find(l => l.id === rel.target_id);
        if (targetLore) {
          relevantLore.push({ ...targetLore, matchedIn: 'relationship' });
          relevantLoreIds.add(rel.target_id);
        }
      }
    }
  }

  // Build the context string
  let contextString = `SYSTEM CONTEXT:
You are an expert story editor and writing assistant. Here is the known "Truth" for this story world:

`;

  if (relevantLore.length > 0) {
    contextString += `RELEVANT CHARACTERS/LOCATIONS/ITEMS:
`;
    for (const lore of relevantLore) {
      const details = lore.content ? lore.content.replace(/<[^>]*>/g, '').trim() : 'No details available';
      const truncatedDetails = details.length > 200 ? details.substring(0, 200) + '...' : details;
      contextString += `- ${lore.title} (${lore.type}): ${truncatedDetails || 'No details available'}
`;
    }
    contextString += '\n';
  } else {
    contextString += `No specific characters or locations detected in the current text.
`;
  }

  if (relevantRelationships.length > 0) {
    contextString += `RELEVANT RELATIONSHIPS:
`;
    for (const rel of relevantRelationships) {
      contextString += `- ${rel.source_title} is "${rel.label}" of ${rel.target_title}
`;
    }
    contextString += '\n';
  }

  contextString += `INSTRUCTIONS:
- Answer questions based on the story context above
- Stay consistent with established facts and relationships
- If asked to write or suggest, match the tone and style of the current scene
- Be creative but respect the established world-building
`;

  return {
    contextString,
    relevantLore: relevantLore as Lore[],
    relevantRelationships,
  };
}

/**
 * Streams a response from Gemini AI
 */
export async function streamGeminiResponse(
  apiKey: string,
  contextString: string,
  userPrompt: string,
  currentText: string,
  onChunk: (text: string) => void
): Promise<void> {
  // Initialize the Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  // Extract plain text from HTML for the scene context
  const plainSceneText = currentText
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Construct the full prompt
  const fullPrompt = `${contextString}

CURRENT SCENE TEXT:
${plainSceneText || '(No text in the current scene yet)'}

USER QUESTION:
${userPrompt}

Please provide a helpful response based on the context above.`;

  try {
    // Generate streaming response
    const result = await model.generateContentStream(fullPrompt);

    // Process the stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onChunk(chunkText);
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Get a simple count of context items for display
 */
export function getContextSummary(
  relevantLore: Lore[],
  relevantRelationships: RelationshipWithDetails[]
): string {
  const loreCount = relevantLore.length;
  const relCount = relevantRelationships.length;
  
  if (loreCount === 0 && relCount === 0) {
    return 'No context detected';
  }
  
  const parts: string[] = [];
  if (loreCount > 0) {
    parts.push(`${loreCount} ${loreCount === 1 ? 'entry' : 'entries'}`);
  }
  if (relCount > 0) {
    parts.push(`${relCount} ${relCount === 1 ? 'relationship' : 'relationships'}`);
  }
  
  return `Reading ${parts.join(', ')}`;
}

