import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw,
  Train,
  CloudRain,
  Activity,
  Play,
  X,
  Coffee,
  Headphones,
} from 'lucide-react';
import { DemoSong } from '../types';
import { TaskItem } from './TaskManager';
import { AmbientSoundId } from '../hooks/useAmbientSounds';
import { parseYouTubeUrl } from '../utils/youtube';

interface FlocusActionBarProps {
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

  // Ambient Sound (3 streamlined sounds: train, rain, brownNoise)
  volumes: Record<string, number>;
  isMasterMuted: boolean;
  onVolumeChange: (id: AmbientSoundId, vol: number) => void;
  onToggleMasterMute: () => void;
  onStopAllAmbient: () => void;
}

type ActiveTab = 'tasks' | 'notes' | 'music' | null;
type MusicSubTab = 'queue' | 'ambient';

export const FlocusActionBar: React.FC<FlocusActionBarProps> = ({
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
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [musicSubTab, setMusicSubTab] = useState<MusicSubTab>('ambient');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Auto-saving Notepad
  const [noteContent, setNoteContent] = useState<string>(() => {
    try {
      return localStorage.getItem('viet_travel_notepad_notes') || '';
    } catch {
      return '';
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Save notepad content
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

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!activeTab) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTab(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

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
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${parsed.videoId}`);
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
    <div
      ref={popoverRef}
      className="relative flex items-center select-none"
    >
      {/* FLOATING ACTION POPOVER CARD */}
      {activeTab && (
        <div className="fixed sm:absolute top-14 sm:top-full left-3 sm:left-0 right-3 sm:right-auto sm:mt-2.5 sm:w-96 max-h-[calc(100dvh-5rem)] bg-[#121216]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 flex flex-col z-50 animate-fade-in font-sans overflow-hidden">
          {/* ========================================================= */}
          {/* TAB 1: TO-DO TASK CHECKLIST                               */}
          {/* ========================================================= */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Mục tiêu tập trung
                  </span>
                  {pendingTaskCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-mono">
                      {pendingTaskCount} chưa xong
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task Creation Form */}
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm mục tiêu mới..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  disabled={!newTaskInput.trim()}
                  className="p-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 transition disabled:opacity-30 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Task List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition group"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 ${
                            task.completed
                              ? 'bg-white border-white text-black'
                              : 'border-white/30 group-hover:border-white/60'
                          }`}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs truncate transition ${
                            task.completed ? 'line-through text-white/40' : 'text-white/80 group-hover:text-white'
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Chưa có mục tiêu nào. Nhập và bấm + để thêm!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: NOTEPAD (GHI CHÚ)                                  */}
          {/* ========================================================= */}
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Ghi chú nhanh
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    title="Sao chép toàn bộ"
                  >
                    {copiedNote ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span className="text-white">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Chép</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearNote}
                    className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
                    title="Xóa ghi chú"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab(null)}
                    className="text-zinc-400 hover:text-white transition p-1 cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={noteContent}
                onChange={handleNoteChange}
                placeholder="Gõ nhanh ý tưởng, ghi chép hoặc checklist trong phiên tập trung..."
                className="w-full h-44 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 resize-none leading-relaxed"
                autoFocus
              />

              {/* Footer info: words & chars count */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-0.5">
                <span>{wordCount} từ · {charCount} ký tự</span>
                <span className="text-zinc-400">Tự động lưu</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: NHẠC & FOCUS SOUND (2-TAB POPOVER)                 */}
          {/* ========================================================= */}
          {activeTab === 'music' && (
            <div className="flex flex-col h-full space-y-3">
              {/* Header with Sub-tabs */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setMusicSubTab('queue')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                      musicSubTab === 'queue'
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hàng đợi ({queue.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMusicSubTab('ambient')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer font-medium ${
                      musicSubTab === 'ambient'
                        ? 'bg-white text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Âm thanh nền
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* SUB-TAB 1: YOUTUBE PLAYLIST QUEUE */}
              {musicSubTab === 'queue' && (
                <div className="space-y-2.5">
                  {/* Add URL input */}
                  <form onSubmit={handleAddYouTubeUrl} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Dán link YouTube (video/playlist)..."
                      value={newUrlInput}
                      onChange={(e) => setNewUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="submit"
                      disabled={isAddingUrl || !newUrlInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-white text-black font-medium text-xs hover:bg-neutral-200 transition disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      {isAddingUrl ? '...' : '+ Thêm'}
                    </button>
                  </form>

                  {/* Loop & Track Controls Bar */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <button
                      type="button"
                      onClick={onToggleRepeat}
                      className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
                    >
                      {repeatMode === 'one' ? (
                        <>
                          <Repeat1 className="w-3.5 h-3.5 text-white" />
                          <span className="text-white">Lặp 1 bài</span>
                        </>
                      ) : repeatMode === 'all' ? (
                        <>
                          <Repeat className="w-3.5 h-3.5 text-white" />
                          <span className="text-white">Lặp danh sách</span>
                        </>
                      ) : (
                        <>
                          <Repeat className="w-3.5 h-3.5 opacity-50" />
                          <span>Không lặp</span>
                        </>
                      )}
                    </button>

                    <span className="text-[10px] text-zinc-500">Tự động chuyển bài khi hết</span>
                  </div>

                  {/* Track Queue List */}
                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    {queue.map((song, idx) => {
                      const isCurrent = idx === currentIndex;
                      return (
                        <div
                          key={`${song.videoId}_${idx}`}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-xl border transition group ${
                            isCurrent
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-zinc-400'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectTrack(idx)}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                              <img
                                src={`https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {isCurrent && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  {isPlaying ? (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                  ) : (
                                    <Play className="w-3 h-3 text-white fill-current" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <div className={`text-xs truncate font-medium ${isCurrent ? 'text-white font-semibold' : 'text-zinc-200'}`}>
                                {song.title}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">{song.artist}</div>
                            </div>
                          </button>

                          {queue.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onRemoveTrack(idx)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                              title="Xóa khỏi hàng đợi"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: STREAMLINED FOCUS SOUND (3 ESSENTIAL AMBIENT SLIDERS) */}
              {musicSubTab === 'ambient' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
                    <span className="text-zinc-400">Âm thanh thiên nhiên & tiếng ồn</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onToggleMasterMute}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isMasterMuted ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-white'
                        }`}
                        title={isMasterMuted ? 'Bật âm thanh' : 'Tắt tiếng tất cả'}
                      >
                        {isMasterMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={onStopAllAmbient}
                        className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Tắt tất cả"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Essential Sliders: Train Track, Rain, Brown Noise */}
                  <div className="space-y-3">
                    {/* 1. Tiếng tàu chạy (Train Track) */}
                    {(() => {
                      const vol = volumes['train'] ?? 0;
                      const active = vol > 0 && !isMasterMuted;
                      return (
                        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Train className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-500'}`} />
                              <span className={`text-xs ${active ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                Tiếng tàu chạy (Train Track)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">{vol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={vol}
                            onChange={(e) => onVolumeChange('train', Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                          />
                        </div>
                      );
                    })()}

                    {/* 2. Mưa rơi (Rain) */}
                    {(() => {
                      const vol = volumes['rain'] ?? 0;
                      const active = vol > 0 && !isMasterMuted;
                      return (
                        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <CloudRain className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-500'}`} />
                              <span className={`text-xs ${active ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                Mưa rơi (Rain)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">{vol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={vol}
                            onChange={(e) => onVolumeChange('rain', Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                          />
                        </div>
                      );
                    })()}

                    {/* 3. Quán cà phê (Cafe) */}
                    {(() => {
                      const vol = volumes['cafe'] ?? 0;
                      const active = vol > 0 && !isMasterMuted;
                      return (
                        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Coffee className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-500'}`} />
                              <span className={`text-xs ${active ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                Quán cà phê (Cafe)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">{vol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={vol}
                            onChange={(e) => onVolumeChange('cafe', Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                          />
                        </div>
                      );
                    })()}

                    {/* 4. Tiếng ồn nâu (Brown Noise) */}
                    {(() => {
                      const vol = volumes['brownNoise'] ?? 0;
                      const active = vol > 0 && !isMasterMuted;
                      return (
                        <div className="space-y-1 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Activity className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-500'}`} />
                              <span className={`text-xs ${active ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                Tiếng ồn nâu (Brown Noise)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">{vol}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={vol}
                            onChange={(e) => onVolumeChange('brownNoise', Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3 ACTION PILLS (NAVBAR MOUNTED) */}
      <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-sm">
        {/* Button 1: Nhiệm vụ */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'tasks' ? null : 'tasks')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white text-black shadow-md font-semibold'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
          title="Mục tiêu tập trung (Tasks)"
        >
          <CheckSquare className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="hidden xs:inline">Nhiệm vụ</span>
          {pendingTaskCount > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'tasks' ? 'bg-black text-white' : 'bg-white/15 text-white'
              }`}
            >
              {pendingTaskCount}
            </span>
          )}
        </button>

        {/* Button 2: Ghi chú */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'notes' ? null : 'notes')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white text-black shadow-md font-semibold'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
          title="Ghi chú nhanh (Notepad)"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="hidden xs:inline">Ghi chú</span>
        </button>

        {/* Button 3: Âm thanh */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'music' ? null : 'music')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            activeTab === 'music'
              ? 'bg-white text-black shadow-md font-semibold'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
          title="Âm thanh nền & Danh sách phát"
        >
          <Headphones className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="hidden xs:inline">Âm thanh</span>
        </button>
      </div>
    </div>
  );
};

export default FlocusActionBar;
