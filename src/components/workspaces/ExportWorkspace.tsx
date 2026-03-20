import { useState, useMemo } from "react";
import {
  Download,
  FileText,
  Settings,
  AlignLeft,
  CheckSquare,
  Square,
  FileCode,
} from "lucide-react";
import { Project, Chapter } from "../../lib/db";

interface ExportWorkspaceProps {
  project: Project;
  chapters: Chapter[];
}

type ExportFormat = "txt" | "html" | "md";

export function ExportWorkspace({ project, chapters }: ExportWorkspaceProps) {
  const [format, setFormat] = useState<ExportFormat>("txt");
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(
    new Set(
      chapters
        .filter((c) => c.type === "document" || !c.type)
        .map((c) => c.id!),
    ),
  );

  const documents = useMemo(() => {
    return chapters
      .filter((c) => c.type === "document" || !c.type)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [chapters]);

  const toggleChapter = (id: number) => {
    const next = new Set(selectedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapters(next);
  };

  const compiledText = useMemo(() => {
    let result = "";

    if (includeTitlePage) {
      if (format === "html") {
        result += `<div style="text-align: center; margin-bottom: 4rem;">\n`;
        result += `  <h1>${project.name}</h1>\n`;
        if (project.description) result += `  <p>${project.description}</p>\n`;
        result += `</div>\n\n`;
      } else if (format === "md") {
        result += `# ${project.name}\n\n`;
        if (project.description) result += `${project.description}\n\n`;
        result += `---\n\n`;
      } else {
        result += `${project.name.toUpperCase()}\n\n`;
        if (project.description) result += `${project.description}\n\n`;
        result += `=========================\n\n`;
      }
    }

    const includedDocs = documents.filter((d) => selectedChapters.has(d.id!));

    includedDocs.forEach((doc, index) => {
      // Parse HTML to safely remove Ghost Notes before export
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = doc.content;

      const ghostNotes = tempDiv.querySelectorAll('[data-type="ghost-note"]');
      ghostNotes.forEach((note) => {
        const fragment = document.createDocumentFragment();
        while (note.firstChild) {
          fragment.appendChild(note.firstChild);
        }
        note.parentNode?.replaceChild(fragment, note);
      });

      const cleanHtml = tempDiv.innerHTML;

      if (format === "html") {
        result += `<h2>${doc.title}</h2>\n`;
        result += `${cleanHtml}\n\n`;
        if (index < includedDocs.length - 1)
          result += `<hr style="margin: 2rem 0;" />\n\n`;
      } else if (format === "md") {
        result += `## ${doc.title}\n\n`;
        // Basic html to markdown (simplified)
        const text = cleanHtml
          .replace(/<p>/g, "")
          .replace(/<\/p>/g, "\n\n")
          .replace(/<[^>]*>?/gm, "");
        result += `${text}\n\n`;
        if (index < includedDocs.length - 1) result += `---\n\n`;
      } else {
        result += `${doc.title.toUpperCase()}\n\n`;
        const text = cleanHtml
          .replace(/<p>/g, "")
          .replace(/<\/p>/g, "\n\n")
          .replace(/<[^>]*>?/gm, "");
        result += `${text}\n\n`;
        if (index < includedDocs.length - 1) result += `\n#\n\n`;
      }
    });

    return result;
  }, [project, documents, selectedChapters, format, includeTitlePage]);

  const handleExport = () => {
    const blob = new Blob([compiledText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex bg-zinc-950 overflow-hidden">
      {/* Left Sidebar - Settings */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Compile Settings
          </h2>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
              Format
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setFormat("txt")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  format === "txt"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <AlignLeft className="w-4 h-4" /> Plain Text (.txt)
              </button>
              <button
                onClick={() => setFormat("md")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  format === "md"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <FileText className="w-4 h-4" /> Markdown (.md)
              </button>
              <button
                onClick={() => setFormat("html")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  format === "html"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <FileCode className="w-4 h-4" /> HTML (.html)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">
              Options
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer group">
              <div className="text-indigo-400 group-hover:text-indigo-300">
                {includeTitlePage ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </div>
              <input
                type="checkbox"
                checked={includeTitlePage}
                onChange={(e) => setIncludeTitlePage(e.target.checked)}
                className="hidden"
              />
              Include Title Page
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Document
          </button>
        </div>
      </div>

      {/* Center - Preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-lg font-medium text-zinc-300">Preview</h2>
          <span className="text-xs text-zinc-500 font-mono">
            {compiledText.length.toLocaleString()} characters
          </span>
        </div>
        <div className="flex-1 p-8 overflow-y-auto flex justify-center">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 shadow-xl rounded-xl p-8 md:p-12 min-h-full">
            <pre
              className={`whitespace-pre-wrap text-zinc-300 outline-none ${format === "txt" || format === "md" ? "font-mono text-sm" : "font-serif"}`}
            >
              {compiledText}
            </pre>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Selection */}
      <div className="w-64 border-l border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Contents
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {documents.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              No documents to export.
            </div>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => toggleChapter(doc.id!)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="text-indigo-400 shrink-0 opacity-70 group-hover:opacity-100">
                    {selectedChapters.has(doc.id!) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`truncate ${selectedChapters.has(doc.id!) ? "text-zinc-200" : "text-zinc-500"}`}
                  >
                    {doc.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
