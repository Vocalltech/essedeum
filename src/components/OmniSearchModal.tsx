import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";

export interface SearchableItem {
  id: number;
  type: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  subtitle?: string;
}

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SearchableItem[];
  onNavigate: (type: string, id: number, term: string) => void;
}

interface SearchResult {
  id: number;
  type: string;
  title: string;
  snippet: React.ReactNode;
  icon: React.ReactNode;
  score: number;
}

export function OmniSearchModal({
  isOpen,
  onClose,
  items,
  onNavigate,
}: OmniSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Strip HTML and get plain text safely
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Generate highlight snippet
  const generateSnippet = (
    text: string,
    term: string,
  ): React.ReactNode | null => {
    if (!term.trim()) return null;
    const stripped = stripHtml(text);
    const lowerText = stripped.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);

    if (index === -1) return null;

    const start = Math.max(0, index - 40);
    const end = Math.min(stripped.length, index + term.length + 40);
    const rawSnippet = stripped.substring(start, end);

    const regex = new RegExp(`(${term})`, "gi");
    const parts = rawSnippet.split(regex);

    return (
      <span className="text-zinc-400">
        {start > 0 ? "..." : ""}
        {parts.map((part, i) =>
          part.toLowerCase() === lowerTerm ? (
            <mark
              key={i}
              className="bg-indigo-500/40 text-indigo-100 rounded px-0.5 font-medium"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
        {end < stripped.length ? "..." : ""}
      </span>
    );
  };

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const lowerTerm = searchTerm.toLowerCase();
    const found: SearchResult[] = [];

    items.forEach((item) => {
      const titleMatch = item.title.toLowerCase().includes(lowerTerm);
      const contentMatch = item.content.toLowerCase().includes(lowerTerm);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(lowerTerm);

      if (titleMatch || contentMatch || subtitleMatch) {
        let snippet = generateSnippet(item.content, searchTerm);
        if (!snippet && subtitleMatch) {
          snippet = generateSnippet(item.subtitle!, searchTerm);
        }

        found.push({
          id: item.id,
          type: item.type,
          title: item.title,
          snippet: snippet || (
            <span className="text-zinc-500 italic">Matched in title</span>
          ),
          icon: item.icon,
          score: titleMatch ? 3 : subtitleMatch ? 2 : 1,
        });
      }
    });

    return found.sort((a, b) => b.score - a.score).slice(0, 20); // Top 20 results
  }, [searchTerm, items]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      onNavigate(selected.type, selected.id, searchTerm);
      onClose();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm px-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
          <Search className="w-5 h-5 text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search all chapters, lore, and snapshots (Cmd+Shift+F)"
            className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {searchTerm.trim() === "" ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Start typing to search your entire project...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No results found for "{searchTerm}"
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => {
                      onNavigate(result.type, result.id, searchTerm);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 bg-zinc-950 p-1.5 rounded-md border border-zinc-800">
                      {result.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200 truncate">
                          {result.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-1.5 py-0.5 bg-zinc-800 rounded">
                          {result.type}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 break-words leading-relaxed">
                        {result.snippet}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-sans text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-sans text-[10px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-sans text-[10px]">
                Enter
              </kbd>
              Open
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
