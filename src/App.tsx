import { useEffect, useState } from "react";
import {
  Book,
  Plus,
  Trash2,
  FolderOpen,
  List,
  Sparkles,
  Map,
} from "lucide-react";
import { Editor } from "./components/Editor";
import { WikiPanel } from "./components/WikiPanel";
import { AIChatPanel } from "./components/AIChatPanel";
import { ProjectSelector } from "./components/ProjectSelector";
import { MapPanel } from "./components/MapPanel";
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
  const [relationships, setRelationships] = useState<RelationshipWithDetails[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState<
    "wiki" | "graph" | "ai" | "map"
  >("wiki");
  const [mapImageData, setMapImageData] = useState<string | undefined>(
    undefined,
  );

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

  // Update a project
  const handleUpdateProject = async (project: Project) => {
    try {
      await updateProject(project);

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

  // Add a new chapter
  const handleAddChapter = async () => {
    if (!currentProject?.id) return;

    try {
      const newChapter: Chapter = {
        project_id: currentProject.id,
        title: `Chapter ${chapters.length + 1}`,
        content: "",
        sort_order: chapters.length,
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
      await deleteChapter(chapter.id, currentProject.id);
      const updatedChapters = chapters.filter((c) => c.id !== chapter.id);
      setChapters(updatedChapters);

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
        content: "",
      };

      const id = await saveLore(newLore);
      const savedLore = { ...newLore, id };

      setLoreEntries([...loreEntries, savedLore]);
    } catch (error) {
      console.error("Failed to add lore:", error);
    }
  };

  // Update lore content
  const handleLoreContentChange = async (content: string) => {
    if (!selectedLore) return;

    const updatedLore = { ...selectedLore, content };
    setSelectedLore(updatedLore);

    try {
      await saveLore(updatedLore);

      setLoreEntries(
        loreEntries.map((l) => (l.id === updatedLore.id ? updatedLore : l)),
      );
    } catch (error) {
      console.error("Failed to save lore:", error);
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
      await deleteRelationship(relationshipId, currentProject.id);
      setRelationships(relationships.filter((r) => r.id !== relationshipId));
    } catch (error) {
      console.error("Failed to delete relationship:", error);
    }
  };

  // Update lore image
  const handleUpdateLoreImage = async (loreId: number, imageData: string) => {
    if (!currentProject?.id) return;

    try {
      await updateLoreImage(loreId, currentProject.id, imageData);

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
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col relative">
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
      {currentProject && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Chapters */}
          <div className="w-1/5 bg-zinc-900 border-r border-zinc-800 flex flex-col">
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

            {/* Chapters Header */}
            <div className="px-4 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-zinc-400" />
                  <h2 className="text-lg font-semibold">Chapters</h2>
                </div>
                <button
                  onClick={handleAddChapter}
                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                  title="Add new chapter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto py-2">
              {chapters.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No chapters yet. Click the + button to create one.
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className={`group relative rounded-lg transition-colors ${
                        selectedChapter?.id === chapter.id
                          ? "bg-zinc-700"
                          : "hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center">
                        {editingChapterId === chapter.id ? (
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) =>
                              handleTitleChange(chapter, e.target.value)
                            }
                            onBlur={() => setEditingChapterId(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditingChapterId(null);
                            }}
                            className="flex-1 px-3 py-2.5 bg-transparent text-sm text-zinc-100 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedChapter(chapter);
                              setSelectedLore(null);
                            }}
                            onDoubleClick={() =>
                              setEditingChapterId(chapter.id!)
                            }
                            className="flex-1 text-left px-3 py-2.5 text-sm text-zinc-100"
                          >
                            {chapter.title}
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteChapter(chapter, e)}
                          className="p-1.5 mr-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-600 text-zinc-400 hover:text-red-400 transition-all"
                          title="Delete chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center - Editor */}
          <div className="flex-1 flex flex-col">
            {selectedChapter ? (
              <>
                <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900">
                  <input
                    type="text"
                    value={selectedChapter.title}
                    onChange={(e) =>
                      handleTitleChange(selectedChapter, e.target.value)
                    }
                    className="text-2xl font-bold bg-transparent text-zinc-100 focus:outline-none w-full"
                    placeholder="Chapter Title"
                  />
                </div>
                <Editor
                  content={selectedChapter.content}
                  onChange={handleContentChange}
                  placeholder="Start writing your story... Type @ to mention characters or locations."
                  loreEntries={loreEntries}
                />
              </>
            ) : selectedLore ? (
              <>
                <div className="px-8 py-4 border-b border-zinc-800 bg-zinc-900">
                  <div className="text-2xl font-bold text-zinc-100">
                    {selectedLore.title}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    {selectedLore.type}
                  </div>
                </div>
                <Editor
                  content={selectedLore.content}
                  onChange={handleLoreContentChange}
                  placeholder={`Write about this ${selectedLore.type.toLowerCase()}... Type @ to mention other entries.`}
                  loreEntries={loreEntries}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    Select a chapter or lore entry to start writing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Wiki/Graph/AI/Map */}
          <div className="w-[30%] bg-zinc-900 border-l border-zinc-800 flex flex-col">
            {/* Tab Switcher */}
            <div className="px-2 py-2 border-b border-zinc-800">
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setRightSidebarTab("wiki")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightSidebarTab === "wiki"
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Wiki
                </button>

                <button
                  onClick={() => setRightSidebarTab("map")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightSidebarTab === "map"
                      ? "bg-emerald-600 text-white"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  Map
                </button>
                <button
                  onClick={() => setRightSidebarTab("ai")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightSidebarTab === "ai"
                      ? "bg-amber-600 text-white"
                      : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {rightSidebarTab === "wiki" && (
                <WikiPanel
                  loreEntries={loreEntries}
                  chapters={chapters}
                  relationships={relationships}
                  onAddLore={handleAddLore}
                  onSelectLore={(lore) => {
                    setSelectedLore(lore);
                    setSelectedChapter(null);
                  }}
                  onAddRelationship={handleAddRelationship}
                  onDeleteRelationship={handleDeleteRelationship}
                  onUpdateLoreImage={handleUpdateLoreImage}
                  selectedLoreId={selectedLore?.id}
                  apiKey={apiKey}
                />
              )}

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
                    selectedChapter?.content || selectedLore?.content || ""
                  }
                  loreEntries={loreEntries}
                  relationships={relationships}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
