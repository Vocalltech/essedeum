import {
  BookOpen,
  Map as MapIcon,
  LayoutDashboard,
  Upload,
  Settings,
} from "lucide-react";

export type AppMode = "write" | "plan" | "world" | "export";

interface ActivityBarProps {
  activeMode: AppMode;
  onModeSelect: (mode: AppMode) => void;
  onSettingsClick: () => void;
}

export function ActivityBar({
  activeMode,
  onModeSelect,
  onSettingsClick,
}: ActivityBarProps) {
  const modes: { id: AppMode; icon: React.ElementType; label: string }[] = [
    { id: "write", icon: BookOpen, label: "Write" },
    { id: "plan", icon: LayoutDashboard, label: "Plan" },
    { id: "world", icon: MapIcon, label: "World" },
    { id: "export", icon: Upload, label: "Export" },
  ];

  return (
    <div className="w-12 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 justify-between z-20">
      <div className="flex flex-col gap-4 w-full items-center">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              title={mode.label}
              className={`p-2.5 rounded-lg transition-colors relative group w-10 flex items-center justify-center ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 w-full items-center">
        <button
          onClick={onSettingsClick}
          title="Settings"
          className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors w-10 flex items-center justify-center"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
