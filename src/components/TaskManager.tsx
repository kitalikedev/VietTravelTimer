import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Trash2, Target, CheckCircle2 } from 'lucide-react';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTaskId: string | null;
  onSelectActiveTask: (taskId: string | null) => void;
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

const STORAGE_KEY = 'ytlyrics_tasks';

export function useTasksState() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      { id: '1', text: 'Hoàn thành báo cáo công việc', completed: false, createdAt: Date.now() },
      { id: '2', text: 'Tập trung đọc tài liệu 25 phút', completed: true, createdAt: Date.now() - 3600000 },
    ];
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ytlyrics_active_task_id') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const selectActiveTask = (id: string | null) => {
    setActiveTaskId(id);
    try {
      if (id) {
        localStorage.setItem('ytlyrics_active_task_id', id);
      } else {
        localStorage.removeItem('ytlyrics_active_task_id');
      }
    } catch {}
  };

  return {
    tasks,
    setTasks,
    activeTaskId,
    selectActiveTask,
  };
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  isOpen,
  onClose,
  activeTaskId,
  onSelectActiveTask,
  tasks,
  setTasks,
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setInputText('');

    // If no active task, set this new task as active automatically
    if (!activeTaskId) {
      onSelectActiveTask(newTask.id);
    }
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      onSelectActiveTask(null);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <aside className="relative w-full max-w-sm sm:max-w-md h-full bg-[#141416]/95 border-l border-white/10 shadow-2xl flex flex-col z-10 backdrop-blur-2xl animate-fade-in text-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Danh sách công việc (Tasks)</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Đã hoàn thành {completedCount}/{tasks.length} mục
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Input Form */}
        <form onSubmit={handleAddTask} className="p-4 border-b border-white/10">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Thêm việc cần làm (Nhấn Enter)..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 p-1.5 rounded-lg bg-white text-black disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-200 transition"
              title="Thêm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tasks.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-2 stroke-[1.5]" />
              <p>Chưa có công việc nào.</p>
              <p className="text-neutral-600 mt-1">Thêm mục tiêu để tập trung hoàn thành cùng Pomodoro!</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isFocused = activeTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`group relative p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isFocused
                      ? 'bg-white/[0.08] border-white/30 ring-1 ring-white/10'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  {/* Left: Checkbox + Text */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                        task.completed
                          ? 'bg-white border-white text-black'
                          : 'border-white/30 hover:border-white text-transparent'
                      }`}
                      title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>

                    <span
                      onClick={() => handleToggleComplete(task.id)}
                      className={`text-sm cursor-pointer truncate transition-all ${
                        task.completed
                          ? 'line-through text-neutral-500'
                          : 'text-neutral-200 group-hover:text-white'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  {/* Right Actions: Focus tag + Delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectActiveTask(isFocused ? null : task.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                        isFocused
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isFocused ? 'Bỏ chọn mục tiêu chính' : 'Đặt làm mục tiêu tập trung Pomodoro'}
                    >
                      <Target className="w-3 h-3" />
                      <span className="hidden sm:inline">{isFocused ? 'Tập trung' : 'Chọn'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                      title="Xóa công việc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Tự động lưu vào trình duyệt</span>
          <span className="font-mono text-[10px]">Pomodoro Tasks</span>
        </div>
      </aside>
    </div>
  );
};
