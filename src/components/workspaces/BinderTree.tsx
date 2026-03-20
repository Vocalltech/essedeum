import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Trash2,
  Plus,
} from "lucide-react";
import { Chapter } from "../../lib/db";

interface BinderTreeProps {
  chapters: Chapter[];
  selectedChapterId?: number;
  editingChapterId: number | null;
  onSelect: (chapter: Chapter) => void;
  onDoubleClick: (chapterId: number) => void;
  onTitleChange: (chapter: Chapter, newTitle: string) => void;
  onTitleBlur: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: (chapter: Chapter, e: React.MouseEvent) => void;
  onAddChild?: (parentId: number | null, type: "folder" | "document") => void;
}

interface TreeNodeProps extends Omit<BinderTreeProps, "chapters"> {
  chapter: Chapter;
  chapters: Chapter[];
  level: number;
  expandedFolders: Set<number>;
  toggleFolder: (id: number, e: React.MouseEvent) => void;
}

function TreeNode({
  chapter,
  chapters,
  level,
  selectedChapterId,
  editingChapterId,
  expandedFolders,
  toggleFolder,
  onSelect,
  onDoubleClick,
  onTitleChange,
  onTitleBlur,
  onTitleKeyDown,
  onDelete,
  onAddChild,
}: TreeNodeProps) {
  const isFolder = chapter.type === "folder";
  const isExpanded = expandedFolders.has(chapter.id!);
  const isSelected = selectedChapterId === chapter.id;
  const isEditing = editingChapterId === chapter.id;

  // Find children for this node
  const children = useMemo(() => {
    return chapters
      .filter((c) => c.parent_id === chapter.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [chapters, chapter.id]);

  return (
    <div className="select-none">
      <div
        className={`group relative flex items-center py-1.5 pr-2 transition-colors cursor-pointer ${
          isSelected
            ? "bg-indigo-600/20 text-indigo-100"
            : "text-zinc-300 hover:bg-zinc-800/50"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(chapter)}
        onDoubleClick={() => onDoubleClick(chapter.id!)}
      >
        {/* Expand/Collapse Icon */}
        <div
          className="w-4 h-4 flex items-center justify-center shrink-0 mr-1 opacity-70 hover:opacity-100"
          onClick={(e) => {
            if (isFolder) {
              e.stopPropagation();
              toggleFolder(chapter.id!, e);
            }
          }}
        >
          {isFolder ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5 h-3.5" /> // spacer
          )}
        </div>

        {/* Type Icon */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0 mr-2 opacity-80">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
            )
          ) : (
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>

        {/* Title / Input */}
        <div className="flex-1 min-w-0 flex items-center">
          {isEditing ? (
            <input
              type="text"
              value={chapter.title}
              onChange={(e) => onTitleChange(chapter, e.target.value)}
              onBlur={onTitleBlur}
              onKeyDown={onTitleKeyDown}
              className="flex-1 min-w-0 bg-zinc-900 border border-indigo-500 rounded px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none"
              autoFocus
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate">{chapter.title}</span>
          )}
        </div>

        {/* Action Buttons (Hover) */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-2">
            {isFolder && onAddChild && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(chapter.id!, "document");
                  if (!isExpanded) toggleFolder(chapter.id!, e);
                }}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Add document inside"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => onDelete(chapter, e)}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && children.length > 0 && (
        <div className="flex flex-col">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              chapter={child}
              chapters={chapters}
              level={level + 1}
              selectedChapterId={selectedChapterId}
              editingChapterId={editingChapterId}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onTitleChange={onTitleChange}
              onTitleBlur={onTitleBlur}
              onTitleKeyDown={onTitleKeyDown}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BinderTree({
  chapters,
  selectedChapterId,
  editingChapterId,
  onSelect,
  onDoubleClick,
  onTitleChange,
  onTitleBlur,
  onTitleKeyDown,
  onDelete,
  onAddChild,
}: BinderTreeProps) {
  // Keep track of which folders are open
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
    new Set(),
  );

  const toggleFolder = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Find root level items (no parent_id)
  const rootItems = useMemo(() => {
    return chapters
      .filter((c) => !c.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [chapters]);

  if (chapters.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-zinc-500 text-sm">
        Your binder is empty.
      </div>
    );
  }

  return (
    <div className="flex flex-col py-1">
      {rootItems.map((chapter) => (
        <TreeNode
          key={chapter.id}
          chapter={chapter}
          chapters={chapters}
          level={0}
          selectedChapterId={selectedChapterId}
          editingChapterId={editingChapterId}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onTitleChange={onTitleChange}
          onTitleBlur={onTitleBlur}
          onTitleKeyDown={onTitleKeyDown}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  );
}
