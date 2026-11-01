import { SongMetadata } from '../types';

export interface YouTubeParsedUrl {
  type: 'video' | 'playlist' | 'video_with_playlist' | 'invalid';
  videoId: string | null;
  playlistId: string | null;
}

/**
 * Robust YouTube URL & Playlist Parser.
 * Supports:
 * - Single Video: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID, music.youtube.com
 * - Playlist: playlist?list=ID
 * - Video with Playlist: watch?v=ID&list=ID
 */
export function parseYouTubeUrl(input: string): YouTubeParsedUrl {
  if (!input || typeof input !== 'string') {
    return { type: 'invalid', videoId: null, playlistId: null };
  }

  const trimmed = input.trim();

  // 1. Plain 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: 'video', videoId: trimmed, playlistId: null };
  }

  // 2. Plain YouTube Playlist ID (starts with common playlist prefixes)
  if (/^(?:PL|OLAK5uy_|RD|UU|FL|LL|TL|CL)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { type: 'playlist', videoId: null, playlistId: trimmed };
  }

  // 3. URL-based parsing
  try {
    let url: URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      url = new URL(trimmed);
    } else {
      url = new URL(`https://${trimmed}`);
    }

    const host = url.hostname.replace('www.', '').toLowerCase();
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    const listParam = searchParams.get('list');
    let videoId: string | null = searchParams.get('v');

    if (host === 'youtu.be') {
      videoId = pathname.slice(1).split('/')[0] || null;
    } else if (pathname.startsWith('/embed/')) {
      videoId = pathname.split('/embed/')[1]?.split('/')[0] || null;
    } else if (pathname.startsWith('/v/')) {
      videoId = pathname.split('/v/')[1]?.split('/')[0] || null;
    } else if (pathname.startsWith('/shorts/')) {
      videoId = pathname.split('/shorts/')[1]?.split('/')[0] || null;
    } else if (pathname.startsWith('/live/')) {
      videoId = pathname.split('/live/')[1]?.split('/')[0] || null;
    }

    if (videoId && !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      videoId = null;
    }

    if (videoId && listParam) {
      return { type: 'video_with_playlist', videoId, playlistId: listParam };
    }
    if (listParam) {
      return { type: 'playlist', videoId: null, playlistId: listParam };
    }
    if (videoId) {
      return { type: 'video', videoId, playlistId: null };
    }
  } catch {}

  // 4. Regex fallbacks for unconventional or partial strings
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const vMatch = trimmed.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([\w-]{11})/);

  const playlistId = listMatch ? listMatch[1] : null;
  const videoId = vMatch ? vMatch[1] : null;

  if (videoId && playlistId) {
    return { type: 'video_with_playlist', videoId, playlistId };
  }
  if (playlistId) {
    return { type: 'playlist', videoId: null, playlistId };
  }
  if (videoId) {
    return { type: 'video', videoId, playlistId: null };
  }

  return { type: 'invalid', videoId: null, playlistId: null };
}

/**
 * Extracts YouTube video ID from various URL formats or plain video ID string.
 */
export function extractVideoId(input: string): string | null {
  const parsed = parseYouTubeUrl(input);
  return parsed.videoId;
}

/**
 * Get YouTube thumbnail with progressive quality fallbacks.
 */
export function getThumbnailUrl(videoId: string, quality: 'maxres' | 'hq' | 'mq' = 'maxres'): string {
  switch (quality) {
    case 'maxres':
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    case 'hq':
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    case 'mq':
    default:
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
}

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Robust YouTube metadata resolver with multi-endpoint fallback chain:
 * 1. noembed.com
 * 2. youtube.com/oembed
 * 3. YouTube IFrame Player instance (getVideoData)
 */
export async function fetchVideoMetadata(
  videoId: string,
  getPlayerVideoData?: () => { title?: string; author?: string; videoId?: string } | null
): Promise<SongMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Primary: Noembed
  try {
    const res = await fetchWithTimeout(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`, 4000);
    if (res.ok) {
      const data = await res.json();
      if (data.title && !data.error) {
        return {
          videoId,
          title: data.title,
          author: data.author_name || '',
          thumbnailUrl: getThumbnailUrl(videoId, 'hq'),
        };
      }
    }
  } catch (e) {
    console.warn('[Metadata] noembed failed, trying youtube oembed fallback...', e);
  }

  // 2. Fallback: YouTube oEmbed
  try {
    const res = await fetchWithTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`, 4000);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        return {
          videoId,
          title: data.title,
          author: data.author_name || '',
          thumbnailUrl: getThumbnailUrl(videoId, 'hq'),
        };
      }
    }
  } catch (e) {
    console.warn('[Metadata] youtube oembed failed:', e);
  }

  // 3. Fallback: Directly from YouTube IFrame Player instance
  if (getPlayerVideoData) {
    try {
      const videoData = getPlayerVideoData();
      if (videoData && videoData.title) {
        return {
          videoId,
          title: videoData.title,
          author: videoData.author || '',
          thumbnailUrl: getThumbnailUrl(videoId, 'hq'),
        };
      }
    } catch (e) {
      console.warn('[Metadata] player.getVideoData failed:', e);
    }
  }

  return {
    videoId,
    title: 'Track ' + videoId,
    author: 'YouTube Audio',
    thumbnailUrl: getThumbnailUrl(videoId, 'hq'),
  };
}
