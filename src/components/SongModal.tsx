import React, { useState } from 'react';
import {
  X,
  Youtube,
  ListMusic,
  AlertCircle,
} from 'lucide-react';
import { DEMO_SONGS } from '../data/demoSongs';
import { DemoSong } from '../types';
import { parseYouTubeUrl } from '../utils/youtube';

interface SongModalProps {
  isOpen: boolean;
  activeTab?: 'url' | 'demos';
  onClose: () => void;
  onSelectVideoId: (videoId: string, overrideTitle?: string, overrideArtist?: string) => void;
  onSelectPlaylist?: (playlistId: string) => void;
}

export const SongModal: React.FC<SongModalProps> = ({
  isOpen,
  activeTab: initialTab = 'url',
  onClose,
  onSelectVideoId,
  onSelectPlaylist,
}) => {
  const [tab, setTab] = useState<'url' | 'demos'>(initialTab);

  // URL Input State
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    const parsed = parseYouTubeUrl(urlInput);
    if (parsed.type === 'invalid') {
      setUrlError('Vui lòng nhập đường link YouTube hoặc danh sách phát (Playlist) hợp lệ.');
      return;
    }

    if (parsed.type === 'playlist' && parsed.playlistId) {
      if (onSelectPlaylist) {
        onSelectPlaylist(parsed.playlistId);
      } else {
        onSelectVideoId(parsed.playlistId);
      }
      onClose();
      return;
    }

    if (parsed.type === 'video_with_playlist' && parsed.playlistId && onSelectPlaylist) {
      onSelectPlaylist(parsed.playlistId);
      onClose();
      return;
    }

    if (parsed.videoId) {
      onSelectVideoId(parsed.videoId);
      onClose();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
      }
    } catch {
      // Ignore clipboard permission
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden z-10 text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-900">
          <h2 className="text-sm font-semibold tracking-tight text-white">Chọn Nhạc &amp; Playlist YouTube</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-neutral-900 overflow-x-auto scrollbar-none text-xs font-medium">
          <button
            onClick={() => setTab('url')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              tab === 'url'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-neutral-400" />
            <span>YouTube URL / Playlist</span>
          </button>

          <button
            onClick={() => setTab('demos')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              tab === 'demos'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-neutral-400" />
            <span>Gợi ý Tập trung</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB: YouTube URL */}
          {tab === 'url' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Dán bất kỳ link bài hát hoặc danh sách phát (Playlist) từ YouTube:
              </p>

              <form onSubmit={handleUrlSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... hoặc playlist?list=..."
                    className="w-full px-3.5 py-3 pr-20 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 text-xs font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 transition"
                  >
                    Dán
                  </button>
                </div>

                {urlError && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{urlError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition duration-150"
                >
                  Phát nhạc ngay
                </button>
              </form>
            </div>
          )}

          {/* TAB: Curated Demos */}
          {tab === 'demos' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Tuyển tập bài hát tập trung nhẹ nhàng:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_SONGS.map((demo: DemoSong) => (
                  <button
                    key={demo.videoId}
                    onClick={() => {
                      onSelectVideoId(demo.videoId, demo.title, demo.artist);
                      onClose();
                    }}
                    className="group flex items-center gap-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/60 transition text-left"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${demo.videoId}/hqdefault.jpg`}
                      alt={demo.title}
                      onError={(e) => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${demo.videoId}/mqdefault.jpg`;
                      }}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">
                        {demo.title}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {demo.artist}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
