import React, { useState } from 'react';
import { X, Trash2, Plus, RotateCcw, ListMusic, Music } from 'lucide-react';
import { DemoSong } from '../types';
import { extractVideoId } from '../utils/youtube';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: DemoSong[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onAddToQueue: (song: DemoSong) => void;
  onResetQueue: () => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentIndex,
  onSelectTrack,
  onRemoveTrack,
  onAddToQueue,
  onResetQueue,
}) => {
  const [newUrl, setNewUrl] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const videoId = extractVideoId(newUrl);
    if (!videoId) {
      setInputError('Invalid YouTube URL');
      return;
    }

    onAddToQueue({
      title: `Track (${videoId})`,
      artist: 'Custom Addition',
      videoId,
      duration: '3:00',
    });

    setNewUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <aside className="relative w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col z-10 animate-fade-in text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold tracking-tight">Playing Next</h2>
            <span className="text-[11px] font-mono text-neutral-500">
              ({queue.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onResetQueue}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300 transition"
              title="Reset to default queue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
              title="Close Queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Add URL Form */}
        <form onSubmit={handleAddSubmit} className="p-4 border-b border-neutral-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setInputError(null);
              }}
              placeholder="Paste YouTube URL to queue..."
              className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
          {inputError && (
            <p className="mt-1 text-[11px] font-mono text-red-400">{inputError}</p>
          )}
        </form>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {queue.map((song, index) => {
            const isCurrent = index === currentIndex;

            return (
              <div
                key={`${song.videoId}-${index}`}
                className={`group flex items-center justify-between p-2 rounded-xl border transition duration-150 ${
                  isCurrent
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'border-transparent hover:border-neutral-800 hover:bg-neutral-900/60'
                }`}
              >
                {/* Clickable song trigger */}
                <button
                  onClick={() => onSelectTrack(index)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className="w-5 text-center text-xs font-mono flex-shrink-0">
                    {isCurrent ? (
                      <Music className="w-3.5 h-3.5 text-white inline-block animate-pulse" />
                    ) : (
                      <span className="text-neutral-600 group-hover:text-neutral-400">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 border border-neutral-800">
                    <img
                      src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0 flex-1 pr-2">
                    <p
                      className={`text-xs font-medium truncate ${
                        isCurrent ? 'text-white font-semibold' : 'text-neutral-300'
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </button>

                {/* Right: Duration & Remove action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {song.duration && (
                    <span className="text-[11px] font-mono text-neutral-600">
                      {song.duration}
                    </span>
                  )}
                  {queue.length > 1 && (
                    <button
                      onClick={() => onRemoveTrack(index)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono flex justify-between">
          <span>Auto-advance enabled</span>
          <span>Queue</span>
        </div>
      </aside>
    </div>
  );
};
