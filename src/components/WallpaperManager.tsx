import React, { useRef, useState, useEffect } from 'react';
import { X, Upload, Check, Layers, Moon, Image as ImageIcon } from 'lucide-react';
import { BackdropMode, PIXEL_BACKGROUNDS, STATIC_WALLPAPERS } from '../data/backgrounds';
import {
  saveCustomWallpaperToDB,
  deleteCustomWallpaperFromDB,
  revokeWallpaperUrl,
} from '../utils/wallpaperStorage';
import {
  saveCustomBgToDB,
  getAllCustomBgsFromDB,
  deleteCustomBgFromDB,
} from '../utils/customBgStorage';

export { type BackdropMode } from '../data/backgrounds';

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
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customBgs, setCustomBgs] = useState<Array<{ id: string; name: string; url: string; blob: Blob }>>([]);
  const [wallpaperType, setWallpaperType] = useState<'gif' | 'static'>(() => {
    if (mode === 'CUSTOM_WALLPAPER' && customWallpaperUrl) {
      const isGif = customWallpaperUrl.toLowerCase().includes('.gif') || customWallpaperUrl.startsWith('data:image/gif');
      return isGif ? 'gif' : 'static';
    }
    return 'gif';
  });

  // Load custom uploaded backgrounds from IndexedDB
  useEffect(() => {
    getAllCustomBgsFromDB().then((items) => {
      setCustomBgs(items);
    });
  }, []);

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

  // Upload local file (GIF / WebP / Image) and persist to IndexedDB
  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const id = `custom_${Date.now()}`;
      const objectUrl = await saveCustomBgToDB(id, file.name, file);
      await saveCustomWallpaperToDB(file);
      revokeWallpaperUrl(customWallpaperUrl);
      setCustomBgs((prev) => [{ id, name: file.name, url: objectUrl, blob: file }, ...prev]);
      onWallpaperUpdated(objectUrl);
      onSelectMode('CUSTOM_WALLPAPER');
      if (file.type === 'image/gif') {
        setWallpaperType('gif');
      } else {
        setWallpaperType('static');
      }
    } catch (err) {
      console.error('[Backdrop] Failed to save custom wallpaper:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete custom uploaded background
  const handleDeleteCustomBg = async (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    await deleteCustomBgFromDB(id);
    setCustomBgs((prev) => prev.filter((item) => item.id !== id));
    if (customWallpaperUrl === url) {
      await deleteCustomWallpaperFromDB();
      revokeWallpaperUrl(customWallpaperUrl);
      onWallpaperUpdated(null);
      onSelectMode('PIXEL_1');
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    onWallpaperUpdated(url);
    onSelectMode('CUSTOM_WALLPAPER');
    if (url.toLowerCase().includes('.gif')) {
      setWallpaperType('gif');
    } else {
      setWallpaperType('static');
    }
    setUrlInput('');
    setShowUrlInput(false);
  };

  const uploadedGifs = customBgs.filter(
    (b) => b.name.toLowerCase().endsWith('.gif') || b.blob.type === 'image/gif'
  );
  const uploadedStaticImages = customBgs.filter(
    (b) => !b.name.toLowerCase().endsWith('.gif') && b.blob.type !== 'image/gif'
  );

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-[#121214]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 text-white select-none animate-fade-in font-sans"
    >
      {/* 1. Header: Pure Monochrome Typography */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-300" />
          <span className="text-sm font-semibold tracking-tight text-white/90">
            Phông nền
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition text-xs font-medium cursor-pointer"
          title="Đóng (Esc)"
        >
          <span>Đóng</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Media Type Switcher: Ảnh động (GIF) vs Ảnh tĩnh */}
      <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 mb-3 text-xs">
        <button
          type="button"
          onClick={() => setWallpaperType('gif')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium cursor-pointer text-center ${
            wallpaperType === 'gif'
              ? 'bg-white text-black shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Ảnh động (GIF)
        </button>
        <button
          type="button"
          onClick={() => setWallpaperType('static')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium cursor-pointer text-center ${
            wallpaperType === 'static'
              ? 'bg-white text-black shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Ảnh tĩnh
        </button>
      </div>

      {/* 3. Visual 3-Column Thumbnail Grid */}
      <div className="mb-3 max-h-56 overflow-y-auto pr-0.5">
        {wallpaperType === 'gif' ? (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Default Pixel GIF Backgrounds */}
            {PIXEL_BACKGROUNDS.map((bg) => {
              const url = `${import.meta.env.BASE_URL}${bg.localPath}`;
              const isSelected = mode === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => onSelectMode(bg.id)}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-white scale-[1.02] shadow-lg ring-1 ring-white/20'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                  }`}
                  title={bg.label}
                >
                  <img
                    src={url}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = bg.fallbackUrl;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* User-Uploaded Custom GIFs */}
            {uploadedGifs.map((custom) => {
              const isSelected = mode === 'CUSTOM_WALLPAPER' && customWallpaperUrl === custom.url;
              return (
                <div
                  key={custom.id}
                  onClick={() => {
                    onWallpaperUpdated(custom.url);
                    onSelectMode('CUSTOM_WALLPAPER');
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-white scale-[1.02] shadow-lg ring-1 ring-white/20'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                  }`}
                >
                  <img
                    src={custom.url}
                    alt={custom.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomBg(e, custom.id, custom.url)}
                    className="absolute bottom-1 right-1 p-1 rounded-md bg-black/80 hover:bg-black text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Curated Static Wallpapers */}
            {STATIC_WALLPAPERS.map((wall) => {
              const isSelected = mode === 'CUSTOM_WALLPAPER' && customWallpaperUrl === wall.url;
              return (
                <button
                  key={wall.id}
                  type="button"
                  onClick={() => {
                    onWallpaperUpdated(wall.url);
                    onSelectMode('CUSTOM_WALLPAPER');
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-white scale-[1.02] shadow-lg ring-1 ring-white/20'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                  }`}
                  title={wall.label}
                >
                  <img
                    src={wall.url}
                    alt={wall.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* User-Uploaded Static Images */}
            {uploadedStaticImages.map((custom) => {
              const isSelected = mode === 'CUSTOM_WALLPAPER' && customWallpaperUrl === custom.url;
              return (
                <div
                  key={custom.id}
                  onClick={() => {
                    onWallpaperUpdated(custom.url);
                    onSelectMode('CUSTOM_WALLPAPER');
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-white scale-[1.02] shadow-lg ring-1 ring-white/20'
                      : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                  }`}
                >
                  <img
                    src={custom.url}
                    alt={custom.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomBg(e, custom.id, custom.url)}
                    className="absolute bottom-1 right-1 p-1 rounded-md bg-black/80 hover:bg-black text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Direct Upload Action Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer mb-2.5"
      >
        <Upload className="w-3.5 h-3.5 text-zinc-300" />
        <span>{isUploading ? 'Đang lưu vào máy...' : 'Tải ảnh tĩnh hoặc GIF từ máy'}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/gif,image/webp,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* 5. Secondary Action Buttons: Tối giản and Dán Link */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2">
          {/* Tối giản */}
          <button
            type="button"
            onClick={() => onSelectMode('DARK_CANVAS')}
            className={`flex items-center justify-center gap-2 p-2 rounded-xl border transition cursor-pointer text-center ${
              mode === 'DARK_CANVAS'
                ? 'bg-white text-black border-white font-medium shadow-sm'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-zinc-300 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="text-xs font-medium">Tối giản</span>
          </button>

          {/* Dán link */}
          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className={`flex items-center justify-center gap-2 p-2 rounded-xl border transition cursor-pointer text-center ${
              showUrlInput
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-zinc-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="text-xs font-medium">Dán link URL</span>
          </button>
        </div>

        {/* Collapsible URL Input Field */}
        {showUrlInput && (
          <form onSubmit={handleApplyUrl} className="flex gap-2 pt-1 animate-fade-in">
            <input
              type="text"
              placeholder="https://... ảnh hoặc GIF"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 font-mono"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 transition disabled:opacity-40 cursor-pointer"
            >
              Áp dụng
            </button>
          </form>
        )}
      </div>

      {/* 6. Center Artwork Options (If Center Artwork is active) */}
      {mode === 'CENTER_ARTWORK' && (
        <div className="space-y-2 pt-2.5 border-t border-white/10 animate-fade-in mt-2.5">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-zinc-300">Hiển thị đĩa album</span>
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

          <div className="py-1">
            <div className="flex items-center justify-between mb-1.5 text-xs text-zinc-300">
              <span>Độ mờ quang học</span>
              <span className="font-mono text-zinc-400 text-[11px]">{artworkBlur}px</span>
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
    </div>
  );
};

export const WallpaperManager = BackdropPopover;
export default BackdropPopover;
