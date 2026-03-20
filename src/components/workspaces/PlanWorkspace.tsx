import { useState } from "react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { Chapter } from "../../lib/db";

interface PlanWorkspaceProps {
  chapters: Chapter[];
  onUpdateChapter: (chapter: Chapter) => void;
}

export function PlanWorkspace({
  chapters,
  onUpdateChapter,
}: PlanWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"corkboard" | "timeline">(
    "corkboard",
  );

  // Filter to only show documents (skip folders) for the planning view
  const documents = chapters
    .filter((c) => c.type === "document" || !c.type)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-100">Planning Board</h2>
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("corkboard")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === "corkboard"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Corkboard
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === "timeline"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <ListIcon className="w-4 h-4" /> Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <LayoutGrid className="w-16 h-16 opacity-30 mb-4" />
            <p>No documents found in the binder. Create a chapter first.</p>
          </div>
        ) : viewMode === "corkboard" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#2a2a2a] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl p-4 shadow-xl flex flex-col min-h-[240px] relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />
                <input
                  value={doc.title}
                  onChange={(e) =>
                    onUpdateChapter({ ...doc, title: e.target.value })
                  }
                  className="text-lg font-bold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 mb-3 placeholder-zinc-600"
                  placeholder="Scene Title"
                />
                <textarea
                  value={doc.synopsis || ""}
                  onChange={(e) =>
                    onUpdateChapter({ ...doc, synopsis: e.target.value })
                  }
                  placeholder="Write a synopsis or goal for this scene..."
                  className="flex-1 bg-transparent text-sm text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 leading-relaxed"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="flex gap-6 relative">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30 z-10 shrink-0">
                    {index + 1}
                  </div>
                  {index < documents.length - 1 && (
                    <div className="w-px h-full bg-zinc-800 -my-2" />
                  )}
                </div>
                {/* Timeline Card */}
                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg mb-8">
                  <input
                    value={doc.title}
                    onChange={(e) =>
                      onUpdateChapter({ ...doc, title: e.target.value })
                    }
                    className="text-lg font-semibold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 mb-3 w-full"
                    placeholder="Scene Title"
                  />
                  <textarea
                    value={doc.synopsis || ""}
                    onChange={(e) =>
                      onUpdateChapter({ ...doc, synopsis: e.target.value })
                    }
                    placeholder="Write a synopsis or goal for this scene..."
                    className="w-full h-24 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
