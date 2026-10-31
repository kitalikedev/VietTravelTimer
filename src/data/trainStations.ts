export interface Station {
  id: string;
  name: string;
  code: string;
  region: 'Bắc' | 'Trung' | 'Nam';
  km: number;
  lat: number;
  lng: number;
}

export interface StationMapCoord {
  x: number;
  y: number;
}

export const STATION_MAP_COORDS: Record<string, StationMapCoord> = {
  hn: { x: 105, y: 55 },
  nb: { x: 115, y: 100 },
  vinh: { x: 102, y: 155 },
  hue: { x: 130, y: 220 },
  dn: { x: 150, y: 260 },
  qn: { x: 172, y: 325 },
  nt: { x: 175, y: 385 },
  pt: { x: 150, y: 435 },
  sg: { x: 120, y: 470 },
};

export interface StationPercentCoord {
  top: string;
  left: string;
  topNum: number;
  leftNum: number;
}

export const STATION_COORDINATES: Record<string, StationPercentCoord> = {
  hn: { top: '15.5%', left: '46.0%', topNum: 15.5, leftNum: 46.0 },
  phl: { top: '18.2%', left: '47.2%', topNum: 18.2, leftNum: 47.2 },
  ndi: { top: '20.0%', left: '48.5%', topNum: 20.0, leftNum: 48.5 },
  nb: { top: '22.4%', left: '48.0%', topNum: 22.4, leftNum: 48.0 },
  tha: { top: '25.6%', left: '46.5%', topNum: 25.6, leftNum: 46.5 },
  vin: { top: '31.0%', left: '44.8%', topNum: 31.0, leftNum: 44.8 },
  dho: { top: '38.5%', left: '50.2%', topNum: 38.5, leftNum: 50.2 },
  dha: { top: '42.0%', left: '53.0%', topNum: 42.0, leftNum: 53.0 },
  hue: { top: '44.8%', left: '55.5%', topNum: 44.8, leftNum: 55.5 },
  dn: { top: '48.5%', left: '58.2%', topNum: 48.5, leftNum: 58.2 },
  tky: { top: '52.0%', left: '60.5%', topNum: 52.0, leftNum: 60.5 },
  qng: { top: '55.2%', left: '62.2%', topNum: 55.2, leftNum: 62.2 },
  qn: { top: '61.5%', left: '64.5%', topNum: 61.5, leftNum: 64.5 },
  tho: { top: '65.2%', left: '65.8%', topNum: 65.2, leftNum: 65.8 },
  nt: { top: '68.8%', left: '66.2%', topNum: 68.8, leftNum: 66.2 },
  pt: { top: '75.8%', left: '61.5%', topNum: 75.8, leftNum: 61.5 },
  bho: { top: '79.2%', left: '57.0%', topNum: 79.2, leftNum: 57.0 },
  sg: { top: '81.0%', left: '55.8%', topNum: 81.0, leftNum: 55.8 },
};

export const UNIVERSAL_FOCUS_INTENTS = [
  'Làm việc',
  'Học tập',
  'Đọc sách',
  'Sáng tạo',
  'Tập trung sâu',
];

export const TYPOGRAPHIC_FOCUS_INTENTS = UNIVERSAL_FOCUS_INTENTS;

export interface CarriageBerth {
  id: string; // "01", "02", ... "28"
  number: number;
  compartment: number; // 1 to 7
  level: 'lower' | 'upper';
  isOccupied: boolean;
}

export const CARRIAGE_BERTHS: CarriageBerth[] = Array.from({ length: 28 }, (_, i) => {
  const number = i + 1;
  const compartment = Math.floor(i / 4) + 1;
  const posInComp = i % 4;
  const level: 'lower' | 'upper' = posInComp < 2 ? 'lower' : 'upper';
  const occupiedSet = new Set([1, 4, 6, 11, 14, 18, 21, 26]);
  return {
    id: String(number).padStart(2, '0'),
    number,
    compartment,
    level,
    isOccupied: occupiedSet.has(number),
  };
});

export const VIETNAM_STATIONS: Station[] = [
  { id: 'hn', name: 'Hà Nội', code: 'HAN', region: 'Bắc', km: 0, lat: 21.0245, lng: 105.8412 },
  { id: 'phl', name: 'Phủ Lý', code: 'PHL', region: 'Bắc', km: 56, lat: 20.5408, lng: 105.9189 },
  { id: 'ndi', name: 'Nam Định', code: 'NDI', region: 'Bắc', km: 87, lat: 20.4339, lng: 106.1789 },
  { id: 'nb', name: 'Ninh Bình', code: 'NBI', region: 'Bắc', km: 115, lat: 20.2522, lng: 105.9744 },
  { id: 'tha', name: 'Thanh Hóa', code: 'THA', region: 'Bắc', km: 176, lat: 19.8067, lng: 105.7761 },
  { id: 'vin', name: 'Vinh', code: 'VIN', region: 'Bắc', km: 319, lat: 18.6796, lng: 105.6813 },
  { id: 'dho', name: 'Đồng Hới', code: 'DHO', region: 'Trung', km: 522, lat: 17.4722, lng: 106.5989 },
  { id: 'dha', name: 'Đông Hà', code: 'DHA', region: 'Trung', km: 622, lat: 16.8167, lng: 107.1000 },
  { id: 'hue', name: 'Huế', code: 'HUE', region: 'Trung', km: 688, lat: 16.4637, lng: 107.5909 },
  { id: 'dn', name: 'Đà Nẵng', code: 'DAN', region: 'Trung', km: 791, lat: 16.0678, lng: 108.2208 },
  { id: 'tky', name: 'Tam Kỳ', code: 'TKY', region: 'Trung', km: 865, lat: 15.5683, lng: 108.4811 },
  { id: 'qng', name: 'Quảng Ngãi', code: 'QNG', region: 'Trung', km: 928, lat: 15.1206, lng: 108.7922 },
  { id: 'qn', name: 'Quy Nhơn (Diêu Trì)', code: 'QNH', region: 'Trung', km: 1096, lat: 13.7830, lng: 109.2197 },
  { id: 'tho', name: 'Tuy Hòa', code: 'THO', region: 'Trung', km: 1198, lat: 13.0883, lng: 109.3083 },
  { id: 'nt', name: 'Nha Trang', code: 'NTR', region: 'Trung', km: 1315, lat: 12.2451, lng: 109.1867 },
  { id: 'pt', name: 'Phan Thiết', code: 'PTH', region: 'Nam', km: 1551, lat: 10.9333, lng: 108.1000 },
  { id: 'bho', name: 'Biên Hòa', code: 'BHO', region: 'Nam', km: 1697, lat: 10.9572, lng: 106.8208 },
  { id: 'sg', name: 'Sài Gòn', code: 'SGO', region: 'Nam', km: 1726, lat: 10.7828, lng: 106.6781 },
];

export function calculateEstimatedDuration(distanceKm: number): { minutes: number; formatted: string } {
  const clamped = Math.max(30, distanceKm);
  const minutes = Math.min(180, Math.max(25, Math.round((clamped / 1726) * 155 + 25)));
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const formatted = hrs > 0 ? (mins > 0 ? `${hrs}h${String(mins).padStart(2, '0')}m` : `${hrs}h00m`) : `${mins}m`;
  return { minutes, formatted };
}

export function getDefaultDurationForDistance(distanceKm: number): number {
  if (distanceKm < 150) return 25;
  if (distanceKm < 500) return 45;
  if (distanceKm < 1000) return 60;
  return 90;
}

export interface DurationPreset {
  minutes: number;
  label: string;
  sub: string;
}

export const DURATION_OPTIONS: DurationPreset[] = [
  { minutes: 25, label: '25 phút', sub: 'Sprint' },
  { minutes: 45, label: '45 phút', sub: 'Deep Work' },
  { minutes: 60, label: '60 phút', sub: 'Intensive' },
  { minutes: 90, label: '90 phút', sub: 'Marathon' },
  { minutes: 120, label: '120 phút', sub: 'Cross-Country' },
];

export interface TrainJourneyState {
  departureId: string;
  arrivalId: string;
}

const STORAGE_KEY = 'ytlyrics_train_journey';

export function getStoredTrainJourney(): TrainJourneyState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        if (parsed.departureId === 'vinh') parsed.departureId = 'vin';
        if (parsed.arrivalId === 'vinh') parsed.arrivalId = 'vin';
        if (
          parsed.departureId &&
          parsed.arrivalId &&
          parsed.departureId !== parsed.arrivalId &&
          VIETNAM_STATIONS.some((s) => s.id === parsed.departureId) &&
          VIETNAM_STATIONS.some((s) => s.id === parsed.arrivalId)
        ) {
          return parsed;
        }
      }
    }
  } catch {}
  return {
    departureId: 'hn',
    arrivalId: 'dn',
  };
}

export function saveTrainJourney(state: TrainJourneyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function calculateJourneyInfo(departureId: string, arrivalId: string, progressPercent: number) {
  const depStation = VIETNAM_STATIONS.find((s) => s.id === departureId) || VIETNAM_STATIONS[0];
  const arrStation = VIETNAM_STATIONS.find((s) => s.id === arrivalId) || VIETNAM_STATIONS[VIETNAM_STATIONS.length - 1];

  const totalDistance = Math.abs(arrStation.km - depStation.km);
  const isSouthbound = arrStation.km >= depStation.km;

  // Traveled km
  const currentTraveledKm = Math.round((progressPercent / 100) * totalDistance);
  const remainingKm = Math.max(0, totalDistance - currentTraveledKm);

  // Current location km
  const currentKm = isSouthbound
    ? depStation.km + currentTraveledKm
    : depStation.km - currentTraveledKm;

  // Find intermediate stations
  const intermediateStations = VIETNAM_STATIONS.filter((s) => {
    if (isSouthbound) {
      return s.km >= depStation.km && s.km <= arrStation.km;
    }
    return s.km <= depStation.km && s.km >= arrStation.km;
  });

  if (!isSouthbound) {
    intermediateStations.reverse();
  }

  // Find next station
  let nextStation = arrStation;
  for (const s of intermediateStations) {
    const passed = isSouthbound ? currentKm >= s.km : currentKm <= s.km;
    if (!passed) {
      nextStation = s;
      break;
    }
  }

  return {
    depStation,
    arrStation,
    totalDistance,
    currentTraveledKm,
    remainingKm,
    currentKm,
    nextStation,
    intermediateStations,
    isSouthbound,
    trainCode: isSouthbound ? 'SE1 Thống Nhất' : 'SE2 Thống Nhất',
  };
}
