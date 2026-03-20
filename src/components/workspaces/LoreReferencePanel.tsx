import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import { Lore, RelationshipWithDetails } from "../../lib/db";

interface LoreReferencePanelProps {
  lore: Lore;
  relationships: RelationshipWithDetails[];
  onClose: () => void;
  onLoreClick: (loreId: number) => void;
}

export function LoreReferencePanel({
  lore,
  relationships,
  onClose,
  onLoreClick,
}: LoreReferencePanelProps) {
  // Filter relationships for this lore
  const loreRelationships = relationships.filter(
    (r) => r.source_id === lore.id || r.target_id === lore.id,
  );

  // Ensure image source is formatted correctly (handles raw base64 from older versions)
  const getImageSrc = (data?: string) => {
    if (!data) return undefined;
    if (data.startsWith("data:image")) return data;
    return `data:image/png;base64,${data}`;
  };

  const imgSrc = getImageSrc(lore.image_data);

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-100 truncate">
            {lore.title}
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
            {lore.type}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors shrink-0 ml-2"
          title="Close Reference"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Image Section */}
        {imgSrc ? (
          <div className="rounded-lg overflow-hidden border border-zinc-800 shadow-md bg-zinc-900 flex justify-center">
            <img
              src={imgSrc}
              alt={lore.title}
              className="w-full aspect-video object-contain bg-black/50"
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg border border-dashed border-zinc-800 flex flex-col items-center justify-center bg-zinc-900/30 text-zinc-500 gap-2">
            <ImageIcon className="w-6 h-6 opacity-50" />
            <span className="text-xs">No image available</span>
          </div>
        )}

        {/* Relationships */}
        {loreRelationships.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              Connections
            </h3>
            <div className="space-y-1.5">
              {loreRelationships.map((rel) => {
                const isSource = rel.source_id === lore.id;
                const otherId = isSource ? rel.target_id : rel.source_id;
                const otherTitle = isSource
                  ? rel.target_title
                  : rel.source_title;
                const otherType = isSource ? rel.target_type : rel.source_type;

                return (
                  <div
                    key={rel.id}
                    className="p-2 bg-zinc-900 border border-zinc-800/50 rounded-lg flex flex-col"
                  >
                    <span className="text-[10px] text-zinc-500 font-medium mb-0.5">
                      {rel.label}
                    </span>
                    <button
                      onClick={() => onLoreClick(otherId)}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 text-left truncate"
                    >
                      {otherTitle}{" "}
                      <span className="text-xs font-normal text-zinc-500">
                        ({otherType})
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content (Read Only) */}
        {lore.content && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Notes
            </h3>
            <div
              className="prose prose-invert prose-sm prose-zinc max-w-none text-zinc-300 opacity-90 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: lore.content }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
