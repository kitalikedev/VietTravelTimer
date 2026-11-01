import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import {
  VIETNAM_STATIONS,
  calculateJourneyInfo,
  calculateEstimatedDuration,
  DURATION_OPTIONS,
} from '../data/trainStations';

interface RouteStepViewProps {
  isOpen?: boolean;
  departureId: string;
  arrivalId: string;
  durationMinutes: number;
  onSelectDuration: (minutes: number) => void;
  onSelectStation: (id: string) => void;
  onSelectRoute?: (departureId: string, arrivalId: string) => void;
  onSwapStations: () => void;
  onConfirm: () => void;
}

export const RouteStepView: React.FC<RouteStepViewProps> = ({
  isOpen = true,
  departureId,
  arrivalId,
  durationMinutes,
  onSelectDuration,
  onSelectStation,
  onSelectRoute,
  onSwapStations,
  onConfirm,
}) => {
  // A. Two-Way Toggle Selection & Deselection Logic
  const [originId, setOriginId] = useState<string | null>(departureId || 'hn');
  const [destinationId, setDestinationId] = useState<string | null>(arrivalId || 'dn');

  // Synchronize when external props change
  useEffect(() => {
    if (departureId) setOriginId(departureId);
    if (arrivalId) setDestinationId(arrivalId);
  }, [departureId, arrivalId]);

  const depStation = originId ? VIETNAM_STATIONS.find((s) => s.id === originId) || null : null;
  const arrStation = destinationId ? VIETNAM_STATIONS.find((s) => s.id === destinationId) || null : null;

  const journeyInfo =
    depStation && arrStation
      ? calculateJourneyInfo(depStation.id, arrStation.id, 0)
      : null;

  const totalDistance = journeyInfo ? journeyInfo.totalDistance : 0;
  const estimatedDuration = calculateEstimatedDuration(totalDistance);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLineLayerRef = useRef<any>(null);

  // Carousel Drag-To-Scroll & Auto-Scroll State
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isDraggingCarouselRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll tile into center of viewport when destinationId changes
  useEffect(() => {
    const targetId = destinationId || originId;
    if (targetId && tileRefs.current[targetId]) {
      tileRefs.current[targetId]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [destinationId, originId]);

  // Two-way toggle click logic
  const handleStationToggle = (stationId: string) => {
    let nextOrigin = originId;
    let nextDest = destinationId;

    if (stationId === originId) {
      nextOrigin = null;
      setOriginId(null);
    } else if (stationId === destinationId) {
      nextDest = null;
      setDestinationId(null);
    } else {
      if (originId === null) {
        nextOrigin = stationId;
        setOriginId(stationId);
      } else if (destinationId === null) {
        nextDest = stationId;
        setDestinationId(stationId);
      } else {
        nextDest = stationId;
        setDestinationId(stationId);
      }
    }

    if (nextOrigin && nextDest) {
      onSelectRoute?.(nextOrigin, nextDest);
      onSelectStation(nextDest);
    }
  };

  const handleSwap = () => {
    const prevOrigin = originId;
    const prevDest = destinationId;
    setOriginId(prevDest);
    setDestinationId(prevOrigin);
    if (prevDest && prevOrigin) {
      onSelectRoute?.(prevDest, prevOrigin);
      onSwapStations();
    }
  };

  // Leaflet Map Initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    let resizeObserver: ResizeObserver | null = null;

    const setupMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      const southWest = L.latLng(7.0, 101.0);
      const northEast = L.latLng(24.5, 114.5);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 107.5],
        zoom: 6,
        minZoom: 5,
        maxZoom: 12,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
        }
      ).addTo(map);

      L.control
        .attribution({ position: 'bottomright', prefix: 'Esri World Imagery' })
        .addTo(map);

      const routeGroup = L.featureGroup().addTo(map);
      const markersGroup = L.featureGroup().addTo(map);

      routeLineLayerRef.current = routeGroup;
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 100);
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 400);

      try {
        resizeObserver = new ResizeObserver(() => {
          try { map.invalidateSize(); } catch {}
        });
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }
      } catch {}

      renderMapContent();
    };

    if ((window as any).L) {
      setupMap();
    } else {
      if (!document.getElementById('leaflet-cdn-script')) {
        const script = document.createElement('script');
        script.id = 'leaflet-cdn-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => {
          if (isSubscribed) setupMap();
        };
        document.head.appendChild(script);
      }

      const timer = setInterval(() => {
        if ((window as any).L) {
          clearInterval(timer);
          if (isSubscribed) setupMap();
        }
      }, 50);
      return () => {
        clearInterval(timer);
        isSubscribed = false;
        if (resizeObserver) resizeObserver.disconnect();
      };
    }

    return () => {
      isSubscribed = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate Leaflet size immediately when container becomes visible
  useEffect(() => {
    if (isOpen && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch {}
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Update Markers and Route Polylines (Apple Maps Style Vector Contrast)
  const renderMapContent = useCallback(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !routeLineLayerRef.current || !markersLayerRef.current) return;

    routeLineLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    // 1. Complete North-South railway track: hairline dashed line
    const allCoords = VIETNAM_STATIONS.map((s) => [s.lat, s.lng]);
    L.polyline(allCoords, {
      color: 'rgba(255, 255, 255, 0.25)',
      weight: 1.5,
      dashArray: '3, 6',
    }).addTo(routeLineLayerRef.current);

    // 2. Active route polyline: Crisp solid white line (stroke-width: 2.5, opacity: 0.95)
    if (journeyInfo && journeyInfo.intermediateStations.length >= 2) {
      const activeCoords = journeyInfo.intermediateStations.map((s) => [s.lat, s.lng]);
      L.polyline(activeCoords, {
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLineLayerRef.current);
    }

    // 3. Station Markers & Apple Maps Style Badges
    VIETNAM_STATIONS.forEach((station, index) => {
      const isOrigin = station.id === originId;
      const isDestination = station.id === destinationId;

      const isOdd = index % 2 === 1;
      const labelOffsetClass = isOdd
        ? 'translate-x-3.5 -translate-y-1/2 text-left'
        : '-translate-x-[calc(100%+14px)] -translate-y-1/2 text-right';

      let markerHtml = '';

      if (isOrigin) {
        // Origin Node: Crisp solid white node + Apple tag
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer select-none">
            <div class="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center bg-black shadow-[0_0_12px_rgba(255,255,255,0.6)]">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>

            <div class="absolute left-0 top-0 ${labelOffsetClass} pointer-events-none z-30">
              <span class="bg-[#0f1015]/95 backdrop-blur-md text-white border border-white/20 px-3 py-1 text-[11px] font-sans font-medium inline-flex items-center gap-1.5 rounded-full shadow-2xl whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>Xuất phát: <strong class="text-white">${station.name}</strong> (${station.code})</span>
              </span>
            </div>
          </div>
        `;
      } else if (isDestination) {
        // Destination Node: Solid Amber dot with outer ring + Apple tag
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer select-none">
            <div class="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(251,191,36,0.6)]">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
            </div>

            <div class="absolute left-0 top-0 ${labelOffsetClass} pointer-events-none z-30">
              <span class="bg-[#0f1015]/95 backdrop-blur-md text-amber-300 border border-amber-400/40 px-3 py-1 text-[11px] font-sans font-medium inline-flex items-center gap-1.5 rounded-full shadow-2xl whitespace-nowrap">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Đích đến: <strong class="text-amber-200">${station.name}</strong> (${station.code})</span>
              </span>
            </div>
          </div>
        `;
      } else {
        // Normal Station: Minimalist dot + Province Label
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer select-none group">
            <div class="w-2 h-2 rounded-full border border-white/40 bg-zinc-900 group-hover:bg-white group-hover:border-white transition-colors"></div>

            <div class="absolute left-0 top-0 ${labelOffsetClass} pointer-events-none z-20">
              <span class="font-sans font-medium text-[11px] text-zinc-300 group-hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                ${station.name}
              </span>
            </div>
          </div>
        `;
      }

      const icon = L.divIcon({
        html: markerHtml,
        className: 'leaflet-station-marker',
        iconSize: [0, 0],
      });

      const marker = L.marker([station.lat, station.lng], { icon });
      marker.on('click', () => handleStationToggle(station.id));
      marker.addTo(markersLayerRef.current);
    });
  }, [originId, destinationId, journeyInfo]);

  useEffect(() => {
    renderMapContent();
  }, [renderMapContent]);

  // Smooth route framing in viewport above the floating dock
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L || !journeyInfo) return;

    if (journeyInfo.intermediateStations.length >= 2) {
      const coords = journeyInfo.intermediateStations.map((s) => [s.lat, s.lng]);
      try {
        map.fitBounds(L.latLngBounds(coords), {
          paddingTopLeft: [70, 50],
          paddingBottomRight: [50, 260],
          maxZoom: 7,
          animate: true,
        });
      } catch {}
    }
  }, [journeyInfo]);

  // Carousel mouse-drag handlers
  const handleCarouselMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDraggingCarouselRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.pageX - carouselRef.current.offsetLeft;
    dragScrollLeftRef.current = carouselRef.current.scrollLeft;
  };

  const handleCarouselMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCarouselRef.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    carouselRef.current.scrollLeft = dragScrollLeftRef.current - walk;
  };

  const handleCarouselMouseUp = () => {
    isDraggingCarouselRef.current = false;
  };

  const isRouteReady = !!originId && !!destinationId;

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-[#09090b] text-white select-none">
      {/* 1. Photorealistic Esri Satellite Leaflet Canvas (Full Bleed) */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-[1] bg-[#09090b]"
        style={{
          filter: 'contrast(1.08) brightness(0.92) saturate(1.1)',
        }}
      />

      {/* 2. Apple Design Floating Zoom Pill (Top Right) */}
      <div className="absolute right-5 top-5 z-20 flex flex-col rounded-full bg-[#101014]/80 backdrop-blur-xl border border-white/10 p-1 shadow-2xl">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition"
          title="Phóng to bản đồ"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-4 h-px bg-white/10 mx-auto my-0.5" />
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition"
          title="Thu nhỏ bản đồ"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Soft Ambient Upward Fade (Ensures map flows underneath while dock is legible) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10"
        aria-hidden="true"
      />

      {/* 4. Floating Glass Control Island (Apple Design / Awwwards Standard) */}
      <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-20 flex justify-center px-3 sm:px-6 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-4xl rounded-3xl bg-[#0c0d12]/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-4 sm:p-5 flex flex-col gap-3">
          {/* Header row: Route Summary & Distance */}
          <div className="flex items-center justify-between px-1 text-xs font-sans">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {depStation?.name || 'Chọn ga đi'}
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                ({depStation?.code || '—'})
              </span>
              <span className="text-zinc-500">→</span>
              <span className="font-semibold text-amber-300">
                {arrStation?.name || 'Chọn ga đến'}
              </span>
              <span className="text-amber-400/80 font-mono text-[11px]">
                ({arrStation?.code || '—'})
              </span>
              {totalDistance > 0 && (
                <span className="ml-2 text-zinc-400 font-mono text-[11px] hidden sm:inline">
                  · {totalDistance} km
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {totalDistance > 0 && (
                <span className="text-zinc-400 text-[11px] hidden md:inline">
                  Gợi ý: <strong className="text-zinc-200">{estimatedDuration.formatted}</strong> tập trung
                </span>
              )}
              <button
                type="button"
                onClick={handleSwap}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition"
                title="Đổi chiều ga đi & ga đến"
              >
                <span>⇄</span>
                <span>Đổi chiều</span>
              </button>
            </div>
          </div>

          {/* Station Cards Carousel */}
          <div
            ref={carouselRef}
            onMouseDown={handleCarouselMouseDown}
            onMouseMove={handleCarouselMouseMove}
            onMouseUp={handleCarouselMouseUp}
            onMouseLeave={handleCarouselMouseUp}
            className="w-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar flex gap-2.5 py-1 cursor-grab active:cursor-grabbing select-none"
          >
            {VIETNAM_STATIONS.map((station) => {
              const isOrigin = station.id === originId;
              const isDestination = station.id === destinationId;
              const deltaKm = depStation ? Math.abs(station.km - depStation.km) : station.km;

              return (
                <button
                  key={station.id}
                  ref={(el) => {
                    tileRefs.current[station.id] = el;
                  }}
                  type="button"
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    handleStationToggle(station.id);
                  }}
                  className={`w-28 h-20 rounded-2xl border p-2.5 flex flex-col justify-between shrink-0 snap-center transition-all text-left ${
                    isDestination
                      ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] font-semibold scale-[1.02]'
                      : isOrigin
                      ? 'bg-white/15 text-white border-2 border-white shadow-lg backdrop-blur-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/25 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono text-xs ${
                        isDestination ? 'text-black font-extrabold' : 'text-white font-bold'
                      }`}
                    >
                      {station.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isDestination ? 'text-black/70 font-semibold' : 'text-zinc-500'
                      }`}
                    >
                      {station.km} km
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-[11px] truncate font-sans ${
                        isDestination ? 'text-black font-bold' : 'text-zinc-200 font-medium'
                      }`}
                    >
                      {station.name}
                    </div>
                    <div
                      className={`text-[10px] font-sans ${
                        isDestination
                          ? 'text-black/80 font-bold'
                          : isOrigin
                          ? 'text-zinc-300 font-medium'
                          : 'text-zinc-500 font-mono'
                      }`}
                    >
                      {isOrigin ? 'Xuất phát' : isDestination ? 'Đích đến' : `+${deltaKm} km`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Duration Selector & Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/10">
            {/* Duration Segmented Pills */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans text-zinc-400 hidden lg:inline">
                Thời lượng:
              </span>
              <div className="bg-white/[0.05] border border-white/10 rounded-full p-1 flex items-center gap-1">
                {DURATION_OPTIONS.map((opt) => {
                  const isActive = durationMinutes === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => onSelectDuration(opt.minutes)}
                      className={`px-3 py-1 rounded-full text-xs font-sans transition-all ${
                        isActive
                          ? 'bg-white text-black font-semibold shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={!isRouteReady}
              onClick={() => {
                if (!isRouteReady) return;
                if (originId && destinationId) {
                  onSelectRoute?.(originId, destinationId);
                }
                onConfirm();
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-sans font-semibold transition-all ${
                isRouteReady
                  ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-zinc-500 border border-white/10 cursor-not-allowed opacity-40'
              }`}
            >
              <span>Chọn khoang & giường</span>
              <span className="text-zinc-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteStepView;
