import { useState } from 'react';
import { FolderOpen, Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import { Project } from '../lib/db';

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, description: string) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: number) => void;
  onClose?: () => void;
}

export function ProjectSelector({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onClose,
}: ProjectSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      console.log('ProjectSelector: Creating project', newName.trim());
      onCreateProject(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
      setIsCreating(false);
    }
  };

  const handleUpdate = (project: Project) => {
    if (editName.trim()) {
      onUpdateProject({
        ...project,
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditingId(null);
    }
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id!);
    setEditName(project.name);
    setEditDescription(project.description);
  };

  const canClose = currentProject !== null && onClose;

  return (
    <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">
            {currentProject ? 'Switch Project' : 'Welcome to Essedeum'}
          </h2>
          {canClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreating ? (
            <div className="mb-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">New Project</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    handleCreate();
                  }
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }
                }}
                placeholder="Project name..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 mb-2"
                autoFocus
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 mb-3 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                  className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-4 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-600 transition-colors flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-100"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Project</span>
            </button>
          )}

          {projects.length === 0 && !isCreating ? (
            <div className="text-center py-12 text-zinc-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No projects yet.</p>
              <p className="text-sm">Create your first project to start writing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group p-4 rounded-lg border transition-colors cursor-pointer ${
                    currentProject?.id === project.id
                      ? 'bg-zinc-700 border-zinc-600'
                      : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600'
                  }`}
                  onClick={() => {
                    if (editingId !== project.id) {
                      onSelectProject(project);
                    }
                  }}
                >
                  {editingId === project.id ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 mb-2"
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 mb-2 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(project)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 text-zinc-100 rounded hover:bg-zinc-600 transition-colors text-sm"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-100 mb-1">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-zinc-400 mb-2">{project.description}</div>
                        )}
                        <div className="text-xs text-zinc-500">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(project);
                          }}
                          className="p-2 rounded hover:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${project.name}"? This will delete all chapters and lore.`)) {
                              onDeleteProject(project.id!);
                            }
                          }}
                          className="p-2 rounded hover:bg-zinc-600 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
