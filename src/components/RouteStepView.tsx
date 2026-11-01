import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import {
  VIETNAM_STATIONS,
  calculateJourneyInfo,
  calculateEstimatedDuration,
  DURATION_OPTIONS,
} from '../data/trainStations';

// Sovereignty Markers: Permanent Vietnam Flag & Sovereignty Labels
export interface SovereigntyMarker {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lng: number;
}

const SOVEREIGNTY_MARKERS: SovereigntyMarker[] = [
  {
    id: 'hoang-sa',
    name: 'Quần đảo Hoàng Sa',
    sub: 'TP. Đà Nẵng · Việt Nam',
    lat: 16.5369,
    lng: 112.0242,
  },
  {
    id: 'truong-sa',
    name: 'Quần đảo Trường Sa',
    sub: 'Tỉnh Khánh Hòa · Việt Nam',
    lat: 8.6433,
    lng: 111.9197,
  },
];

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

const RouteStepViewComponent: React.FC<RouteStepViewProps> = ({
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

  const depStation = useMemo(
    () => (originId ? VIETNAM_STATIONS.find((s) => s.id === originId) || null : null),
    [originId]
  );
  const arrStation = useMemo(
    () => (destinationId ? VIETNAM_STATIONS.find((s) => s.id === destinationId) || null : null),
    [destinationId]
  );

  // Memoize journeyInfo so it NEVER recreates on background timer ticks
  const journeyInfo = useMemo(() => {
    if (!depStation || !arrStation) return null;
    return calculateJourneyInfo(depStation.id, arrStation.id, 0);
  }, [depStation, arrStation]);

  const totalDistance = journeyInfo ? journeyInfo.totalDistance : 0;
  const estimatedDuration = useMemo(
    () => calculateEstimatedDuration(totalDistance),
    [totalDistance]
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const sovereigntyLayerRef = useRef<any>(null);
  const routeLineLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const prevCoordsRef = useRef<[number, number] | null>(null);

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
  const handleStationToggle = useCallback(
    (stationId: string) => {
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
    },
    [originId, destinationId, onSelectRoute, onSelectStation]
  );

  const handleStationToggleRef = useRef(handleStationToggle);
  handleStationToggleRef.current = handleStationToggle;

  const handleSwap = useCallback(() => {
    const prevOrigin = originId;
    const prevDest = destinationId;
    setOriginId(prevDest);
    setDestinationId(prevOrigin);
    if (prevDest && prevOrigin) {
      onSelectRoute?.(prevDest, prevOrigin);
      onSwapStations();
    }
  }, [originId, destinationId, onSelectRoute, onSwapStations]);

  // Determine currently selected target coords for smooth gliding
  const selectedStation = useMemo(() => {
    if (destinationId) return VIETNAM_STATIONS.find((s) => s.id === destinationId) || null;
    if (originId) return VIETNAM_STATIONS.find((s) => s.id === originId) || null;
    return null;
  }, [destinationId, originId]);

  const targetCoords: [number, number] | null = useMemo(() => {
    return selectedStation ? [selectedStation.lat, selectedStation.lng] : null;
  }, [selectedStation]);

  // Smooth camera glide to newly selected station (ZERO remount, ZERO tile tear-down)
  useEffect(() => {
    if (!targetCoords || !mapInstanceRef.current) return;
    if (
      prevCoordsRef.current &&
      prevCoordsRef.current[0] === targetCoords[0] &&
      prevCoordsRef.current[1] === targetCoords[1]
    ) {
      return;
    }
    prevCoordsRef.current = targetCoords;

    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.flyTo(targetCoords, Math.max(currentZoom, 7), {
      animate: true,
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }, [targetCoords]);

  // Helper to render sovereignty markers once
  const renderSovereigntyMarkers = useCallback((sovereigntyGroup: any, L: any) => {
    if (!L || !sovereigntyGroup) return;
    sovereigntyGroup.clearLayers();

    SOVEREIGNTY_MARKERS.forEach((m) => {
      const iconHtml = `
        <div class="relative flex items-center justify-center select-none pointer-events-none">
          <!-- Glowing pulse center pin -->
          <div class="relative flex items-center justify-center">
            <div class="absolute w-5 h-5 rounded-full bg-amber-400/25 animate-ping"></div>
            <div class="w-3.5 h-3.5 rounded-full border-2 border-amber-300 bg-red-600 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.8)]">
              <div class="w-1 h-1 rounded-full bg-amber-200"></div>
            </div>
          </div>

          <!-- Tag Pill -->
          <div class="absolute left-1/2 -top-8 -translate-x-1/2 pointer-events-none z-30">
            <div class="bg-[#0b0c10]/95 backdrop-blur-md text-white border border-amber-400/40 px-2.5 py-1 text-[11px] font-sans font-semibold inline-flex items-center gap-1.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.8)] whitespace-nowrap">
              <span class="text-xs">🇻🇳</span>
              <span class="tracking-wide text-amber-300 font-bold">${m.name}</span>
              <span class="text-[9.5px] text-zinc-400 font-normal">(${m.sub})</span>
            </div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'leaflet-sovereignty-marker',
        iconSize: [0, 0],
      });

      L.marker([m.lat, m.lng], { icon, interactive: false }).addTo(sovereigntyGroup);
    });
  }, []);

  // Update Station Markers and Active Route Polylines (Apple Maps Style Vector Contrast)
  const renderMapContent = useCallback(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !routeLineLayerRef.current || !markersLayerRef.current) return;

    routeLineLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    // 1. Complete North-South railway track from Lạng Sơn to Cà Mau: hairline dashed line
    const allCoords = VIETNAM_STATIONS.map((s) => [s.lat, s.lng]);
    L.polyline(allCoords, {
      color: 'rgba(255, 255, 255, 0.25)',
      weight: 1.5,
      dashArray: '3, 6',
      lineCap: 'round',
      lineJoin: 'round',
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
      marker.on('click', () => handleStationToggleRef.current(station.id));
      marker.addTo(markersLayerRef.current);
    });
  }, [originId, destinationId, journeyInfo]);

  // Leaflet Map Initialization: Runs EXACTLY ONCE on Mount (Empty Dependency Array)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    let resizeObserver: ResizeObserver | null = null;

    const setupMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      const southWest = L.latLng(6.0, 99.0);
      const northEast = L.latLng(25.5, 118.0);
      const bounds = L.latLngBounds(southWest, northEast);

      const map = L.map(mapContainerRef.current, {
        center: [16.0544, 107.5],
        zoom: 6,
        minZoom: 5,
        maxZoom: 18,
        preferCanvas: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        maxBounds: bounds,
        maxBoundsViscosity: 0.65,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          minZoom: 5,
          maxZoom: 18,
          maxNativeZoom: 17,
          updateWhenZooming: false,
          updateWhenIdle: true,
        }
      ).addTo(map);

      L.control
        .attribution({ position: 'bottomright', prefix: 'Esri World Imagery' })
        .addTo(map);

      // Dedicated layers
      const sovereigntyGroup = L.featureGroup().addTo(map);
      const routeGroup = L.featureGroup().addTo(map);
      const markersGroup = L.featureGroup().addTo(map);

      sovereigntyLayerRef.current = sovereigntyGroup;
      routeLineLayerRef.current = routeGroup;
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Draw sovereignty markers once
      renderSovereigntyMarkers(sovereigntyGroup, L);

      // Fix black void tile glitch: invalidate size with RAF and staggered timeouts
      requestAnimationFrame(() => {
        try { map.invalidateSize(); } catch {}
      });
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 150);
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 450);

      try {
        resizeObserver = new ResizeObserver(() => {
          try { map.invalidateSize(); } catch {}
        });
        if (mapContainerRef.current) {
          resizeObserver.observe(mapContainerRef.current);
        }
      } catch {}

      // Initial route rendering
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
  }, []); // Run exactly once on mount!

  // Invalidate Leaflet size immediately when container becomes visible
  useEffect(() => {
    if (isOpen && mapInstanceRef.current) {
      requestAnimationFrame(() => {
        try { mapInstanceRef.current?.invalidateSize(); } catch {}
      });
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch {}
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fit Route: auto recalculate bounds and zoom to frame the journey
  const handleFitRoute = useCallback(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (journeyInfo && journeyInfo.intermediateStations.length >= 2) {
      const activeCoords = journeyInfo.intermediateStations.map((s) => [s.lat, s.lng]);
      const bounds = L.latLngBounds(activeCoords);
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 240],
        maxZoom: 13,
        animate: true,
      });
    } else {
      const allCoords = VIETNAM_STATIONS.map((s) => [s.lat, s.lng]);
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 240],
        maxZoom: 10,
        animate: true,
      });
    }
  }, [journeyInfo]);

  // Re-render route line & station markers when stations change (without remounting map/tiles)
  useEffect(() => {
    renderMapContent();
  }, [renderMapContent]);

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

      {/* 2. Floating Map Zoom & Fit Route Controls */}
      <div className="absolute right-4 sm:right-5 top-4 sm:top-5 z-20 flex flex-col gap-2 items-end">
        {/* Zoom In & Out (+ / -) */}
        <div className="flex flex-col rounded-2xl bg-[#101014]/90 backdrop-blur-xl border border-white/15 p-1 shadow-2xl">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
            title="Phóng to bản đồ (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-4 h-px bg-white/10 mx-auto my-0.5" />
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
            title="Thu nhỏ bản đồ (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fit Route Button ("Khung cảnh toàn tuyến") */}
        <button
          type="button"
          onClick={handleFitRoute}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101014]/90 backdrop-blur-xl border border-white/15 text-xs text-zinc-200 hover:text-white hover:bg-white/10 active:scale-95 transition shadow-2xl cursor-pointer"
          title="Khung cảnh toàn tuyến hành trình"
        >
          <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />
          <span className="font-medium text-[11px]">Toàn tuyến</span>
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                title="Đổi chiều ga đi & ga đến"
              >
                <span>⇄</span>
                <span>Đổi chiều</span>
              </button>
            </div>
          </div>

          {/* Station Cards Horizontal Carousel with Mouse Wheel & Drag Scrolling */}
          <div
            ref={carouselRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            onMouseDown={handleCarouselMouseDown}
            onMouseMove={handleCarouselMouseMove}
            onMouseUp={handleCarouselMouseUp}
            onMouseLeave={handleCarouselMouseUp}
            className="flex items-center gap-2 overflow-x-auto scroll-smooth py-2 px-1 no-scrollbar sm:scrollbar-thin sm:scrollbar-thumb-white/20 sm:scrollbar-track-transparent select-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'thin' }}
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
                  className={`w-28 h-20 rounded-2xl border p-2.5 flex flex-col justify-between shrink-0 snap-center transition-all text-left cursor-pointer ${
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
                      className={`px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
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

export const RouteStepView = React.memo(RouteStepViewComponent);
export default RouteStepView;
