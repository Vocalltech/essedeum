import { useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Users,
  MapPin,
  Box,
  Shield,
  BookOpen,
} from "lucide-react";
import { Lore, RelationshipWithDetails } from "../../lib/db";

const TYPE_ICONS: Record<string, React.ElementType> = {
  Character: Users,
  Location: MapPin,
  Item: Box,
  Faction: Shield,
  Concept: BookOpen,
};

const TYPE_COLORS: Record<string, string> = {
  Character: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  Location: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Item: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Faction: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  Concept: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

// Custom Node to make them look nice and match the app theme
const LoreNode = ({ data }: { data: { label: string; type: string } }) => {
  const Icon = TYPE_ICONS[data.type] || BookOpen;
  const colorClasses = TYPE_COLORS[data.type] || "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";

  return (
    <div className={`px-4 py-2 shadow-lg rounded-md border bg-zinc-900 flex items-center gap-2 ${colorClasses} min-w-[120px]`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-500 border-none" />
      <Icon className="w-4 h-4" />
      <div className="text-sm font-medium text-zinc-100">{data.label}</div>
      <div className="text-[10px] absolute -bottom-5 left-1/2 -translate-x-1/2 text-zinc-500 font-mono tracking-wider uppercase whitespace-nowrap">
        {data.type}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-zinc-500 border-none" />
    </div>
  );
};

const nodeTypes = {
  lore: LoreNode,
};

interface RelationshipWebProps {
  loreEntries: Lore[];
  relationships: RelationshipWithDetails[];
  onNodeClick?: (loreId: number) => void;
}

export function RelationshipWeb({
  loreEntries,
  relationships,
  onNodeClick,
}: RelationshipWebProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Generate nodes and edges from props
  useEffect(() => {
    // Simple circular layout algorithm
    const radius = Math.max(200, loreEntries.length * 40);
    const centerX = 400;
    const centerY = 300;

    const initialNodes: Node[] = loreEntries.map((lore, index) => {
      const angle = (index / loreEntries.length) * 2 * Math.PI;
      return {
        id: lore.id!.toString(),
        type: "lore",
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: { label: lore.title, type: lore.type },
      };
    });

    const initialEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id!.toString(),
      source: rel.source_id.toString(),
      target: rel.target_id.toString(),
      label: rel.label,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 1.5 }, // Indigo-500
      labelStyle: { fill: "#a1a1aa", fontSize: 11, fontWeight: 500 }, // Zinc-400
      labelBgStyle: { fill: "#18181b", color: "#18181b", fillOpacity: 0.8 }, // Zinc-900
      labelBgPadding: [4, 4],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#6366f1",
      },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [loreEntries, relationships, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick?.(parseInt(node.id))}
        fitView
        className="dark"
        minZoom={0.1}
      >
        <Background color="#27272a" gap={20} size={1} />
        <Controls
          className="bg-zinc-900 border-zinc-800 fill-zinc-400"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data?.type) {
              case "Character": return "#f43f5e";
              case "Location": return "#10b981";
              case "Item": return "#f59e0b";
              case "Faction": return "#8b5cf6";
              default: return "#06b6d4";
            }
          }}
          maskColor="#09090b80"
          className="bg-zinc-900 border-zinc-800"
        />
      </ReactFlow>
    </div>
  );
}
