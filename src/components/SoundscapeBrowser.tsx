import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  Play,
  Pause,
  Volume2,
  Plus,
  Link as LinkIcon,
  Youtube,
  Radio,
} from "lucide-react";
import {
  AudioTrack,
  DEFAULT_SOUNDSCAPES,
  extractYouTubeId,
} from "../lib/audio";

interface SoundscapeBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: AudioTrack, playlist: AudioTrack[]) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export function SoundscapeBrowser({
  isOpen,
  onClose,
  onPlayTrack,
  currentTrackId,
  isPlaying,
  onTogglePlay,
}: SoundscapeBrowserProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setCustomUrl("");
      setSearchTerm("");
      setError("");
    }
  }, [isOpen]);

  const handleAddCustom = () => {
    if (!customUrl.trim()) return;

    const videoId = extractYouTubeId(customUrl);
    if (!videoId) {
      setError("Invalid YouTube URL or Video ID");
      return;
    }

    setError("");
    const newTrack: AudioTrack = {
      id: videoId,
      title: "Custom YouTube Audio",
      creator: "Custom Link",
      type: "youtube",
      url: videoId,
      tags: ["custom"],
    };

    onPlayTrack(newTrack, [newTrack, ...DEFAULT_SOUNDSCAPES]);
    setCustomUrl("");
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const filteredTracks = useMemo(() => {
    if (!searchTerm.trim()) return DEFAULT_SOUNDSCAPES;
    const lowerTerm = searchTerm.toLowerCase();
    return DEFAULT_SOUNDSCAPES.filter((track) => {
      return (
        track.title.toLowerCase().includes(lowerTerm) ||
        track.creator.toLowerCase().includes(lowerTerm) ||
        track.tags.some((tag) => tag.toLowerCase().includes(lowerTerm))
      );
    });
  }, [searchTerm]);

  const CATEGORIES = [
    { label: "Lo-Fi", icon: "🎧", tag: "lofi" },
    { label: "Ambient", icon: "🌧️", tag: "ambient" },
    { label: "Classical", icon: "🎻", tag: "classical" },
    { label: "Fantasy", icon: "🏰", tag: "fantasy" },
    { label: "Sci-Fi", icon: "🚀", tag: "sci-fi" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm px-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[80vh]">
        {/* Header / Custom Link Bar */}
        <div className="flex flex-col gap-4 px-4 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              Writer's Sanctuary
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3" />
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Paste any YouTube URL (e.g., a 10-hour rain loop or fantasy soundtrack)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customUrl.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Play Custom
              </button>
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              Note: Monetized YouTube videos may play unskippable audio ads. For
              an uninterrupted experience, use the Radio streams below.
            </p>
          </div>
        </div>

        {/* Browser Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search stations or genres..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.tag}
                    onClick={() => setSearchTerm(cat.tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      searchTerm.toLowerCase() === cat.tag
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 border border-transparent"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredTracks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Volume2 className="w-12 h-12 opacity-20 mb-4" />
                <p>No audio tracks found for "{searchTerm}".</p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm mt-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all stations
                </button>
              </div>
            ) : (
              <div className="px-2 py-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                  <span>
                    {searchTerm
                      ? "Search Results"
                      : "Live Radio & Curated Soundscapes"}
                  </span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </h3>
                <div className="grid grid-cols-1 gap-1">
                  {filteredTracks.map((track, index) => {
                    const isCurrentTrack = currentTrackId === track.id;

                    return (
                      <div
                        key={`${track.id}-${index}`}
                        className={`group flex items-center gap-4 p-3 rounded-lg border transition-all ${
                          isCurrentTrack
                            ? "bg-indigo-500/10 border-indigo-500/30"
                            : "bg-zinc-950/30 border-transparent hover:bg-zinc-800/50 hover:border-zinc-700/50"
                        }`}
                      >
                        {/* Play/Pause Button */}
                        <button
                          onClick={() => {
                            if (isCurrentTrack && onTogglePlay) {
                              onTogglePlay();
                            } else {
                              const playlist = filteredTracks.slice(index);
                              onPlayTrack(track, playlist);
                            }
                          }}
                          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                            isCurrentTrack
                              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-zinc-800 text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white"
                          }`}
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="w-4 h-4" fill="currentColor" />
                          ) : (
                            <Play
                              className="w-4 h-4 translate-x-0.5"
                              fill="currentColor"
                            />
                          )}
                        </button>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-sm font-medium truncate ${
                              isCurrentTrack
                                ? "text-indigo-300"
                                : "text-zinc-200 group-hover:text-white"
                            }`}
                          >
                            {track.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                              {track.creator}
                            </span>
                            <span className="text-zinc-700 text-[10px]">•</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {track.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 shrink-0 justify-end pr-2">
                          {track.type === "stream" ? (
                            <span className="flex items-center gap-1 text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Radio className="w-3.5 h-3.5" />
                              Live
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-500/80 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              <Youtube className="w-3.5 h-3.5" />
                              YT
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold shrink-0">
          <span>Writer's Radio Engine</span>
          <span>{filteredTracks.length} Curated Stations</span>
        </div>
      </div>
    </div>
  );
}
