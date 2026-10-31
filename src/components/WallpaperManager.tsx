import React, { useRef, useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import {
  saveCustomWallpaperToDB,
  deleteCustomWallpaperFromDB,
  revokeWallpaperUrl,
} from '../utils/wallpaperStorage';

export type BackdropMode = 'CENTER_ARTWORK' | 'CUSTOM_WALLPAPER' | 'POV_VIDEO';

export interface BackdropPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  mode: BackdropMode;
  onSelectMode: (mode: BackdropMode) => void;
  customWallpaperUrl: string | null;
  onWallpaperUpdated: (url: string | null) => void;
  showArtworkCard: boolean;
  onToggleShowArtwork: (show: boolean) => void;
  artworkBlur: number;
  onArtworkBlurChange: (blur: number) => void;
}

export const BackdropPopover: React.FC<BackdropPopoverProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectMode,
  customWallpaperUrl,
  onWallpaperUpdated,
  showArtworkCard,
  onToggleShowArtwork,
  artworkBlur,
  onArtworkBlurChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Click outside listener to dismiss popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      await saveCustomWallpaperToDB(file);
      revokeWallpaperUrl(customWallpaperUrl);
      const newUrl = URL.createObjectURL(file);
      onWallpaperUpdated(newUrl);
      onSelectMode('CUSTOM_WALLPAPER');
    } catch (err) {
      console.error('[Backdrop] Failed to save custom wallpaper:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCustom = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteCustomWallpaperFromDB();
      revokeWallpaperUrl(customWallpaperUrl);
      onWallpaperUpdated(null);
      onSelectMode('CENTER_ARTWORK');
    } catch (err) {
      console.error('[Backdrop] Failed to reset wallpaper:', err);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-84 bg-[#141518]/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 text-white select-none animate-fade-in font-sans"
    >
      {/* 1. Header: Single hairline row with Title & ESC Close */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
        <span className="text-xs font-mono tracking-widest text-zinc-400 font-semibold uppercase">
          PHÔNG NỀN // BACKDROP
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition font-mono text-[11px]"
          title="Đóng (Esc)"
        >
          <span>ESC</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. macOS-Style Segmented Control */}
      <div className="bg-black/60 p-1 rounded-xl flex gap-1 border border-white/10 mb-4 text-center">
        <button
          type="button"
          onClick={() => onSelectMode('CENTER_ARTWORK')}
          className={`py-1.5 flex-1 rounded-lg text-xs font-mono transition-all ${
            mode === 'CENTER_ARTWORK'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
          }`}
        >
          ARTWORK
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('CUSTOM_WALLPAPER')}
          className={`py-1.5 flex-1 rounded-lg text-xs font-mono transition-all ${
            mode === 'CUSTOM_WALLPAPER'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
          }`}
        >
          ẢNH NỀN
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('POV_VIDEO')}
          className={`py-1.5 flex-1 rounded-lg text-xs font-mono transition-all ${
            mode === 'POV_VIDEO'
              ? 'bg-white text-black font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white font-medium hover:bg-white/5'
          }`}
        >
          POV TÀU
        </button>
      </div>

      {/* 3. Functional Tab Panes (Zero Clutter) */}
      <div className="space-y-3">
        {/* TAB 1: ARTWORK */}
        {mode === 'CENTER_ARTWORK' && (
          <div className="space-y-1">
            {/* Row 1: Large artwork visibility toggle */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-xs font-sans text-zinc-300">Hiển thị ảnh album lớn</span>
              <button
                type="button"
                role="switch"
                aria-checked={showArtworkCard}
                onClick={() => onToggleShowArtwork(!showArtworkCard)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                  showArtworkCard ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform ${
                    showArtworkCard ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </div>

            {/* Row 2: Optical blur range slider */}
            <div className="py-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans text-zinc-300">Độ mờ quang học (Blur)</span>
                <span className="text-[11px] font-mono text-zinc-400">{artworkBlur}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="2"
                value={artworkBlur}
                onChange={(e) => onArtworkBlurChange(Number(e.target.value))}
                className="w-full accent-white h-1 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 2: ẢNH NỀN */}
        {mode === 'CUSTOM_WALLPAPER' && (
          <div className="space-y-2.5">
            {/* Custom Image Preview Thumbnail */}
            {customWallpaperUrl && (
              <div className="rounded-lg overflow-hidden border border-white/10 aspect-video relative bg-neutral-900 shadow">
                <img
                  src={customWallpaperUrl}
                  alt="Custom Wallpaper Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 ${
                isDragging ? 'border-white bg-white/10' : 'border-white/20 hover:border-white/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <Upload className="w-4 h-4 text-zinc-400" />
              <span className="text-[11px] font-mono font-medium text-zinc-200">
                {isUploading ? 'ĐANG LƯU ẢNH...' : 'BẤM HOẶC KÉO THẢ ẢNH VÀO ĐÂY'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">JPG, PNG, WEBP · Toàn màn hình</span>
            </div>

            {/* Action button below */}
            {customWallpaperUrl && (
              <button
                type="button"
                onClick={handleDeleteCustom}
                className="w-full text-center text-[11px] font-mono text-zinc-400 hover:text-red-400 mt-2 transition-colors py-1"
              >
                ĐẶT LẠI MẶC ĐỊNH // RESET
              </button>
            )}
          </div>
        )}

        {/* TAB 3: POV TÀU */}
        {mode === 'POV_VIDEO' && (
          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-sans text-zinc-300">Video đường sắt Thống Nhất SE3</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
              Tự động đồng bộ với nhịp tập trung Pomodoro
            </p>

            <button
              type="button"
              onClick={() => {
                onSelectMode('POV_VIDEO');
                onClose();
              }}
              className="w-full py-2 px-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-200 hover:text-white transition text-center"
            >
              XEM THỬ POV // PREVIEW
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const WallpaperManager = BackdropPopover;
export default BackdropPopover;
