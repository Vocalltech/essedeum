import { useState, useEffect } from "react";
import {
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Folder,
  FileText,
  CornerLeftUp,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Kanban,
} from "lucide-react";
import { Chapter, TimelineEvent, Project } from "../../lib/db";
import { STORY_TEMPLATES } from "../../lib/templates";

interface PlanWorkspaceProps {
  chapters: Chapter[];
  onUpdateChapter: (chapter: Chapter) => void;
  onGenerateStructure?: (templateKey: string) => void;
  timelineEvents: TimelineEvent[];
  onSaveTimelineEvent: (event: TimelineEvent) => void;
  onDeleteTimelineEvent: (id: number) => void;
  currentProjectId: number;
  currentProject: Project;
  onUpdateKanbanColumns: (columns: string[]) => void;
  focusText?: string;
  clearFocusText?: () => void;
}

export function PlanWorkspace({
  chapters,
  onUpdateChapter,
  onGenerateStructure,
  timelineEvents,
  onSaveTimelineEvent,
  onDeleteTimelineEvent,
  currentProjectId,
  currentProject,
  onUpdateKanbanColumns,
  focusText,
  clearFocusText,
}: PlanWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"corkboard" | "timeline" | "kanban">(
    "corkboard",
  );
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);

  const currentParent = chapters.find((c) => c.id === currentParentId);

  // Filter to only show children of the current folder
  const documents = chapters
    .filter((c) => c.parent_id === currentParentId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const allDocuments = chapters
    .filter((c) => c.type === "document")
    .sort((a, b) => a.sort_order - b.sort_order);

  const parsedColumns = currentProject?.kanban_columns
    ? JSON.parse(currentProject.kanban_columns)
    : ["To-Do", "First Draft", "Revising", "Ready for Edit", "Final"];

  const KANBAN_COLUMNS = parsedColumns as string[];
  const [editingColumns, setEditingColumns] = useState(false);
  const [tempColumns, setTempColumns] = useState<string>(
    KANBAN_COLUMNS.join(", "),
  );

  const [draggedChapterId, setDraggedChapterId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, chapterId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", chapterId.toString());
    setDraggedChapterId(chapterId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const chapterId =
      draggedChapterId || parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (chapterId && !isNaN(chapterId)) {
      const chapter = chapters.find((c) => c.id === chapterId);
      if (chapter && chapter.status !== status) {
        onUpdateChapter({ ...chapter, status });
      }
    }
    setDraggedChapterId(null);
  };

  const getBreadcrumb = (chapter: Chapter): string => {
    if (!chapter.parent_id) return "Root";
    const parent = chapters.find((c) => c.id === chapter.parent_id);
    return parent ? parent.title : "Root";
  };

  const handleDoubleClick = (chapter: Chapter) => {
    if (chapter.type === "folder") {
      setCurrentParentId(chapter.id!);
    }
  };

  const handleGoUp = () => {
    if (currentParent) {
      setCurrentParentId(currentParent.parent_id || null);
    }
  };

  useEffect(() => {
    if (focusText) {
      if (viewMode !== "timeline") {
        setViewMode("timeline");
        return;
      }

      const timer = setTimeout(() => {
        const targetEvent = timelineEvents.find(
          (e) =>
            e.title.toLowerCase().includes(focusText.toLowerCase()) ||
            e.description.toLowerCase().includes(focusText.toLowerCase()) ||
            e.date_label.toLowerCase().includes(focusText.toLowerCase()),
        );

        if (targetEvent && targetEvent.id) {
          const el = document.getElementById(
            `timeline-event-${targetEvent.id}`,
          );
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add(
              "ring-2",
              "ring-indigo-500",
              "ring-offset-2",
              "ring-offset-zinc-950",
            );
            setTimeout(() => {
              el.classList.remove(
                "ring-2",
                "ring-indigo-500",
                "ring-offset-2",
                "ring-offset-zinc-950",
              );
            }, 2000);
          }
        }
        if (clearFocusText) {
          clearFocusText();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [focusText, viewMode, timelineEvents, clearFocusText]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          {currentParentId !== null && (
            <button
              onClick={handleGoUp}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Go up one level"
            >
              <CornerLeftUp className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-xl font-semibold text-zinc-100">
            {currentParent ? currentParent.title : "Planning Board"}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {documents.length > 0 && onGenerateStructure && (
            <div className="relative group">
              <button className="px-3 py-1.5 rounded-md text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Templates
              </button>
              <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg overflow-hidden hidden group-hover:block z-50">
                {Object.keys(STORY_TEMPLATES).map((templateKey) => (
                  <button
                    key={templateKey}
                    onClick={() => {
                      onGenerateStructure(templateKey);
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    {templateKey}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <Kanban className="w-4 h-4" /> Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "corkboard" ? (
          documents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <LayoutGrid className="w-16 h-16 opacity-30 mb-4" />
              <p className="mb-6">
                {currentParentId !== null
                  ? "This folder is empty. Add a document or sub-folder."
                  : "No documents found in the binder. Create a chapter first."}
              </p>
              {onGenerateStructure && currentParentId === null && (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    Or Generate a Structure
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                    {Object.keys(STORY_TEMPLATES).map((templateKey) => (
                      <button
                        key={templateKey}
                        onClick={() => onGenerateStructure(templateKey)}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-lg text-sm text-zinc-300 transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        {templateKey}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onDoubleClick={() => handleDoubleClick(doc)}
                  className="bg-[#2a2a2a] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-xl p-4 shadow-xl flex flex-col min-h-[240px] relative overflow-hidden group cursor-pointer hover:border-indigo-500/50 transition-colors"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors" />

                  <div className="flex items-center gap-2 mb-3">
                    {doc.type === "folder" ? (
                      <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-zinc-500 shrink-0" />
                    )}
                    <input
                      value={doc.title}
                      onChange={(e) =>
                        onUpdateChapter({ ...doc, title: e.target.value })
                      }
                      className="text-lg font-bold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 placeholder-zinc-600 w-full"
                      placeholder={
                        doc.type === "folder" ? "Folder Title" : "Scene Title"
                      }
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <textarea
                    value={doc.synopsis || ""}
                    onChange={(e) =>
                      onUpdateChapter({ ...doc, synopsis: e.target.value })
                    }
                    placeholder={
                      doc.type === "folder"
                        ? "Write a synopsis for this act/folder..."
                        : "Write a synopsis or goal for this scene..."
                    }
                    className="flex-1 bg-transparent text-sm text-zinc-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 leading-relaxed"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />

                  {doc.type === "folder" && (
                    <div className="absolute bottom-2 right-3 text-[10px] text-zinc-500 uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Double-click to open
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : viewMode === "timeline" ? (
          <div className="max-w-4xl mx-auto py-4">
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  const newOrder =
                    timelineEvents.length > 0
                      ? Math.max(...timelineEvents.map((e) => e.sort_order)) + 1
                      : 0;
                  onSaveTimelineEvent({
                    project_id: currentProjectId,
                    title: "",
                    date_label: "",
                    description: "",
                    sort_order: newOrder,
                  });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <ListIcon className="w-12 h-12 mx-auto opacity-30 mb-4" />
                <p>No events in timeline. Add one to start plotting history.</p>
              </div>
            ) : (
              timelineEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className="flex gap-6 relative group"
                >
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 z-10 shrink-0 mt-6" />
                    {index < timelineEvents.length - 1 && (
                      <div className="w-px h-full bg-zinc-800 -my-2" />
                    )}
                  </div>
                  {/* Timeline Card */}
                  <div
                    id={`timeline-event-${event.id}`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg mb-8 hover:border-indigo-500/50 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <input
                          value={event.date_label}
                          onChange={(e) =>
                            onSaveTimelineEvent({
                              ...event,
                              date_label: e.target.value,
                            })
                          }
                          className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 mb-1 w-full"
                          placeholder="Date / Era (e.g. Year 1042)"
                        />
                        <input
                          value={event.title}
                          onChange={(e) =>
                            onSaveTimelineEvent({
                              ...event,
                              title: e.target.value,
                            })
                          }
                          className="text-lg font-semibold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1 w-full"
                          placeholder="Event Title"
                        />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (index > 0) {
                              const prevEvent = timelineEvents[index - 1];
                              onSaveTimelineEvent({
                                ...event,
                                sort_order: prevEvent.sort_order,
                              });
                              onSaveTimelineEvent({
                                ...prevEvent,
                                sort_order: event.sort_order,
                              });
                            }
                          }}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                          disabled={index === 0}
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (index < timelineEvents.length - 1) {
                              const nextEvent = timelineEvents[index + 1];
                              onSaveTimelineEvent({
                                ...event,
                                sort_order: nextEvent.sort_order,
                              });
                              onSaveTimelineEvent({
                                ...nextEvent,
                                sort_order: event.sort_order,
                              });
                            }
                          }}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                          disabled={index === timelineEvents.length - 1}
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            event.id && onDeleteTimelineEvent(event.id)
                          }
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={event.description}
                      onChange={(e) =>
                        onSaveTimelineEvent({
                          ...event,
                          description: e.target.value,
                        })
                      }
                      placeholder="What happened?"
                      className="w-full h-20 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors mb-3"
                    />

                    <div className="flex items-center gap-2">
                      <select
                        value={event.linked_chapter_id || ""}
                        onChange={(e) => {
                          const val = e.target.value
                            ? parseInt(e.target.value)
                            : null;
                          onSaveTimelineEvent({
                            ...event,
                            linked_chapter_id: val,
                          });
                        }}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500/50 max-w-[250px] truncate"
                      >
                        <option value="">Link to Chapter...</option>
                        {chapters
                          .filter((c) => c.type === "document")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                      </select>
                      {event.linked_chapter_id && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 flex items-center gap-1 truncate max-w-[200px]">
                          📖 Occurs in:{" "}
                          {chapters.find(
                            (c) => c.id === event.linked_chapter_id,
                          )?.title || "Unknown"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : viewMode === "kanban" ? (
          <div className="flex flex-col h-full w-full overflow-x-auto pb-4">
            {allDocuments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <Kanban className="w-16 h-16 opacity-30 mb-4" />
                <p>
                  No documents found in the project. Create a chapter first.
                </p>
              </div>
            ) : (
              <>
                {/* Progress Bar Header */}
                <div className="mb-6 sticky left-0 w-full max-w-4xl shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                      <span className="text-zinc-300">
                        {Math.round(
                          (allDocuments.filter(
                            (d) =>
                              d.status ===
                              KANBAN_COLUMNS[KANBAN_COLUMNS.length - 1],
                          ).length /
                            allDocuments.length) *
                            100,
                        )}
                        % {KANBAN_COLUMNS[KANBAN_COLUMNS.length - 1]}
                      </span>
                    </div>
                    {editingColumns ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={tempColumns}
                          onChange={(e) => setTempColumns(e.target.value)}
                          className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500 w-64"
                          placeholder="Comma-separated columns..."
                        />
                        <button
                          onClick={() => {
                            const newCols = tempColumns
                              .split(",")
                              .map((c) => c.trim())
                              .filter(Boolean);
                            if (newCols.length > 0) {
                              onUpdateKanbanColumns(newCols);
                            }
                            setEditingColumns(false);
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingColumns(false)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempColumns(KANBAN_COLUMNS.join(", "));
                          setEditingColumns(true);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Edit Columns
                      </button>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    {KANBAN_COLUMNS.map((col, idx) => {
                      const count = allDocuments.filter(
                        (d) =>
                          d.status === col ||
                          (col === KANBAN_COLUMNS[0] && !d.status),
                      ).length;
                      const percent = (count / allDocuments.length) * 100;
                      const colors = [
                        "bg-zinc-600",
                        "bg-blue-500",
                        "bg-amber-500",
                        "bg-purple-500",
                        "bg-emerald-500",
                        "bg-rose-500",
                        "bg-cyan-500",
                        "bg-fuchsia-500",
                      ];
                      const color = colors[idx % colors.length];
                      return (
                        <div
                          key={col}
                          style={{ width: `${percent}%` }}
                          className={`${color} h-full transition-all duration-500`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-6 min-w-max h-full">
                  {KANBAN_COLUMNS.map((col, colIdx) => {
                    const columnDocs = allDocuments.filter(
                      (d) =>
                        d.status === col ||
                        (col === KANBAN_COLUMNS[0] && !d.status),
                    );
                    const colors = [
                      "border-zinc-700 text-zinc-400",
                      "border-blue-500/50 text-blue-400",
                      "border-amber-500/50 text-amber-400",
                      "border-purple-500/50 text-purple-400",
                      "border-emerald-500/50 text-emerald-400",
                      "border-rose-500/50 text-rose-400",
                      "border-cyan-500/50 text-cyan-400",
                      "border-fuchsia-500/50 text-fuchsia-400",
                    ];
                    const color = colors[colIdx % colors.length];

                    return (
                      <div
                        key={col}
                        className={`w-80 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col h-full overflow-hidden ${
                          draggedChapterId
                            ? "border-dashed border-zinc-600"
                            : ""
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col)}
                      >
                        <div
                          className={`px-4 py-3 border-b border-zinc-800/80 font-semibold text-sm flex items-center justify-between ${color}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-current" />
                            {col}
                          </div>
                          <span className="bg-zinc-950 px-2 py-0.5 rounded-full text-xs border border-zinc-800">
                            {columnDocs.length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                          {columnDocs.map((doc) => (
                            <div
                              key={doc.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, doc.id!)}
                              onDragEnd={() => setDraggedChapterId(null)}
                              className={`bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing group ${draggedChapterId === doc.id ? "opacity-50" : ""}`}
                            >
                              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Folder className="w-3 h-3" />
                                {getBreadcrumb(doc)}
                              </div>
                              <h4 className="text-sm font-medium text-zinc-200 mb-1 leading-snug">
                                {doc.title}
                              </h4>
                              {doc.synopsis && (
                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                  {doc.synopsis}
                                </p>
                              )}

                              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <select
                                  value={doc.status || KANBAN_COLUMNS[0]}
                                  onChange={(e) =>
                                    onUpdateChapter({
                                      ...doc,
                                      status: e.target.value,
                                    })
                                  }
                                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500/50"
                                >
                                  {KANBAN_COLUMNS.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
