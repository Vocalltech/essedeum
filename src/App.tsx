import { useEffect, useState } from "react";
import {
  Book,
  Plus,
  FolderOpen,
  History,
  List,
  Sparkles,
  Map,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Maximize,
  Minimize,
  X,
  Type,
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Editor } from "./components/Editor";
import { WikiPanel } from "./components/WikiPanel";
import { AIChatPanel } from "./components/AIChatPanel";
import { ProjectSelector } from "./components/ProjectSelector";
import { MapPanel } from "./components/MapPanel";
import { CommandPalette } from "./components/CommandPalette";
import { ActivityBar, AppMode } from "./components/layout/ActivityBar";
import { StatusBar } from "./components/layout/StatusBar";
import { PlanWorkspace } from "./components/workspaces/PlanWorkspace";
import { ExportWorkspace } from "./components/workspaces/ExportWorkspace";
import { WorldWorkspace } from "./components/workspaces/WorldWorkspace";
import { BinderTree } from "./components/workspaces/BinderTree";
import { SnapshotPanel } from "./components/workspaces/SnapshotPanel";
import { LoreReferencePanel } from "./components/workspaces/LoreReferencePanel";
import { LORE_TEMPLATES } from "./lib/templates";
import {
  initDB,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getChapters,
  saveChapter,
  deleteChapter,
  getLore,
  saveLore,
  updateLoreImage,
  getRelationships,
  addRelationship,
  deleteRelationship,
  Project,
  Chapter,
  Lore,
  RelationshipWithDetails,
} from "./lib/db";

const API_KEY_STORAGE_KEY = "essedeum_gemini_api_key";

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loreEntries, setLoreEntries] = useState<Lore[]>([]);
  const [selectedLore, setSelectedLore] = useState<Lore | null>(null);
  const [openTabs, setOpenTabs] = useState<
    Array<{ type: "chapter" | "lore"; id: number }>
  >([]);
  const [relationships, setRelationships] = useState<RelationshipWithDetails[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState<
    "wiki" | "graph" | "ai" | "map" | "snapshots"
  >("wiki");
  const [mapImageData, setMapImageData] = useState<string | undefined>(
    undefined,
  );

  // App Mode state
  const [activeMode, setActiveMode] = useState<AppMode>("write");

  // Layout state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [zenMode, setZenMode] = useState(false);

  // Typography state
  const [editorFont, setEditorFont] = useState<string>("font-sans");
  const [editorFontSize, setEditorFontSize] = useState<string>("text-base");
  const [editorWidth, setEditorWidth] = useState<string>("max-w-3xl");
  const [showTypographySettings, setShowTypographySettings] = useState(false);

  // Close a tab
  // Sync selected chapter/lore with open tabs
  useEffect(() => {
    if (selectedChapter?.id) {
      setOpenTabs((prev) => {
        if (
          !prev.find((t) => t.type === "chapter" && t.id === selectedChapter.id)
        ) {
          return [...prev, { type: "chapter", id: selectedChapter.id! }];
        }
        return prev;
      });
    }
  }, [selectedChapter?.id]);

  useEffect(() => {
    if (selectedLore?.id) {
      setOpenTabs((prev) => {
        if (!prev.find((t) => t.type === "lore" && t.id === selectedLore.id)) {
          return [...prev, { type: "lore", id: selectedLore.id! }];
        }
        return prev;
      });
    }
  }, [selectedLore?.id]);

  const closeTab = (
    e: React.MouseEvent,
    type: "chapter" | "lore",
    id: number,
  ) => {
    e.stopPropagation();
    setOpenTabs((prev) => {
      const newTabs = prev.filter((t) => !(t.type === type && t.id === id));

      const isActive =
        (type === "chapter" && selectedChapter?.id === id) ||
        (type === "lore" && selectedLore?.id === id);

      if (isActive) {
        if (newTabs.length > 0) {
          const nextTab = newTabs[newTabs.length - 1];
          if (nextTab.type === "chapter") {
            const ch = chapters.find((c) => c.id === nextTab.id);
            if (ch) {
              setSelectedChapter(ch);
              setSelectedLore(null);
            }
          } else {
            const lore = loreEntries.find((l) => l.id === nextTab.id);
            if (lore) {
              setSelectedLore(lore);
              setSelectedChapter(null);
            }
          }
        } else {
          setSelectedChapter(null);
          setSelectedLore(null);
        }
      }
      return newTabs;
    });
  };

  // Handle API key change
  // Get API key from localStorage
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }

    // Listen for storage changes (when API key is set in AIChatPanel)
    const handleStorageChange = () => {
      const key = localStorage.getItem(API_KEY_STORAGE_KEY);
      setApiKey(key || "");
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for changes in the same tab
    const interval = setInterval(() => {
      const key = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (key !== apiKey) {
        setApiKey(key || "");
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [apiKey]);

  // Initialize database and load projects
  useEffect(() => {
    async function initialize() {
      try {
        console.log("Initializing database...");
        await initDB();
        console.log("Database initialized, loading projects...");
        await loadProjects();
        console.log("Projects loaded");
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  // Load project data when current project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadProjectData(currentProject.id);
      setShowProjectSelector(false);
    } else {
      setChapters([]);
      setLoreEntries([]);
      setRelationships([]);
      setSelectedChapter(null);
      setSelectedLore(null);
      setOpenTabs([]);
    }
  }, [currentProject?.id]);

  // Load all projects
  const loadProjects = async () => {
    try {
      const loadedProjects = await getProjects();
      console.log("Loaded projects:", loadedProjects);
      setProjects(loadedProjects);

      // Auto-select first project if none selected
      if (loadedProjects.length > 0) {
        setCurrentProject(loadedProjects[0]);
      } else {
        // No projects, show the selector
        setShowProjectSelector(true);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  // Load chapters, lore, and relationships for a project
  const loadProjectData = async (projectId: number) => {
    try {
      const [loadedChapters, loadedLore, loadedRelationships] =
        await Promise.all([
          getChapters(projectId),
          getLore(projectId),
          getRelationships(projectId),
        ]);

      setChapters(loadedChapters);
      setLoreEntries(loadedLore);
      setRelationships(loadedRelationships);
      setSelectedChapter(null);
      setSelectedLore(null);
      setOpenTabs([]);
    } catch (error) {
      console.error("Failed to load project data:", error);
    }
  };

  // Create a new project
  const handleCreateProject = async (name: string, description: string) => {
    try {
      console.log("Creating project:", name, description);
      const id = await createProject(name, description);
      console.log("Project created with ID:", id);

      const newProject: Project = {
        id,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Setting new project:", newProject);
      setProjects((prev) => [newProject, ...prev]);
      setCurrentProject(newProject);
      setShowProjectSelector(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  // Update project
  const handleUpdateProject = async (project: Project) => {
    if (!project.id) return;
    try {
      await updateProject(project.id, project.name, project.description);
      setProjects(projects.map((p) => (p.id === project.id ? project : p)));

      if (currentProject?.id === project.id) {
        setCurrentProject(project);
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  // Delete a project
  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProject(projectId);

      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      if (currentProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          setCurrentProject(updatedProjects[0]);
        } else {
          setCurrentProject(null);
          setShowProjectSelector(true);
        }
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  // Update a chapter
  const handleUpdateChapter = async (updatedChapter: Chapter) => {
    try {
      await saveChapter(updatedChapter);
      setChapters((prev) =>
        prev.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)),
      );
      if (selectedChapter?.id === updatedChapter.id) {
        setSelectedChapter(updatedChapter);
      }
    } catch (error) {
      console.error("Failed to update chapter:", error);
    }
  };

  // Add a new chapter or folder
  const handleAddChapter = async (
    parentIdOrEvent?: number | null | any,
    typeOrEvent?: "folder" | "document" | any,
  ) => {
    if (!currentProject?.id) return;

    try {
      const parentId =
        typeof parentIdOrEvent === "number" ? parentIdOrEvent : null;
      const type = typeof typeOrEvent === "string" ? typeOrEvent : "document";

      const siblings = chapters.filter((c) => c.parent_id === parentId);

      const newChapter: Chapter = {
        project_id: currentProject.id,
        title:
          type === "folder" ? "New Folder" : `Chapter ${chapters.length + 1}`,
        content: "",
        sort_order: siblings.length,
        parent_id: parentId,
        type: type as "folder" | "document",
      };

      const id = await saveChapter(newChapter);
      const savedChapter = { ...newChapter, id };

      setChapters([...chapters, savedChapter]);
      setSelectedChapter(savedChapter);
      setSelectedLore(null);
    } catch (error) {
      console.error("Failed to add chapter:", error);
    }
  };

  // Delete a chapter
  const handleDeleteChapter = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.id || !currentProject?.id) return;

    try {
      await deleteChapter(chapter.id);
      const updatedChapters = chapters.filter((c) => c.id !== chapter.id);
      setChapters(updatedChapters);

      setOpenTabs((prev) =>
        prev.filter((t) => !(t.type === "chapter" && t.id === chapter.id)),
      );

      // Select another chapter if the deleted one was selected
      if (selectedChapter?.id === chapter.id) {
        setSelectedChapter(updatedChapters[0] || null);
      }
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  // Update chapter content
  const handleContentChange = async (content: string) => {
    if (!selectedChapter) return;

    const updatedChapter = { ...selectedChapter, content };
    setSelectedChapter(updatedChapter);

    try {
      await saveChapter(updatedChapter);

      // Update in chapters list
      setChapters(
        chapters.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)),
      );
    } catch (error) {
      console.error("Failed to save chapter:", error);
    }
  };

  // Update chapter title
  const handleTitleChange = async (chapter: Chapter, newTitle: string) => {
    if (!chapter.id) return;

    const updatedChapter = { ...chapter, title: newTitle };

    try {
      await saveChapter(updatedChapter);

      setChapters(
        chapters.map((c) => (c.id === chapter.id ? updatedChapter : c)),
      );

      if (selectedChapter?.id === chapter.id) {
        setSelectedChapter(updatedChapter);
      }
    } catch (error) {
      console.error("Failed to update chapter title:", error);
    }
  };

  // Add a new lore entry
  const handleAddLore = async (title: string, type: string) => {
    if (!currentProject?.id) return;

    try {
      const newLore: Lore = {
        project_id: currentProject.id,
        title,
        type,
        content: LORE_TEMPLATES[type] || "",
      };

      const id = await saveLore(newLore);
      const savedLore = { ...newLore, id };

      setLoreEntries([...loreEntries, savedLore]);
    } catch (error) {
      console.error("Failed to add lore:", error);
    }
  };

  // Add a new relationship
  const handleAddRelationship = async (
    sourceId: number,
    targetId: number,
    label: string,
  ) => {
    if (!currentProject?.id) return;

    try {
      const id = await addRelationship(
        currentProject.id,
        sourceId,
        targetId,
        label,
      );

      // Find the source and target lore to get their details
      const sourceLore = loreEntries.find((l) => l.id === sourceId);
      const targetLore = loreEntries.find((l) => l.id === targetId);

      const newRelationship: RelationshipWithDetails = {
        id,
        project_id: currentProject.id,
        source_id: sourceId,
        target_id: targetId,
        label,
        source_title: sourceLore?.title,
        source_type: sourceLore?.type,
        target_title: targetLore?.title,
        target_type: targetLore?.type,
      };

      setRelationships([...relationships, newRelationship]);
    } catch (error) {
      console.error("Failed to add relationship:", error);
    }
  };

  // Delete a relationship
  const handleDeleteRelationship = async (relationshipId: number) => {
    if (!currentProject?.id) return;

    try {
      await deleteRelationship(relationshipId);
      setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));
    } catch (error) {
      console.error("Failed to delete relationship:", error);
    }
  };

  // Update lore image
  const handleUpdateLoreImage = async (loreId: number, imageData: string) => {
    if (!currentProject?.id) return;

    try {
      await updateLoreImage(loreId, imageData);

      // Update local state
      setLoreEntries(
        loreEntries.map((l) =>
          l.id === loreId ? { ...l, image_data: imageData } : l,
        ),
      );

      // Update selected lore if it's the one being updated
      if (selectedLore?.id === loreId) {
        setSelectedLore({ ...selectedLore, image_data: imageData });
      }
    } catch (error) {
      console.error("Failed to update lore image:", error);
    }
  };

  // Handle map upload
  const handleMapUpload = async (imageData: string) => {
    setMapImageData(imageData);
    // TODO: Persist map to database when we add project-level map storage
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading...</div>
      </div>
    );
  }

  // Show project selector modal when no project or explicitly opened
  const shouldShowProjectModal = showProjectSelector || !currentProject;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 flex relative">
      {/* Activity Bar (Far Left) */}
      {!zenMode && currentProject && (
        <ActivityBar
          activeMode={activeMode}
          onModeSelect={setActiveMode}
          onSettingsClick={() =>
            setShowTypographySettings(!showTypographySettings)
          }
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          setOpen={setCommandPaletteOpen}
          chapters={chapters}
          loreEntries={loreEntries}
          projects={projects}
          onSelectChapter={(chapter) => {
            setSelectedChapter(chapter);
          }}
          onSelectLore={(lore) => {
            setSelectedLore(lore);
            setSelectedChapter(null);
            setActiveMode("world");
          }}
          onSelectProject={(project) => {
            setCurrentProject(project);
            setShowProjectSelector(false);
          }}
          onCreateChapter={handleAddChapter}
          onCreateLore={() => setRightSidebarTab("wiki")}
          onOpenProjectSelector={() => setShowProjectSelector(true)}
          onNavigateTab={(tab) => setRightSidebarTab(tab)}
        />

        {/* Project Selector Modal */}
        {shouldShowProjectModal && (
          <ProjectSelector
            projects={projects}
            currentProject={currentProject}
            onSelectProject={(project) => {
              setCurrentProject(project);
              setShowProjectSelector(false);
            }}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onClose={() => currentProject && setShowProjectSelector(false)}
          />
        )}

        {/* Main Content - only show when we have a project */}
        {currentProject && activeMode === "plan" && (
          <PlanWorkspace
            chapters={chapters}
            onUpdateChapter={handleUpdateChapter}
          />
        )}
        {currentProject && activeMode === "export" && (
          <ExportWorkspace project={currentProject} chapters={chapters} />
        )}
        {currentProject && activeMode === "world" && (
          <WorldWorkspace
            loreEntries={loreEntries}
            selectedLore={selectedLore}
            onSelectLore={(lore) => {
              setSelectedLore(lore);
              setSelectedChapter(null);
            }}
            onAddLore={handleAddLore}
            onUpdateLoreImage={handleUpdateLoreImage}
            relationships={relationships}
            onAddRelationship={handleAddRelationship}
            onDeleteRelationship={handleDeleteRelationship}
            chapters={chapters}
            projectId={String(currentProject.id)}
            mapImageData={mapImageData}
            onMapUpload={handleMapUpload}
            zenMode={zenMode}
            leftSidebarOpen={leftSidebarOpen}
            rightSidebarOpen={rightSidebarOpen}
            onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
            onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
            apiKey={apiKey}
          />
        )}
        {currentProject && activeMode === "write" && (
          <PanelGroup
            direction="horizontal"
            className="flex-1 flex overflow-hidden"
          >
            {/* Left Sidebar - Chapters */}
            {!zenMode && leftSidebarOpen && (
              <>
                <Panel
                  id="left-sidebar"
                  order={1}
                  defaultSize={20}
                  minSize={15}
                  maxSize={40}
                  className="bg-zinc-900 border-r border-zinc-800 flex flex-col"
                >
                  {/* Project Header */}
                  <button
                    onClick={() => setShowProjectSelector(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors border-b border-zinc-700 w-full text-left"
                  >
                    <FolderOpen className="w-5 h-5 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-100 truncate">
                        {currentProject.name}
                      </div>
                      {currentProject.description && (
                        <div className="text-xs text-zinc-500 truncate">
                          {currentProject.description}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">▼</div>
                  </button>

                  {/* Binder Header */}
                  <div className="px-4 py-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="w-5 h-5 text-zinc-400" />
                        <h2 className="text-lg font-semibold">Binder</h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAddChapter(null, "folder")}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Add folder"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-folder-plus"
                          >
                            <path d="M12 10v6" />
                            <path d="M9 13h6" />
                            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddChapter(null, "document")}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                          title="Add document"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Binder Tree */}
                  <div className="flex-1 overflow-y-auto py-2">
                    <BinderTree
                      chapters={chapters}
                      selectedChapterId={selectedChapter?.id}
                      editingChapterId={editingChapterId}
                      onSelect={(c) => {
                        setSelectedChapter(c);
                      }}
                      onDoubleClick={(id) => setEditingChapterId(id)}
                      onTitleChange={handleTitleChange}
                      onTitleBlur={() => setEditingChapterId(null)}
                      onTitleKeyDown={(e) => {
                        if (e.key === "Enter") setEditingChapterId(null);
                      }}
                      onDelete={handleDeleteChapter}
                      onAddChild={(parentId, type) =>
                        handleAddChapter(parentId, type)
                      }
                    />
                  </div>
                </Panel>
                <PanelResizeHandle className="relative w-2 shrink-0 flex items-center justify-center bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800/50 transition-colors cursor-col-resize group outline-none">
                  <div className="w-0.5 h-8 bg-zinc-700 rounded-full group-hover:bg-zinc-400 group-active:bg-zinc-300 transition-colors" />
                </PanelResizeHandle>
              </>
            )}

            {/* Center - Editor */}
            <Panel id="center-editor" order={2} className="flex flex-col">
              {/* Editor Header Controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-2">
                  {!zenMode && (
                    <button
                      onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      title={
                        leftSidebarOpen
                          ? "Close Left Sidebar"
                          : "Open Left Sidebar"
                      }
                    >
                      {leftSidebarOpen ? (
                        <PanelLeftClose className="w-4 h-4" />
                      ) : (
                        <PanelLeft className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowTypographySettings(!showTypographySettings)
                      }
                      className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${showTypographySettings ? "bg-zinc-800 text-zinc-100" : ""}`}
                      title="Typography Settings"
                    >
                      <Type className="w-4 h-4" />
                    </button>
                    {showTypographySettings && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-4 z-50">
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-2">
                              Font Style
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => setEditorFont("font-sans")}
                                className={`text-sm py-1.5 rounded border ${editorFont === "font-sans" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Sans
                              </button>
                              <button
                                onClick={() => setEditorFont("font-serif")}
                                className={`text-sm py-1.5 rounded border font-serif ${editorFont === "font-serif" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Serif
                              </button>
                              <button
                                onClick={() => setEditorFont("font-mono")}
                                className={`text-sm py-1.5 rounded border font-mono ${editorFont === "font-mono" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Mono
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-2">
                              Font Size
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditorFontSize("text-sm")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorFontSize === "text-sm" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Small
                              </button>
                              <button
                                onClick={() => setEditorFontSize("text-base")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorFontSize === "text-base" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Base
                              </button>
                              <button
                                onClick={() => setEditorFontSize("text-lg")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorFontSize === "text-lg" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Large
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-zinc-400 block mb-2">
                              Editor Width
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditorWidth("max-w-2xl")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorWidth === "max-w-2xl" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Narrow
                              </button>
                              <button
                                onClick={() => setEditorWidth("max-w-3xl")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorWidth === "max-w-3xl" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Normal
                              </button>
                              <button
                                onClick={() => setEditorWidth("max-w-5xl")}
                                className={`flex-1 py-1.5 text-sm rounded border ${editorWidth === "max-w-5xl" ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" : "border-zinc-700 hover:bg-zinc-800"}`}
                              >
                                Wide
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setZenMode(!zenMode)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                    title={zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                  >
                    {zenMode ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                  {!zenMode && (
                    <button
                      onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      title={
                        rightSidebarOpen
                          ? "Close Right Sidebar"
                          : "Open Right Sidebar"
                      }
                    >
                      {rightSidebarOpen ? (
                        <PanelRightClose className="w-4 h-4" />
                      ) : (
                        <PanelRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Editor Tabs */}
              {openTabs.filter((t) => t.type === "chapter").length > 0 && (
                <div className="flex bg-zinc-900 border-b border-zinc-800 overflow-x-auto overflow-y-hidden no-scrollbar">
                  {openTabs
                    .filter((t) => t.type === "chapter")
                    .map((tab) => {
                      const isActive = selectedChapter?.id === tab.id;
                      const title =
                        chapters.find((c) => c.id === tab.id)?.title ||
                        "Unknown Chapter";
                      const Icon = Book;

                      return (
                        <button
                          key={`${tab.type}-${tab.id}`}
                          onClick={() => {
                            const ch = chapters.find((c) => c.id === tab.id);
                            if (ch) {
                              setSelectedChapter(ch);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 border-r border-zinc-800 text-sm min-w-32 max-w-48 group transition-colors flex-shrink-0 ${
                            isActive
                              ? "bg-zinc-800 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate flex-1 text-left">
                            {title}
                          </span>
                          <div
                            onClick={(e) => closeTab(e, tab.type, tab.id)}
                            className={`p-0.5 rounded-md hover:bg-zinc-700 transition-colors ml-1 ${
                              isActive
                                ? "opacity-100 text-zinc-400 hover:text-zinc-200"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              <div
                className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden ${zenMode ? `${editorWidth} mx-auto w-full` : ""}`}
              >
                {selectedChapter ? (
                  <div
                    className={`mx-auto w-full flex-1 flex flex-col ${zenMode ? "" : editorWidth} ${editorFont} ${editorFontSize}`}
                  >
                    <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900">
                      <input
                        type="text"
                        value={selectedChapter.title}
                        onChange={(e) =>
                          handleTitleChange(selectedChapter, e.target.value)
                        }
                        className={`font-bold bg-transparent text-zinc-100 focus:outline-none w-full ${editorFontSize === "text-sm" ? "text-xl" : editorFontSize === "text-lg" ? "text-3xl" : "text-2xl"}`}
                        placeholder="Chapter Title"
                      />
                    </div>
                    <div className="flex-1 min-h-0 [&_.ProseMirror]:min-h-full">
                      <Editor
                        content={selectedChapter.content}
                        onChange={handleContentChange}
                        placeholder="Start writing your story... Type @ to mention characters or locations."
                        loreEntries={loreEntries}
                        apiKey={apiKey}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500">
                    <div className="text-center">
                      <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-6">
                        Select a chapter to start writing
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={handleAddChapter}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors border border-zinc-700"
                        >
                          <Plus className="w-4 h-4" />
                          Create Chapter
                        </button>
                      </div>
                      <div className="mt-8 text-sm text-zinc-600">
                        Press{" "}
                        <kbd className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 font-mono text-xs">
                          Cmd/Ctrl + K
                        </kbd>{" "}
                        to open command palette
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            {/* Right Sidebar - Wiki/Graph/AI/Map */}
            {!zenMode && rightSidebarOpen && (
              <>
                <PanelResizeHandle className="relative w-2 shrink-0 flex items-center justify-center bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800/50 transition-colors cursor-col-resize group outline-none">
                  <div className="w-0.5 h-8 bg-zinc-700 rounded-full group-hover:bg-zinc-400 group-active:bg-zinc-300 transition-colors" />
                </PanelResizeHandle>
                <Panel
                  id="right-sidebar"
                  order={3}
                  defaultSize={30}
                  minSize={20}
                  maxSize={50}
                  className="bg-zinc-900 border-l border-zinc-800 flex flex-col"
                >
                  {/* Tab Switcher */}
                  <div className="px-2 py-2 border-b border-zinc-800">
                    <div className="flex bg-zinc-800 rounded-lg p-1">
                      <button
                        onClick={() => setRightSidebarTab("wiki")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          rightSidebarTab === "wiki"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-zinc-300"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        Wiki
                      </button>

                      <button
                        onClick={() => setRightSidebarTab("map")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          rightSidebarTab === "map"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-zinc-300"
                        }`}
                      >
                        <Map className="w-3.5 h-3.5" />
                        Map
                      </button>
                      <button
                        onClick={() => setRightSidebarTab("ai")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          rightSidebarTab === "ai"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-zinc-300"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI
                      </button>
                      <button
                        onClick={() => setRightSidebarTab("snapshots")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          rightSidebarTab === "snapshots"
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-400 hover:text-zinc-300"
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        Snapshots
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {rightSidebarTab === "wiki" &&
                      (selectedLore ? (
                        <LoreReferencePanel
                          lore={selectedLore}
                          relationships={relationships}
                          onClose={() => setSelectedLore(null)}
                          onLoreClick={(loreId) => {
                            const lore = loreEntries.find(
                              (l) => l.id === loreId,
                            );
                            if (lore) setSelectedLore(lore);
                          }}
                        />
                      ) : (
                        <WikiPanel
                          loreEntries={loreEntries}
                          chapters={chapters}
                          relationships={relationships}
                          onAddLore={handleAddLore}
                          onSelectLore={(lore) => {
                            setSelectedLore(lore);
                          }}
                          onAddRelationship={handleAddRelationship}
                          onDeleteRelationship={handleDeleteRelationship}
                          onUpdateLoreImage={handleUpdateLoreImage}
                          selectedLoreId={undefined}
                          apiKey={apiKey}
                        />
                      ))}

                    {rightSidebarTab === "map" && currentProject?.id && (
                      <MapPanel
                        projectId={currentProject.id}
                        mapImageData={mapImageData}
                        onMapUpload={handleMapUpload}
                      />
                    )}
                    {rightSidebarTab === "ai" && currentProject?.id && (
                      <AIChatPanel
                        projectId={currentProject.id}
                        currentContent={
                          selectedChapter?.content ||
                          selectedLore?.content ||
                          ""
                        }
                        loreEntries={loreEntries}
                        relationships={relationships}
                      />
                    )}
                    {rightSidebarTab === "snapshots" && selectedChapter?.id && (
                      <SnapshotPanel
                        chapterId={selectedChapter.id}
                        currentContent={selectedChapter.content}
                        onRestore={handleContentChange}
                      />
                    )}
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        )}

        {/* Status Bar (Bottom) */}
        {currentProject && (
          <StatusBar
            projectName={currentProject.name}
            wordCount={
              selectedChapter?.content
                ? selectedChapter.content
                    .replace(/<[^>]*>?/gm, "")
                    .split(/\s+/)
                    .filter((w) => w.length > 0).length
                : 0
            }
            targetWordCount={2000}
            focusMode={zenMode}
            onToggleFocusMode={() => setZenMode(!zenMode)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
