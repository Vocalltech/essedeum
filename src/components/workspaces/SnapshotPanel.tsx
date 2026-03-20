import { useState, useEffect } from "react";
import {
  History,
  Save,
  RotateCcw,
  Trash2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Snapshot,
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
} from "../../lib/db";

interface SnapshotPanelProps {
  chapterId: number;
  currentContent: string;
  onRestore: (content: string) => void;
}

export function SnapshotPanel({
  chapterId,
  currentContent,
  onRestore,
}: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [labelInput, setLabelInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(
    null,
  );
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    loadSnapshots();
  }, [chapterId]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const data = await getSnapshots(chapterId);
      setSnapshots(data);
      setSelectedSnapshot(null);
    } catch (error) {
      console.error("Failed to load snapshots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!currentContent.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const newSnapshot: Snapshot = {
        chapter_id: chapterId,
        content: currentContent,
        label: labelInput.trim() || "Manual Snapshot",
      };
      await saveSnapshot(newSnapshot);
      await loadSnapshots();
      setLabelInput("");
    } catch (error) {
      console.error("Failed to save snapshot:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSnapshot = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSnapshot(id);
      if (selectedSnapshot?.id === id) {
        setSelectedSnapshot(null);
      }
      setSnapshots(snapshots.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete snapshot:", error);
    }
  };

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    onRestore(selectedSnapshot.content);
    setShowRestoreConfirm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Create Snapshot Form */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          Version History
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="E.g., Before rewrite..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 placeholder-zinc-600"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTakeSnapshot();
            }}
          />
          <button
            onClick={handleTakeSnapshot}
            disabled={isSaving || !currentContent.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Snapshots List */}
        <div
          className={`overflow-y-auto ${selectedSnapshot ? "h-1/2 border-b border-zinc-800" : "flex-1"}`}
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              Loading history...
            </div>
          ) : snapshots.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full text-zinc-500">
              <History className="w-8 h-8 opacity-20 mb-3" />
              <p className="text-sm">No snapshots taken yet.</p>
              <p className="text-xs mt-1">
                Save a version before making major changes.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  onClick={() => {
                    setSelectedSnapshot(snapshot);
                    setShowRestoreConfirm(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                    selectedSnapshot?.id === snapshot.id
                      ? "bg-indigo-600/10 border-indigo-500/30"
                      : "bg-zinc-900 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">
                        {snapshot.label}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {snapshot.created_at && formatDate(snapshot.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSnapshot(snapshot.id!, e)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-700/50 text-zinc-500 hover:text-red-400 transition-all shrink-0"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Snapshot Preview */}
        {selectedSnapshot && (
          <div className="h-1/2 flex flex-col bg-zinc-950">
            <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Preview: {selectedSnapshot.label}
              </span>
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {showRestoreConfirm ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg m-2">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
                  <h4 className="text-sm font-medium text-zinc-200 mb-2">
                    Overwrite current text?
                  </h4>
                  <p className="text-xs text-zinc-400 mb-4 max-w-[200px]">
                    This will replace your current editor content with this
                    snapshot. You cannot undo this action.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRestoreConfirm(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRestore}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Yes, Restore
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="prose prose-invert prose-sm prose-zinc max-w-none opacity-70 select-none"
                  dangerouslySetInnerHTML={{ __html: selectedSnapshot.content }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
