import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Lore, Chapter, RelationshipWithDetails } from '../lib/db';

interface GraphViewProps {
  loreEntries: Lore[];
  chapters: Chapter[];
  relationships?: RelationshipWithDetails[];
  onSelectLore?: (lore: Lore) => void;
}

// Color mapping for different lore types
const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  Character: { bg: '#3f1219', border: '#f43f5e', text: '#fb7185' },
  Location: { bg: '#052e16', border: '#22c55e', text: '#4ade80' },
  Item: { bg: '#451a03', border: '#f59e0b', text: '#fbbf24' },
  Event: { bg: '#2e1065', border: '#a855f7', text: '#c084fc' },
  Concept: { bg: '#083344', border: '#06b6d4', text: '#22d3ee' },
};

// Custom node component
function LoreNode({ data }: { data: { label: string; type: string; lore: Lore } }) {
  const colors = typeColors[data.type] || typeColors.Character;
  
  return (
    <div
      className="px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105"
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        minWidth: '100px',
        textAlign: 'center',
      }}
    >
      <div className="text-xs font-medium opacity-70 mb-1" style={{ color: colors.text }}>
        {data.type}
      </div>
      <div className="text-sm font-semibold" style={{ color: colors.text }}>
        {data.label}
      </div>
    </div>
  );
}

const nodeTypes = {
  loreNode: LoreNode,
};

// Extract lore mentions from HTML content
function extractMentionsFromContent(content: string): number[] {
  const mentionIds: number[] = [];
  
  // Match data-id attributes in mention spans
  const regex = /data-id="(\d+)"/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const id = parseInt(match[1], 10);
    if (!isNaN(id)) {
      mentionIds.push(id);
    }
  }
  
  return mentionIds;
}

// Calculate co-occurrence relationships between lore items (Story Scenes)
function calculateCoOccurrences(
  loreEntries: Lore[],
  chapters: Chapter[]
): Map<string, number> {
  const coOccurrences = new Map<string, number>();
  
  chapters.forEach((chapter) => {
    const content = chapter.content.toLowerCase();
    
    // Get all lore IDs mentioned in this chapter
    const mentionedIds = new Set<number>();
    
    // Check for explicit mentions (data-id)
    extractMentionsFromContent(chapter.content).forEach((id) => {
      mentionedIds.add(id);
    });
    
    // Also check for title mentions in text
    loreEntries.forEach((lore) => {
      if (lore.id && content.includes(lore.title.toLowerCase())) {
        mentionedIds.add(lore.id);
      }
    });
    
    // Create edges between all pairs of mentioned lore items
    const mentionedArray = Array.from(mentionedIds);
    for (let i = 0; i < mentionedArray.length; i++) {
      for (let j = i + 1; j < mentionedArray.length; j++) {
        const id1 = mentionedArray[i];
        const id2 = mentionedArray[j];
        // Create a consistent key regardless of order
        const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
        coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
      }
    }
  });
  
  return coOccurrences;
}

// Arrange nodes in a circular layout
function arrangeNodesCircularly(nodes: Node[], centerX: number, centerY: number, radius: number): Node[] {
  const angleStep = (2 * Math.PI) / nodes.length;
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: centerX + radius * Math.cos(angleStep * index - Math.PI / 2),
      y: centerY + radius * Math.sin(angleStep * index - Math.PI / 2),
    },
  }));
}

export function GraphView({ loreEntries, chapters, relationships = [], onSelectLore }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Calculate nodes and edges when data changes
  useEffect(() => {
    // Safely get relationships inside the effect
    const safeRelationships = relationships || [];
    
    // Filter lore entries to only those with valid IDs
    const validLoreEntries = loreEntries.filter(lore => lore.id !== undefined && lore.id !== null);
    
    if (validLoreEntries.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create a set of valid node IDs for quick lookup
    const validNodeIds = new Set(validLoreEntries.map(lore => String(lore.id)));

    // Create nodes for each lore entry
    let newNodes: Node[] = validLoreEntries.map((lore) => ({
      id: String(lore.id),
      type: 'loreNode',
      position: { x: 0, y: 0 }, // Will be arranged later
      data: {
        label: lore.title,
        type: lore.type,
        lore,
      },
    }));

    // Arrange nodes in a circle
    const centerX = 200;
    const centerY = 200;
    const radius = Math.max(150, validLoreEntries.length * 30);
    newNodes = arrangeNodesCircularly(newNodes, centerX, centerY, radius);

    // Calculate co-occurrence relationships (Story Scenes - dashed gray lines)
    const coOccurrences = calculateCoOccurrences(validLoreEntries, chapters);

    // Create edges array
    const newEdges: Edge[] = [];
    
    // Track which pairs have explicit relationships to avoid duplicate edges
    const explicitPairs = new Set<string>();
    
    // Add explicit relationships first (Story Facts - solid lines with labels and arrows)
    safeRelationships.forEach((rel) => {
      const source = String(rel.source_id);
      const target = String(rel.target_id);
      
      // Skip if either source or target node doesn't exist
      if (!validNodeIds.has(source) || !validNodeIds.has(target)) {
        return;
      }
      
      const pairKey = Number(rel.source_id) < Number(rel.target_id) 
        ? `${rel.source_id}-${rel.target_id}` 
        : `${rel.target_id}-${rel.source_id}`;
      
      explicitPairs.add(pairKey);
      
      newEdges.push({
        id: `explicit-${rel.id}`,
        source,
        target,
        type: 'default',
        animated: false,
        style: {
          stroke: '#60a5fa', // Blue color for explicit relationships
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#60a5fa',
          width: 20,
          height: 20,
        },
        label: rel.label,
        labelStyle: {
          fill: '#60a5fa',
          fontSize: 11,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#18181b',
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      });
    });

    // Add co-occurrence edges (Story Scenes - dashed gray lines, no label)
    coOccurrences.forEach((weight, key) => {
      // Skip if there's already an explicit relationship between these nodes
      if (explicitPairs.has(key)) {
        return;
      }
      
      const [source, target] = key.split('-');
      newEdges.push({
        id: `cooccur-${key}`,
        source,
        target,
        type: 'default',
        animated: false,
        style: {
          stroke: '#525252', // Gray color for co-occurrences
          strokeWidth: Math.min(weight, 3),
          strokeDasharray: '5,5', // Dashed line
        },
        // No arrow for co-occurrence edges
        label: undefined,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [loreEntries, chapters, relationships, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onSelectLore && node.data.lore) {
        onSelectLore(node.data.lore);
      }
    },
    [onSelectLore]
  );

  if (loreEntries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
        <div className="text-center">
          <p className="mb-2">No lore entries to visualize.</p>
          <p className="text-xs">Add characters, locations, and other lore to see the knowledge graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 2,
        }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'default',
        }}
      >
        <Background color="#27272a" gap={20} />
        <Controls
          className="!bg-zinc-800 !border-zinc-700 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-lg p-3 max-w-[200px]">
        <div className="text-xs font-semibold text-zinc-400 mb-2">Node Types</div>
        <div className="space-y-1.5 mb-3">
          {Object.entries(typeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.border }}
              />
              <span className="text-xs text-zinc-400">{type}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-zinc-800 pt-2">
          <div className="text-xs font-semibold text-zinc-400 mb-2">Edge Types</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-400" />
              <span className="text-xs text-zinc-400">Story Facts</span>
            </div>
            <div className="text-xs text-zinc-500 ml-8">
              (Explicit relationships)
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-0.5" 
                style={{ 
                  background: 'repeating-linear-gradient(90deg, #525252 0, #525252 3px, transparent 3px, transparent 6px)' 
                }} 
              />
              <span className="text-xs text-zinc-400">Story Scenes</span>
            </div>
            <div className="text-xs text-zinc-500 ml-8">
              (Same chapter mentions)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
