import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check, Copy, X } from 'lucide-react';
import { saveStoredSyncId } from '../utils/cloudSync';

interface CloudSyncPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  syncId: string;
  onUpdateSyncId: (newId: string) => void;
  isSyncing: boolean;
  lastSyncedTime: string;
  onTriggerSync: () => void;
}

export const CloudSyncPopover: React.FC<CloudSyncPopoverProps> = ({
  isOpen,
  onClose,
  syncId,
  onUpdateSyncId,
  isSyncing,
  lastSyncedTime,
  onTriggerSync,
}) => {
  const [inputValue, setInputValue] = useState(syncId);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(syncId);
  }, [syncId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (clean && clean !== syncId) {
      saveStoredSyncId(clean);
      onUpdateSyncId(clean);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(syncId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 bg-[#121214]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 text-white select-none animate-fade-in font-sans"
    >
      {/* Header: Pure Monochrome */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
        <span className="text-sm font-semibold tracking-tight text-white/90">
          Đồng bộ
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sync ID Input Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Mã đồng bộ</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-white" />
                <span className="text-white">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSaveId} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nhập mã đồng bộ..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 font-mono"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || inputValue.trim() === syncId}
            className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 transition disabled:opacity-40 cursor-pointer"
          >
            Lưu
          </button>
        </form>

        {/* Minimal Status Line */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-zinc-400 animate-spin' : 'bg-white'}`} />
            <span className="text-[11px] font-mono">
              {isSyncing
                ? 'Đang đồng bộ...'
                : lastSyncedTime
                ? `Đã lưu tự động lúc ${lastSyncedTime}`
                : 'Tự động lưu thời gian thực'}
            </span>
          </div>
          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đồng bộ lại"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncPopover;
