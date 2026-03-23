export type AudioType = "youtube" | "stream";

export interface AudioTrack {
  id: string;
  title: string;
  creator: string;
  type: AudioType;
  duration?: number;
  url: string; // The YouTube Video ID or direct stream URL
  tags: string[];
}

export const DEFAULT_SOUNDSCAPES: AudioTrack[] = [
  {
    id: "soma-dronezone",
    title: "Drone Zone (Ambient Space)",
    creator: "SomaFM",
    type: "stream",
    url: "https://ice1.somafm.com/dronezone-128-mp3",
    tags: ["ambient", "space", "drone", "focus", "sci-fi"],
  },
  {
    id: "soma-deepspaceone",
    title: "Deep Space One",
    creator: "SomaFM",
    type: "stream",
    url: "https://ice1.somafm.com/deepspaceone-128-mp3",
    tags: ["space", "ambient", "sci-fi", "calm", "exploration"],
  },
  {
    id: "soma-groovesalad",
    title: "Groove Salad (Chill/Downtempo)",
    creator: "SomaFM",
    type: "stream",
    url: "https://ice1.somafm.com/groovesalad-128-mp3",
    tags: ["chill", "downtempo", "lofi", "beats", "electronic"],
  },
  {
    id: "soma-secretagent",
    title: "Secret Agent (Cinematic/Spy)",
    creator: "SomaFM",
    type: "stream",
    url: "https://ice1.somafm.com/secretagent-128-mp3",
    tags: ["cinematic", "jazz", "spy", "upbeat", "retro"],
  },
  {
    id: "venice-classic",
    title: "Venice Classic Radio",
    creator: "Venice Classic",
    type: "stream",
    url: "http://174.36.206.197:8000/stream",
    tags: ["classical", "orchestral", "piano", "historical", "strings"],
  },
  {
    id: "lofi-girl-yt",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
    creator: "Lofi Girl",
    type: "youtube",
    url: "jfKfPfyJRdk",
    tags: ["lofi", "beats", "chill", "study", "modern"],
  },
  {
    id: "heavy-rain-yt",
    title: "Heavy Rain & Gentle Thunder (10 Hours)",
    creator: "Relaxing White Noise",
    type: "youtube",
    url: "mPZkdNFkNps",
    tags: ["rain", "nature", "storm", "ambient", "weather"],
  },
  {
    id: "coffee-shop-yt",
    title: "Cozy Coffee Shop Ambience",
    creator: "Calmed by Nature",
    type: "youtube",
    url: "bo_efYhYU2A",
    tags: ["cafe", "ambient", "jazz", "rain", "chatter"],
  },
  {
    id: "fantasy-tavern-yt",
    title: "Medieval Tavern Music & Ambience",
    creator: "Michael Ghelfi Studios",
    type: "youtube",
    url: "t4yS8YQJ8mQ",
    tags: ["fantasy", "tavern", "medieval", "ambient", "rpg"],
  },
];

/**
 * Extracts a YouTube Video ID from a given URL or string.
 * Supports various formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - dQw4w9WgXcQ (raw ID)
 */
export function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  // If it's exactly 11 characters and looks alphanumeric, assume it's a raw ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
