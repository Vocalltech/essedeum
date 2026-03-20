import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Cloud,
  Maximize,
  Minimize,
  Timer,
  Play,
  Square,
} from "lucide-react";

interface StatusBarProps {
  projectName?: string;
  wordCount?: number;
  targetWordCount?: number;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  syncStatus?: "saved" | "saving" | "error";
}

export function StatusBar({
  projectName = "No Project",
  wordCount = 0,
  targetWordCount = 2000,
  focusMode,
  onToggleFocusMode,
  syncStatus = "saved",
}: StatusBarProps) {
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sprintStartWords, setSprintStartWords] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSprintActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isSprintActive) {
      setIsSprintActive(false);
    }
    return () => clearInterval(interval);
  }, [isSprintActive, timeLeft]);

  const toggleSprint = () => {
    if (isSprintActive) {
      setIsSprintActive(false);
    } else {
      setSprintStartWords(wordCount);
      setTimeLeft(25 * 60);
      setIsSprintActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    targetWordCount > 0
      ? Math.min(Math.round((wordCount / targetWordCount) * 100), 100)
      : 0;

  return (
    <div className="h-7 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-3 text-[11px] font-medium text-zinc-500 z-20">
      {/* Left side: Status and Project Info */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1.5"
          title={`Sync Status: ${syncStatus}`}
        >
          {syncStatus === "saved" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
          {syncStatus === "saving" && (
            <Cloud className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          )}
          {syncStatus === "error" && (
            <Cloud className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className="capitalize">{syncStatus}</span>
        </div>
        <div className="w-px h-3 bg-zinc-800" />
        <span className="truncate max-w-[200px] text-zinc-400">
          {projectName}
        </span>
      </div>

      {/* Right side: Word Count, Sprint, Focus Mode */}
      <div className="flex items-center gap-4">
        {/* Sprint Timer */}
        <div className="flex items-center gap-3">
          {isSprintActive && (
            <span className="text-indigo-400 font-mono tracking-wider">
              +{Math.max(0, wordCount - sprintStartWords)} w
            </span>
          )}
          <button
            onClick={toggleSprint}
            className={`flex items-center gap-1.5 transition-colors ${
              isSprintActive
                ? "text-rose-400 hover:text-rose-300"
                : "hover:text-zinc-300"
            }`}
            title={isSprintActive ? "Stop Sprint" : "Start 25m Sprint"}
          >
            {isSprintActive ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <Timer className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </button>
        </div>

        <div className="w-px h-3 bg-zinc-800" />

        {/* Word Count Progress */}
        <div
          className="flex items-center gap-2"
          title={`${wordCount} / ${targetWordCount} words`}
        >
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="w-24 text-right tabular-nums">
            <span className="text-zinc-300">{wordCount.toLocaleString()}</span>
            <span className="text-zinc-600">
              {" "}
              / {targetWordCount.toLocaleString()} w
            </span>
          </span>
        </div>

        <div className="w-px h-3 bg-zinc-800" />

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          className={`flex items-center gap-1.5 transition-colors ${
            focusMode
              ? "text-indigo-400 hover:text-indigo-300"
              : "hover:text-zinc-300"
          }`}
        >
          {focusMode ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
          <span>Focus</span>
        </button>
      </div>
    </div>
  );
}
