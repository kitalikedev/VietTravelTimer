import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Train,
  CloudRain,
  Activity,
  Play,
  X,
  Headphones,
} from 'lucide-react';
import { DemoSong } from '../types';
import { TaskItem } from './TaskManager';
import { AmbientSoundId } from '../hooks/useAmbientSounds';
import { parseYouTubeUrl } from '../utils/youtube';

export interface MobileActionDrawerProps {
  // Tasks
  tasks: TaskItem[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;

  // Music Queue
  queue: DemoSong[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onAddTrackToQueue: (song: DemoSong) => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  isPlaying: boolean;

  // Ambient Sounds
  volumes: Record<string, number>;
  isMasterMuted: boolean;
  onVolumeChange: (id: AmbientSoundId, vol: number) => void;
  onToggleMasterMute: () => void;
  onStopAllAmbient: () => void;
}

export type MobileTab = 'tasks' | 'notes' | 'sounds' | null;

export const MobileActionDrawer: React.FC<MobileActionDrawerProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  queue,
  currentIndex,
  onSelectTrack,
  onRemoveTrack,
  onAddTrackToQueue,
  repeatMode,
  onToggleRepeat,
  isPlaying,
  volumes,
  isMasterMuted,
  onVolumeChange,
  onToggleMasterMute,
  onStopAllAmbient,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>(null);
  const [soundSubTab, setSoundSubTab] = useState<'ambient' | 'queue'>('ambient');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Auto-saving Notepad synced with desktop
  const [noteContent, setNoteContent] = useState<string>(() => {
    try {
      return localStorage.getItem('viet_travel_notepad_notes') || '';
    } catch {
      return '';
    }
  });

  // Reload note content when opened
  useEffect(() => {
    if (activeTab === 'notes') {
      try {
        const saved = localStorage.getItem('viet_travel_notepad_notes') || '';
        setNoteContent(saved);
      } catch {}
    }
  }, [activeTab]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    try {
      localStorage.setItem('viet_travel_notepad_notes', val);
    } catch {}
  };

  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(noteContent);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } catch {}
  };

  const handleClearNote = () => {
    if (!noteContent) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ ghi chú?')) {
      setNoteContent('');
      try {
        localStorage.removeItem('viet_travel_notepad_notes');
      } catch {}
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    onAddTask(newTaskInput.trim());
    setNewTaskInput('');
  };

  const handleAddYouTubeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = newUrlInput.trim();
    if (!url) return;

    const parsed = parseYouTubeUrl(url);
    if (!parsed.videoId) {
      alert('Vui lòng nhập đường link YouTube hợp lệ!');
      return;
    }

    setIsAddingUrl(true);
    try {
      let title = `YouTube Track (${parsed.videoId})`;
      let artist = 'YouTube';

      try {
        const res = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${parsed.videoId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.title) {
            title = data.title;
            artist = data.author_name || 'YouTube Music';
          }
        }
      } catch {}

      onAddTrackToQueue({
        title,
        artist,
        videoId: parsed.videoId,
        duration: '0:00',
      });

      setNewUrlInput('');
    } finally {
      setIsAddingUrl(false);
    }
  };

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;
  const wordCount = noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  const charCount = noteContent.length;

  return (
    <>
      {/* 1. COMPACT DOCKED MOBILE ACTION BAR (Placed right above the bottom player dock) */}
      <div className="fixed bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+13.5rem)] left-0 right-0 z-40 px-3 flex justify-center pointer-events-none md:hidden select-none">
        <div className="flex items-center gap-1 pointer-events-auto bg-[#18181b]/95 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
          {/* Button 1: Nhiệm vụ */}
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer active:scale-95 ${
              activeTab === 'tasks'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-200 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Nhiệm vụ</span>
            {pendingTaskCount > 0 && (
              <span
                className={`min-w-[14px] h-[14px] rounded-full text-[9px] font-mono font-bold flex items-center justify-center px-0.5 ${
                  activeTab === 'tasks' ? 'bg-black text-white' : 'bg-white text-black'
                }`}
              >
                {pendingTaskCount}
              </span>
            )}
          </button>

          <div className="w-px h-3.5 bg-white/15 mx-0.5" />

          {/* Button 2: Ghi chú */}
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer active:scale-95 ${
              activeTab === 'notes'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-200 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Ghi chú</span>
          </button>

          <div className="w-px h-3.5 bg-white/15 mx-0.5" />

          {/* Button 3: Sound & Nhạc */}
          <button
            type="button"
            onClick={() => setActiveTab('sounds')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer active:scale-95 ${
              activeTab === 'sounds'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-200 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span>Sound & Nhạc</span>
          </button>
        </div>
      </div>

      {/* 2. FULL-WIDTH MOBILE BOTTOM DRAWER / SHEET */}
      {activeTab && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop Blur */}
          <div
            onClick={() => setActiveTab(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
          />

          {/* Bottom Sheet Card */}
          <div className="relative w-full h-[68vh] bg-[#121214] border-t border-white/15 rounded-t-3xl p-5 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-300 font-sans select-none text-white pb-[max(env(safe-area-inset-bottom),1.25rem)]">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header Switcher & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0">
              <div className="flex items-center gap-1 bg-black/50 border border-white/10 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                    activeTab === 'tasks'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Nhiệm vụ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                    activeTab === 'notes'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ghi chú</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('sounds')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                    activeTab === 'sounds'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Sound</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Đóng (Close)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="flex-1 overflow-y-auto pr-1">
              {/* ========================================================= */}
              {/* TAB 1: NHIỆM VỤ (CHECKLIST)                                */}
              {/* ========================================================= */}
              {activeTab === 'tasks' && (
                <div className="flex flex-col h-full space-y-3">
                  {/* Task Creation Form */}
                  <form onSubmit={handleCreateTask} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Thêm mục tiêu mới..."
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="submit"
                      disabled={!newTaskInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 transition disabled:opacity-30 cursor-pointer font-medium text-xs shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </form>

                  {/* Task List */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition group"
                        >
                          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => onToggleTask(task.id)}
                              className="w-4 h-4 rounded border-white/20 accent-white shrink-0 cursor-pointer"
                            />
                            <span
                              className={`text-xs truncate transition ${
                                task.completed
                                  ? 'line-through text-zinc-500'
                                  : 'text-zinc-200'
                              }`}
                            >
                              {task.text}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Xóa mục tiêu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-zinc-500">
                        Chưa có mục tiêu nào. Hãy thêm công việc cần hoàn thành!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: GHI CHÚ NHANH (NOTEPAD)                            */}
              {/* ========================================================= */}
              {activeTab === 'notes' && (
                <div className="flex flex-col h-full space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{wordCount} từ</span>
                      <span>·</span>
                      <span className="font-mono">{charCount} ký tự</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyNote}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        {copiedNote ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearNote}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 transition cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={noteContent}
                    onChange={handleNoteChange}
                    placeholder="Ghi chú ý tưởng, suy nghĩ hoặc to-do tự do của bạn... (Tự động lưu)"
                    className="w-full flex-1 min-h-[220px] p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 resize-none font-sans leading-relaxed"
                  />
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: SOUND & NHẠC (AMBIENT MIXER & PLAYLIST)            */}
              {/* ========================================================= */}
              {activeTab === 'sounds' && (
                <div className="flex flex-col h-full space-y-3">
                  {/* Subtab Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setSoundSubTab('ambient')}
                      className={`flex-1 py-1.5 rounded-lg transition font-medium cursor-pointer text-center ${
                        soundSubTab === 'ambient'
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Âm thanh nền (Ambient)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSoundSubTab('queue')}
                      className={`flex-1 py-1.5 rounded-lg transition font-medium cursor-pointer text-center ${
                        soundSubTab === 'queue'
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Hàng đợi phát ({queue.length})
                    </button>
                  </div>

                  {/* Subtab 1: Ambient Sound Mixer */}
                  {soundSubTab === 'ambient' && (
                    <div className="space-y-3 pt-1">
                      {/* Master control */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                        <span className="text-xs text-zinc-300">Âm thanh tổng</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onToggleMasterMute}
                            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition ${
                              isMasterMuted
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-white text-black shadow-sm'
                            }`}
                          >
                            {isMasterMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>{isMasterMuted ? 'Đang tắt' : 'Bật'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={onStopAllAmbient}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs transition cursor-pointer"
                          >
                            Tắt hết
                          </button>
                        </div>
                      </div>

                      {/* 3 Channels: Train, Rain, Brown Noise */}
                      <div className="space-y-2.5">
                        {/* Channel 1: Train */}
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Train className="w-4 h-4 text-zinc-300" />
                              <span className="text-xs font-medium text-white">Tiếng tàu hỏa</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {Math.round(volumes.train || 0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumes.train || 0}
                            onChange={(e) => onVolumeChange('train', Number(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>

                        {/* Channel 2: Rain */}
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CloudRain className="w-4 h-4 text-zinc-300" />
                              <span className="text-xs font-medium text-white">Mưa rơi cửa sổ</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {Math.round(volumes.rain || 0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumes.rain || 0}
                            onChange={(e) => onVolumeChange('rain', Number(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>

                        {/* Channel 3: Brown Noise */}
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-zinc-300" />
                              <span className="text-xs font-medium text-white">Tiếng ồn nâu (Deep Focus)</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {Math.round(volumes.brownNoise || 0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volumes.brownNoise || 0}
                            onChange={(e) => onVolumeChange('brownNoise', Number(e.target.value))}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtab 2: Playlist Queue */}
                  {soundSubTab === 'queue' && (
                    <div className="space-y-3 pt-1">
                      {/* Repeat & Add URL */}
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs text-zinc-400">Hàng đợi phát ({queue.length})</span>
                        <button
                          type="button"
                          onClick={onToggleRepeat}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 transition cursor-pointer"
                          title="Chế độ lặp lại"
                        >
                          {repeatMode === 'one' ? (
                            <>
                              <Repeat1 className="w-3.5 h-3.5 text-white" />
                              <span className="text-[11px]">Lặp 1 bài</span>
                            </>
                          ) : repeatMode === 'all' ? (
                            <>
                              <Repeat className="w-3.5 h-3.5 text-white" />
                              <span className="text-[11px]">Lặp toàn bộ</span>
                            </>
                          ) : (
                            <>
                              <Repeat className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="text-[11px]">Không lặp</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Add YouTube URL */}
                      <form onSubmit={handleAddYouTubeUrl} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Dán link YouTube..."
                          value={newUrlInput}
                          onChange={(e) => setNewUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                        />
                        <button
                          type="submit"
                          disabled={!newUrlInput.trim() || isAddingUrl}
                          className="px-3 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 transition disabled:opacity-30 cursor-pointer font-medium text-xs shrink-0"
                        >
                          {isAddingUrl ? 'Thêm...' : 'Thêm'}
                        </button>
                      </form>

                      {/* Queue list */}
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {queue.map((track, idx) => {
                          const isCurrent = idx === currentIndex;
                          return (
                            <div
                              key={`${track.videoId}-${idx}`}
                              onClick={() => onSelectTrack(idx)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-white/15 border-white/30 text-white font-medium'
                                  : 'bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {isCurrent && isPlaying ? (
                                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  </div>
                                ) : (
                                  <Play className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs truncate">{track.title}</p>
                                  <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveTrack(idx);
                                }}
                                className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer ml-2"
                                title="Xóa khỏi hàng đợi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileActionDrawer;
