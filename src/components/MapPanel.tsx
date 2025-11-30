import { useState, useRef, useEffect } from 'react';
import { Map, X, Upload, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface MapPanelProps {
  projectId: number;
  mapImageData?: string; // Base64 encoded map image
  onMapUpload: (imageData: string) => void;
}

export function MapPanel({ mapImageData, onMapUpload }: MapPanelProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix to store just the base64 data
      const base64Data = base64.split(',')[1];
      onMapUpload(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    }
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle escape key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-zinc-100">World Map</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Open Generator
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {mapImageData ? (
          <>
            {/* Map Viewer */}
            <div
              ref={mapContainerRef}
              className={`w-full h-full overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <img
                  src={`data:image/png;base64,${mapImageData}`}
                  alt="World Map"
                  className="max-w-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => handleZoom(0.25)}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(-0.25)}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                title="Reset view"
              >
                <Move className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 px-2 py-1 bg-zinc-800/80 border border-zinc-700 rounded text-xs text-zinc-400">
              {Math.round(zoom * 100)}%
            </div>

            {/* Upload new map button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Replace Map
            </button>
          </>
        ) : (
          /* Empty State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Map className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">No Map Yet</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Generate a fantasy map using Azgaar's generator, then upload it here to view and reference while writing.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowGenerator(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Map Generator
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Existing Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Azgaar Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] bg-zinc-900 rounded-xl border border-zinc-700 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-zinc-100">Azgaar's Fantasy Map Generator</h3>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500 mr-4">
                  Generate your map → Download as PNG → Close this modal → Upload the file
                </p>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-zinc-950">
              <iframe
                src="https://azgaar.github.io/Fantasy-Map-Generator/"
                className="w-full h-full border-0"
                title="Azgaar's Fantasy Map Generator"
                allow="fullscreen"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                <span className="text-emerald-400 font-medium">Tip:</span> Use the menu in the generator to export your map as PNG
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Map
                </button>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-zinc-100 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {isFullscreen && mapImageData && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
          {/* Fullscreen Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
            <div className="flex items-center gap-3">
              <Map className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-zinc-100">World Map</h3>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Fullscreen Map */}
          <div
            className={`flex-1 overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <img
                src={`data:image/png;base64,${mapImageData}`}
                alt="World Map"
                className="max-w-none"
                draggable={false}
              />
            </div>
          </div>

          {/* Fullscreen Controls */}
          <div className="absolute bottom-8 right-8 flex gap-2">
            <button
              onClick={() => handleZoom(0.25)}
              className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={resetView}
              className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              title="Reset view"
            >
              <Move className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-8 left-8 px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded text-sm text-zinc-400">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

