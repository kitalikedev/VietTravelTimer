export type BackdropMode =
  | 'PIXEL_1'
  | 'PIXEL_2'
  | 'PIXEL_3'
  | 'DARK_CANVAS'
  | 'CUSTOM_WALLPAPER'
  | 'CENTER_ARTWORK'
  | 'POV_VIDEO';

export interface PixelBackgroundConfig {
  id: BackdropMode;
  label: string;
  sub: string;
  localPath: string;
  fallbackUrl: string;
}

export interface StaticWallpaperConfig {
  id: string;
  label: string;
  sub: string;
  url: string;
}

export const PIXEL_BACKGROUNDS: PixelBackgroundConfig[] = [
  {
    id: 'PIXEL_1',
    label: 'Tàu Pixel 1 - Bình Minh',
    sub: 'Đón bình minh rực rỡ qua cung đèo Hải Vân',
    localPath: 'backgrounds/pixel-1.gif',
    fallbackUrl: 'https://raw.githubusercontent.com/i-m-akshat/i-m-akshat/main/Train.gif',
  },
  {
    id: 'PIXEL_2',
    label: 'Tàu Pixel 2 - Hoàng Hôn',
    sub: 'Chiều hoàng hôn buông vàng trên vịnh Lăng Cô',
    localPath: 'backgrounds/pixel-2.gif',
    fallbackUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'PIXEL_3',
    label: 'Tàu Pixel 3 - Đêm Mưa',
    sub: 'Mưa đêm êm dịu gõ nhẹ cửa sổ toa tàu',
    localPath: 'backgrounds/pixel-3.gif',
    fallbackUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
  },
];

export const STATIC_WALLPAPERS: StaticWallpaperConfig[] = [
  {
    id: 'scenic-train-window',
    label: 'Cửa sổ toa tàu hoàng hôn',
    sub: 'Ánh chiều tà ấm áp bên khung cửa sổ',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'misty-railway',
    label: 'Đường sắt sương mù',
    sub: 'Cung đường sắt xuyên qua cánh rừng yên ả',
    url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'coastal-journey',
    label: 'Vịnh biển & Đèo Hải Vân',
    sub: 'Biển xanh ngát trải dài tít tắp',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'mountain-valley',
    label: 'Thung lũng mây Tây Bắc',
    sub: 'Sương sớm vờn quanh triền núi điệp trùng',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'coffee-window',
    label: 'Trạm dừng chân hoài niệm',
    sub: 'Cà phê ấm nóng chờ chuyến tàu kế tiếp',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'starry-night',
    label: 'Toa tàu đêm ngắm sao',
    sub: 'Bầu trời đêm huyền ảo và tĩnh lặng',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80',
  },
];

export function getBackgroundAssetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
