import {
  Type,
  Maximize,
  Minimize,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Headphones,
} from "lucide-react";
import { AudioTrack } from "../../lib/audio";
import { useState } from "react";

interface StatusBarProps {
  wordCount?: number;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;

  // Audio Props
  currentTrack?: AudioTrack | null;
  isPlaying?: boolean;
  isLooping?: boolean;
  volume?: number;
  onTogglePlay?: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onToggleLoop?: () => void;
  onVolumeChange?: (vol: number) => void;
  onOpenSoundscape?: () => void;
}

export function StatusBar({
  wordCount = 0,
  isZenMode = false,
  onToggleZenMode,
  currentTrack,
  isPlaying,
  isLooping,
  volume = 0.5,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onToggleLoop,
  onVolumeChange,
  onOpenSoundscape,
}: StatusBarProps) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div className="h-8 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-500 z-30 relative select-none">
      {/* Left Side - Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Word Count">
          <Type className="w-3.5 h-3.5" />
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="w-px h-3 bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-emerald-500/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Saved
        </div>
      </div>

      {/* Right Side - Tools */}
      <div className="flex items-center gap-2 h-full">
        {/* Mini Player */}
        {currentTrack ? (
          <div className="flex items-center gap-2 mr-2 bg-zinc-900/50 rounded-full px-2 py-0.5 border border-zinc-800/50 h-6">
            <button
              onClick={onPrevTrack}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-3 h-3" />
            </button>
            <button
              onClick={onTogglePlay}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" fill="currentColor" />
              ) : (
                <Play
                  className="w-3.5 h-3.5 translate-x-px"
                  fill="currentColor"
                />
              )}
            </button>
            <button
              onClick={onNextTrack}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            <div className="w-px h-3 bg-zinc-700 mx-1" />

            <span
              className="max-w-[120px] truncate text-[10px] font-medium text-zinc-300 cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={onOpenSoundscape}
              title={currentTrack.title}
            >
              {currentTrack.title}
            </span>

            <div className="w-px h-3 bg-zinc-700 mx-1" />

            <button
              onClick={onToggleLoop}
              className={`transition-colors ${isLooping ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"}`}
              title={isLooping ? "Looping Track" : "Loop Track"}
            >
              <Repeat className="w-3 h-3" />
            </button>

            <div
              className="relative flex items-center h-full"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1">
                <Volume2 className="w-3 h-3" />
              </button>

              {/* Volume Slider Dropdown */}
              {showVolume && (
                <div className="absolute bottom-full right-0 mb-2 w-24 bg-zinc-900 border border-zinc-800 rounded-lg p-2 shadow-xl flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) =>
                      onVolumeChange &&
                      onVolumeChange(parseFloat(e.target.value))
                    }
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {!currentTrack && (
          <button
            onClick={onOpenSoundscape}
            className="flex items-center gap-1.5 px-2 hover:text-zinc-300 transition-colors hover:bg-zinc-800/50 rounded h-6"
            title="Soundscapes"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">
              Audio
            </span>
          </button>
        )}

        <div className="w-px h-4 bg-zinc-800 mx-1" />

        <button
          onClick={onToggleZenMode}
          className={`flex items-center gap-1.5 px-2 transition-colors rounded h-6 ${
            isZenMode
              ? "text-indigo-400 bg-indigo-500/10"
              : "hover:text-zinc-300 hover:bg-zinc-800/50"
          }`}
          title={isZenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        >
          {isZenMode ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] uppercase tracking-wider font-semibold">
            Focus
          </span>
        </button>
      </div>
    </div>
  );
}
