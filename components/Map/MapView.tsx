
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, MapRef, NavigationControl, ViewStateChangeEvent } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { Coordinates, Place, NavigationRoute, MapMode, MapReport, ReportType, MapStyle } from '../../types';
import { MapPin, Siren, CarFront, TriangleAlert, OctagonAlert } from 'lucide-react';
import { MAPBOX_ACCESS_TOKEN } from '../../constants';

interface MapViewProps {
  center: Coordinates;
  places: Place[];
  reports?: MapReport[];
  selectedPlace: Place | null;
  route: NavigationRoute | null;
  previewRoute: NavigationRoute | null;
  mapMode: MapMode;
  mapStyle: MapStyle;
  showTraffic: boolean;
  onSelectPlace: (place: Place) => void;
  recenterTrigger: number;
}

// --- CRITICAL SECURITY FIX ---
// Force immediate assignment of the Worker URL to a string.
// This prevents Mapbox GL JS from attempting to access 'window.location' or 'window.parent.location'
// to auto-resolve the worker path, which triggers a "Blocked a frame with origin" error in sandboxed iframes.
try {
  // @ts-ignore
  mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
  // @ts-ignore
  mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl-csp-worker.js";
} catch (e) {
  console.warn("Mapbox global init warning:", e);
}

const MapView: React.FC<MapViewProps> = ({ 
  center, 
  places,
  reports = [],
  selectedPlace, 
  route, 
  previewRoute,
  mapMode, 
  mapStyle,
  showTraffic, 
  onSelectPlace,
  recenterTrigger
}) => {
  const mapRef = useRef<MapRef>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Performance: Track view bounds to only render visible markers
  const [viewBounds, setViewBounds] = useState<mapboxgl.LngLatBounds | null>(null);
  
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);
  const [hoveredReport, setHoveredReport] = useState<MapReport | null>(null);
  
  // Ref to store the timeout ID for debouncing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- THEME COLORS ---
  // Dynamic coloring based on MapStyle selection
  const isLuxury = mapStyle === MapStyle.NAVPAL || mapStyle === MapStyle.DARK;
  
  const themeColors = {
    // Live Map JSON: Route #1A73E8 (Blue)
    route: isLuxury ? '#a855f7' : '#1A73E8', 
    routeOpacity: isLuxury ? 0.9 : 0.8,
    
    // Live Map JSON: User #34A853 (Green)
    userFill: isLuxury ? 'bg-purple-500' : 'bg-[#34A853]', 
    userRing: isLuxury ? 'bg-purple-400' : 'bg-[#34A853]',
    userPulse: isLuxury ? 'bg-purple-500' : 'bg-[#34A853]',
    
    // Markers
    markerDefault: isLuxury ? 'text-slate-400' : 'text-slate-600',
    markerSelected: isLuxury ? 'text-purple-400' : 'text-[#EA4335]', // Standard Red for pins
  };

  useEffect(() => {
    // Double check to ensure worker is set
    // @ts-ignore
    if (mapboxgl.workerUrl !== "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl-csp-worker.js") {
        // @ts-ignore
        mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl-csp-worker.js";
    }
    setIsMapReady(true);
  }, []);

  // --- CAMERA CONTROL SYSTEM ---

  // 1. Navigation Mode: Strict Tracking
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (mapMode === MapMode.NAVIGATION && route) {
      mapRef.current.easeTo({
        center: [center.lng, center.lat],
        zoom: 18,
        pitch: 60,
        bearing: 0, 
        duration: 1000,
        easing: (t) => t
      });
    } 
  }, [center, mapMode, route]);

  // 2. Selected Place Focus
  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;

    mapRef.current.flyTo({
      center: [selectedPlace.coordinates.lng, selectedPlace.coordinates.lat],
      zoom: 16,
      pitch: 0,
      bearing: 0,
      duration: 2000,
      essential: true
    });
  }, [selectedPlace]);

  // 3. Explore Mode Transition (Reset)
  useEffect(() => {
    if (!mapRef.current) return;

    if (mapMode === MapMode.EXPLORE && !selectedPlace) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        duration: 2500, 
        essential: true
      });
    }
  }, [mapMode, selectedPlace]);

  // 4. Manual Recenter Trigger
  useEffect(() => {
    if (!mapRef.current || recenterTrigger === 0) return;

    mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: 15,
        pitch: 0,
        bearing: 0,
        duration: 1500,
        essential: true
    });
  }, [recenterTrigger, center]);


  // --- OPTIMIZATION: Debounced Bounds Update ---
  const handleMapMove = useCallback((evt: ViewStateChangeEvent) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (evt && evt.target) {
        const bounds = evt.target.getBounds();
        if (bounds) {
          setViewBounds(bounds);
        }
      }
    }, 100); // 100ms debounce
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Initialize bounds on load
  const handleMapLoad = useCallback((evt: any) => {
    if (evt && evt.target) {
      setViewBounds(evt.target.getBounds());
    }
  }, []);

  // --- OPTIMIZATION: Filter Visible Places ---
  const visiblePlaces = useMemo(() => {
    if (!viewBounds || !places) return places || [];
    return places.filter(place => 
      place.coordinates && viewBounds.contains([place.coordinates.lng, place.coordinates.lat])
    );
  }, [places, viewBounds]);


  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case ReportType.POLICE: 
        return (
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-blue-500/50 animate-pulse">
            <Siren className="w-6 h-6 text-white" />
          </div>
        );
      case ReportType.ACCIDENT:
        return (
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-red-500/50">
            <CarFront className="w-6 h-6 text-white" />
          </div>
        );
      case ReportType.HAZARD:
        return (
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-orange-500/50">
            <TriangleAlert className="w-6 h-6 text-white" />
          </div>
        );
      case ReportType.TRAFFIC:
        return (
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-yellow-500/50">
            <OctagonAlert className="w-6 h-6 text-white" />
          </div>
        );
      default: return null;
    }
  };

  if (!isMapReady) {
    return <div className="h-full w-full bg-slate-900 animate-pulse" />;
  }

  return (
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 14
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        attributionControl={false}
        onMove={handleMapMove}
        onLoad={handleMapLoad}
        projection={{ name: 'globe' }}
        fog={isLuxury ? {
           'range': [0.5, 10],
           'color': '#240a4a',
           'horizon-blend': 0.3,
           'high-color': '#1a1d3d',
           'space-color': '#0B0B19',
           'star-intensity': 0.6
        } : {
          'range': [1.0, 10.0],
          'color': 'rgb(255, 255, 255)',
          'horizon-blend': 0.05
        }}
      >
        {/* Controls */}
        <NavigationControl position="bottom-left" showCompass={false} />

        {/* Traffic Layer */}
        {showTraffic && (
          <Source id="mapbox-traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
            <Layer
              id="traffic-layer"
              source-layer="traffic"
              type="line"
              minzoom={10}
              beforeId="road-label" 
              paint={{
                'line-width': [
                  'interpolate', ['linear'], ['zoom'],
                  10, 1.5,
                  15, 3,
                  20, 6
                ],
                'line-color': [
                  'match',
                  ['get', 'congestion'],
                  'low', '#22c55e',      
                  'moderate', '#eab308', 
                  'heavy', '#ef4444',    
                  'severe', '#b91c1c',   
                  'transparent'
                ],
                'line-opacity': 0.8
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
            />
          </Source>
        )}

        {/* Preview Route */}
        {previewRoute && !route && (
          <Source id="preview-route" type="geojson" data={previewRoute.geometry}>
            <Layer
              id="preview-route-line"
              type="line"
              paint={{
                'line-color': isLuxury ? '#94a3b8' : '#9AA0A6',
                'line-width': 4,
                'line-opacity': 0.7,
                'line-dasharray': [2, 2]
              }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            />
          </Source>
        )}

        {/* Active Route */}
        {route && (
          <Source id="active-route" type="geojson" data={route.geometry}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': themeColors.route,
                'line-width': 6,
                'line-opacity': themeColors.routeOpacity
              }}
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            />
          </Source>
        )}

        {/* User Location */}
        <Marker longitude={center.lng} latitude={center.lat} anchor="center">
          <div className="relative flex items-center justify-center w-6 h-6">
             <div className={`absolute w-full h-full rounded-full animate-ping opacity-75 ${themeColors.userPulse}`}></div>
             <div className={`relative w-4 h-4 border-2 border-white rounded-full shadow-lg ${themeColors.userRing} ${themeColors.userFill}`}></div>
          </div>
        </Marker>

        {/* Reports */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            longitude={report.coordinates.lng}
            latitude={report.coordinates.lat}
            anchor="center"
          >
            <div
              className="cursor-pointer hover:scale-110 transition-transform"
              onMouseEnter={() => setHoveredReport(report)}
              onMouseLeave={() => setHoveredReport(null)}
            >
              {getReportIcon(report.type)}
            </div>
          </Marker>
        ))}

        {/* Places (Filtered by Bounds) */}
        {visiblePlaces.map((place) => (
          <Marker 
            key={place.id}
            longitude={place.coordinates.lng} 
            latitude={place.coordinates.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectPlace(place);
            }}
          >
            <div 
              className="cursor-pointer group relative transition-transform duration-200 ease-out hover:scale-125"
              onMouseEnter={() => setHoveredPlace(place)}
              onMouseLeave={() => setHoveredPlace(null)}
            >
               <MapPin className={`w-8 h-8 drop-shadow-lg ${selectedPlace?.id === place.id ? themeColors.markerSelected + ' fill-current' : themeColors.markerDefault + ' fill-current group-hover:' + themeColors.markerSelected}`} />
            </div>
          </Marker>
        ))}

        {/* Place Tooltip */}
        {hoveredPlace && (
          <Popup
            longitude={hoveredPlace.coordinates.lng}
            latitude={hoveredPlace.coordinates.lat}
            offset={30}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            className="z-50"
          >
            <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap">
              {hoveredPlace.name}
            </div>
          </Popup>
        )}

        {/* Report Tooltip */}
        {hoveredReport && (
          <Popup
            longitude={hoveredReport.coordinates.lng}
            latitude={hoveredReport.coordinates.lat}
            offset={30}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            className="z-50"
          >
            <div className="bg-red-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl border border-red-500/30 whitespace-nowrap">
              Reported: {hoveredReport.type}
            </div>
          </Popup>
        )}

      </Map>
    </div>
  );
};

export default MapView;
