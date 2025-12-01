
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, Pressable, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Coordinates, Place, MapMode, User, NavigationRoute, ReportType, MapReport, AppView, MapStyle } from './types';
import { DEFAULT_LOCATION } from './constants';
import { queryNavPalAI } from './services/gemini';
import { LiveAudioService } from './services/live';
import { getDirections } from './services/mapbox';
import { getCurrentUser, logoutUser, updateUserProfile } from './services/auth';
import { supabase } from './services/supabase';
import { fetchReports, createReport, subscribeToReports } from './services/database';
import MapWrapper from './components/Map/MapWrapper';
import OmniBar from './components/Search/OmniBar';
import SearchResults from './components/Search/SearchResults';
import LocationCard from './components/Sidebar/LocationCard';
import AuthScreen from './components/Auth/AuthScreen';
import DirectionCard from './components/Navigation/DirectionCard';
import RouteOverview from './components/Navigation/RouteOverview';
import SplashScreen from './components/UI/SplashScreen';
import ReportMenu from './components/Navigation/ReportMenu';
import BottomBar from './components/UI/BottomBar';
import ProfileModal from './components/Profile/ProfileModal';
import MapToolbar from './components/Map/MapToolbar';
import OrbitalAssistant from './components/AI/OrbitalAssistant';

// Helper to calculate distance between two points in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function App() {
  // --- State ---
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null); // Speed in m/s
  const [places, setPlaces] = useState<Place[]>([]);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [previewRoute, setPreviewRoute] = useState<NavigationRoute | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapMode, setMapMode] = useState<MapMode>(MapMode.EXPLORE);
  const [appView, setAppView] = useState<AppView>(AppView.MAP);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  // Set default style to the new custom Luxury theme
  const [mapStyle, setMapStyle] = useState<MapStyle>(MapStyle.NAVPAL);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Reporting State
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [reportLocation, setReportLocation] = useState<Coordinates | null>(null); // Where the report is happening

  const [showRouteList, setShowRouteList] = useState(false);

  // Trigger to force map recenter
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Preferences
  const [showSpeedLimit, setShowSpeedLimit] = useState(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Navigation Metrics & Alerts
  const [navMetrics, setNavMetrics] = useState({ remainingDist: 0, remainingTime: 0 });
  const [hasAlertedNearDestination, setHasAlertedNearDestination] = useState(false);

  // --- Live Audio State ---
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const liveServiceRef = useRef<LiveAudioService | null>(null);

  // --- Initialization ---
  useEffect(() => {
    // Splash Screen Timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    // Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    // Load Reports and Subscribe to Real-time Updates
    fetchReports().then(setReports);

    const reportsSubscription = subscribeToReports((newReport) => {
      setReports((prev) => {
        // Deduplicate: Avoid adding if we created it locally already (by matching content roughly or handling sync)
        if (prev.some(r => r.id === newReport.id)) return prev;
        return [newReport, ...prev];
      });
    });

    return () => {
      clearTimeout(splashTimer);
      authListener.subscription.unsubscribe();
      reportsSubscription.unsubscribe();
    };
  }, []);

  // Real-time GPS Tracking using expo-location
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission not granted');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 10,
          },
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            // speed is in meters per second
            setCurrentSpeed(position.coords.speed);
          }
        );
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };

    startLocationTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // --- Voice System ---
  const speak = useCallback((text: string) => {
    if (isLiveSessionActive || isVoiceMuted) return;

    Speech.speak(text, {
      rate: 1.1,
      pitch: 1.0,
    });
  }, [isLiveSessionActive, isVoiceMuted]);


  // --- Live API Control (MyPal) ---
  const toggleLiveSession = useCallback(async () => {
    if (isLiveSessionActive) {
      // Stop Session
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
        liveServiceRef.current = null;
      }
      setIsLiveSessionActive(false);
      setAiState('idle');
    } else {
      // Start Session
      try {
        const service = new LiveAudioService();

        // Hook up state changes
        service.onStateChange = (state) => setAiState(state);
        service.onDisconnect = () => {
          setIsLiveSessionActive(false);
          setAiState('idle');
        };

        // Optional: Handle AI Actions (Map Control) here via Tool Calling in future

        await service.connect();
        liveServiceRef.current = service;
        setIsLiveSessionActive(true);
      } catch (err) {
        console.error("Failed to start Live Session:", err);
        alert("Could not connect to MyPal. Please check microphone permissions.");
      }
    }
  }, [isLiveSessionActive]);

  // --- Wake Word Detection (Hey MyPal) ---
  // NOTE: Speech recognition is not available in React Native without third-party libraries
  // This feature is disabled for mobile. Consider using a library like react-native-voice if needed.
  useEffect(() => {
    // Wake word detection disabled on mobile
    console.log('Wake word detection not available on React Native');
  }, []);

  // Cleanup Live Session on unmount
  useEffect(() => {
    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
      }
    };
  }, []);

  // --- Preferences Handlers ---
  const handleToggleSpeedLimit = async () => {
    const newValue = !showSpeedLimit;
    setShowSpeedLimit(newValue);
    await AsyncStorage.setItem('navpal_pref_speed_limit', String(newValue));
  };

  const handleUpdateUser = async (name: string) => {
    if (user) {
      // Optimistic update
      setUser({ ...user, name });
      try {
        // Persist to Supabase
        await updateUserProfile(name);
      } catch (e) {
        console.error("Failed to persist user profile update:", e);
      }
    }
  };

  const handleClearHistory = async () => {
    // History cleared locally
    // Example: Clear search history if it were stored
    // await AsyncStorage.removeItem('navpal_history');
    speak("Search history cleared.");
    // Visual confirmation could be a toast, but speak covers it for now
  };

  // --- Navigation Logic ---

  // 1. Metric Calculation & Arrival Alerts
  useEffect(() => {
    if (route && mapMode === MapMode.NAVIGATION) {
      let dist = 0;
      let time = 0;
      for (let i = currentStepIndex; i < route.steps.length; i++) {
        dist += route.steps[i].distance;
        time += route.steps[i].duration;
      }
      setNavMetrics({ remainingDist: dist, remainingTime: time });

      // NEAR DESTINATION ALERT
      if (time < 180 && dist < 2000 && dist > 50 && !hasAlertedNearDestination) {
        speak("You are arriving shortly.");
        setHasAlertedNearDestination(true);
      }
    }
  }, [route, currentStepIndex, mapMode, hasAlertedNearDestination, speak]);

  // 2. End Navigation Handler (Memoized)
  const handleEndNavigation = useCallback(() => {
    setMapMode(MapMode.EXPLORE);
    setRoute(null);
    setCurrentStepIndex(0);
    setSelectedPlace(null);
    setSidebarOpen(false);
    setHasAlertedNearDestination(false);
    speak("Navigation ended.");
  }, [speak]);

  // 3. Step Tracking & Completion
  useEffect(() => {
    if (mapMode === MapMode.NAVIGATION && route && location) {
      const currentStep = route.steps[currentStepIndex];

      // Safety check
      if (!currentStep || !currentStep.maneuver || !currentStep.maneuver.location) return;

      const stepLat = currentStep.maneuver.location[1];
      const stepLng = currentStep.maneuver.location[0];
      const dist = calculateDistance(location.lat, location.lng, stepLat, stepLng);

      // Arrival threshold (40m)
      if (dist < 40) {
        if (currentStepIndex >= route.steps.length - 1) {
          // ARRIVAL: User reached final destination
          speak("You have arrived at your destination.");
          handleEndNavigation();
        } else {
          // NEXT STEP
          setCurrentStepIndex(prev => prev + 1);
        }
      }
    }
  }, [location, mapMode, route, currentStepIndex, handleEndNavigation, speak]);

  // 4. Instruction Announcement
  useEffect(() => {
    if (mapMode === MapMode.NAVIGATION && route) {
      const step = route.steps[currentStepIndex];
      if (step && step.instruction) {
        speak(step.instruction);
      }
    }
  }, [currentStepIndex, mapMode, route, speak]);

  // --- Handlers ---
  const handleAuthSuccess = (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setUser(null);
    setAppView(AppView.MAP);
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setPreviewRoute(null); // Clear preview
    setSelectedPlace(null); // Clear selection

    try {
      // Use Gemini (Map Search Configured)
      const response = await queryNavPalAI(query, location);

      // --- Handle Structured Map Actions (AI Control) ---
      if (response.mapAction) {
        const action = response.mapAction;

        if (action.type === 'CENTER' && action.payload.coordinates) {
          const [lng, lat] = action.payload.coordinates;
          setLocation({ lat, lng });
          setRecenterTrigger(prev => prev + 1); // Force refresh
          speak("Centering map.");
        }
        else if (action.type === 'DRAW_ROUTE' && action.payload.route) {
          // Convert AI GeoJSON route to compatible NavigationRoute
          // Note: Full conversion would require more fields, this is a simplified mapping for visualization
          const aiRoute = action.payload.route;
          if (aiRoute.geometry && aiRoute.properties) {
            const simRoute: NavigationRoute = {
              geometry: aiRoute.geometry,
              distance: aiRoute.properties.distance_m || 0,
              duration: aiRoute.properties.duration_s || 0,
              steps: aiRoute.properties.steps?.map((s: string) => ({
                instruction: s,
                distance: 0,
                duration: 0,
                maneuver: { location: [0, 0], type: 'straight' }
              })) || []
            };
            setPreviewRoute(simRoute);
            speak("Here is the route.");
          }
        }
        else if (action.type === 'MARKER' && action.payload.marker) {
          const m = action.payload.marker;
          const newPlace: Place = {
            id: `ai_${Date.now()}`,
            name: m.label || "Pinned Location",
            address: "Marked by AI",
            coordinates: { lat: m.coordinates[1], lng: m.coordinates[0] }
          };
          setPlaces([newPlace]);
          setSelectedPlace(newPlace);
          setSidebarOpen(true);
        }
      }

      // --- Handle Standard Search Results ---
      if (response.places && response.places.length > 0) {
        // MAP SEARCH SUCCESS: 
        setPlaces(response.places);
        setShowSearchResults(true);
        setSidebarOpen(false);
      } else {
        // TEXT ONLY RESPONSE (If no action and no places):
        if (!response.mapAction) {
          setPlaces([]);
          setShowSearchResults(false);
          setSidebarOpen(false);
          // Announce text response if no visual results
          if (response.text) speak(response.text);
        }
      }
    } catch (error) {
      console.error("Search Error:", error);
      speak("Sorry, I couldn't complete that search.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlace = useCallback((place: Place) => {
    setSelectedPlace(place);
    setSidebarOpen(true);
    setShowSearchResults(false);
    setPreviewRoute(null);
  }, []);

  const handlePreviewPlace = async (place: Place) => {
    if (mapMode === MapMode.NAVIGATION) return;
    const prevRoute = await getDirections(location, place.coordinates);
    if (prevRoute) {
      setPreviewRoute(prevRoute);
    }
  };

  const handleClearPreview = () => {
    setPreviewRoute(null);
  };

  const handleStartNavigation = async (targetPlace?: Place) => {
    const dest = targetPlace || selectedPlace;
    if (!dest) return;

    setIsLoading(true);
    const navRoute = await getDirections(location, dest.coordinates);

    if (navRoute) {
      setRoute(navRoute);
      setCurrentStepIndex(0);
      setMapMode(MapMode.NAVIGATION);
      setSidebarOpen(false);
      setPreviewRoute(null);
      setShowSearchResults(false);
      setShowRouteList(false); // Hide list so direction card is focus
      setHasAlertedNearDestination(false);
      setAppView(AppView.MAP);
    } else {
      alert("Could not calculate route.");
    }
    setIsLoading(false);
  };

  // Report Handler (With Database Sync)
  const handleReport = async (type: ReportType, customCoords?: Coordinates) => {
    // Use the passed location, OR the pending report location (if selected from menu), OR current GPS
    const coords = customCoords || reportLocation || location;
    const tempId = Date.now().toString();
    const newReport: MapReport = {
      id: tempId,
      type: type,
      coordinates: { ...coords },
      timestamp: Date.now()
    };

    // Add locally immediately (Optimistic)
    setReports(prev => [newReport, ...prev]);
    setIsReportMenuOpen(false);
    setReportLocation(null); // Reset report target
    speak(`Reported ${type.toLowerCase()}.`);

    // Save to Database
    await createReport(type, coords, user?.id);
  };

  // New handler for initiating report from LocationCard
  const handleReportAtLocation = (coords: Coordinates) => {
    setReportLocation(coords);
    setIsReportMenuOpen(true);
  };

  const handleViewChange = (view: AppView) => {
    setAppView(view);
  };

  // Recenter Map Handler
  const handleRecenterMap = () => {
    setRecenterTrigger(prev => prev + 1);
  };

  // --- Render ---

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <View className="flex-1 bg-slate-950">

      {/* --- Sidebar (Now only for Location Details) --- */}
      {/* FIXED OVERLAY: Added mb-20 to lift the card above the BottomBar area */}
      <View className={`absolute z-30 top-0 left-0 h-full w-full md:w-[400px] pointer-events-none ${sidebarOpen && mapMode === MapMode.EXPLORE ? 'translate-x-0' : '-translate-x-full'}`}>
        <View className="h-full w-full flex flex-col justify-end pointer-events-auto pb-6 md:pb-0">
          {selectedPlace && (
            <View className="p-4 mb-20 md:mb-0 bg-slate-900/50 border-t border-white/5 backdrop-blur-xl shadow-2xl">
              <LocationCard
                place={selectedPlace}
                onClose={() => {
                  setSelectedPlace(null);
                  setSidebarOpen(false);
                }}
                onNavigate={() => handleStartNavigation(selectedPlace)}
                onReport={() => handleReportAtLocation(selectedPlace.coordinates)}
              />
            </View>
          )}
        </View>
      </View>

      {/* --- Main Map Area --- */}
      <View className="flex-1 relative h-full">

        {/* Navigation Mode UI */}
        {mapMode === MapMode.NAVIGATION && (
          <>
            {route && route.steps[currentStepIndex] && (
              <DirectionCard
                step={route.steps[currentStepIndex]}
                remainingDuration={navMetrics.remainingTime}
                remainingDistance={navMetrics.remainingDist}
                isNearDestination={hasAlertedNearDestination}
                onEndNavigation={handleEndNavigation}
                showSpeedLimit={showSpeedLimit}
                currentSpeed={currentSpeed}
              />
            )}
          </>
        )}

        {/* Route Overview Panel (Right Side) */}
        {(previewRoute || (route && showRouteList)) && (
          <RouteOverview
            route={previewRoute || route!}
            isPreview={!!previewRoute}
            onClose={() => {
              setPreviewRoute(null);
              setShowRouteList(false);
            }}
            onStartNavigation={() => handleStartNavigation(selectedPlace || undefined)}
            onStopNavigation={handleEndNavigation}
          />
        )}

        {/* --- Map Controls Toolbar --- */}
        {appView === AppView.MAP && (
          <MapToolbar
            showRouteList={showRouteList}
            onToggleRouteList={() => setShowRouteList(!showRouteList)}
            showTraffic={showTraffic}
            onToggleTraffic={() => setShowTraffic(!showTraffic)}
            currentStyle={mapStyle}
            onStyleChange={setMapStyle}
            isNavigating={mapMode === MapMode.NAVIGATION}
            onRecenter={handleRecenterMap}
          />
        )}

        {/* Report Menu Modal */}
        <ReportMenu
          isOpen={isReportMenuOpen}
          onClose={() => setIsReportMenuOpen(false)}
          onReport={(type) => handleReport(type)}
        />

        {/* Profile Modal */}
        {appView === AppView.PROFILE && user && (
          <ProfileModal
            user={user}
            onClose={() => setAppView(AppView.MAP)}
            onLogout={handleLogout}
            showSpeedLimit={showSpeedLimit}
            onToggleSpeedLimit={handleToggleSpeedLimit}
            isVoiceMuted={isVoiceMuted}
            onToggleVoiceMute={() => setIsVoiceMuted(!isVoiceMuted)}
            onUpdateUser={handleUpdateUser}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* Explore Mode UI */}
        {mapMode === MapMode.EXPLORE && (
          <>
            <View className="absolute top-6 left-0 right-0 px-4 z-20 pointer-events-none flex flex-col items-center">
              <View className="pointer-events-auto w-full max-w-xl shadow-2xl">
                <View className="relative w-full">
                  <OmniBar
                    onSearch={handleSearch}
                    isLoading={isLoading}
                    isListening={isLiveSessionActive}
                    onMicClick={toggleLiveSession}
                    onProfileClick={() => setAppView(AppView.PROFILE)}
                    userAvatar={user?.avatar}
                  />
                </View>

                {showSearchResults && (
                  <SearchResults
                    places={places}
                    onSelect={handleSelectPlace}
                    onHover={handlePreviewPlace}
                    onLeave={handleClearPreview}
                  />
                )}
              </View>
            </View>
          </>
        )}

        <MapWrapper
          center={location}
          places={places}
          reports={reports}
          selectedPlace={selectedPlace}
          route={route}
          previewRoute={previewRoute}
          mapMode={mapMode}
          mapStyle={mapStyle}
          showTraffic={showTraffic}
          onSelectPlace={handleSelectPlace}
          recenterTrigger={recenterTrigger}
        />

        {/* Bottom Navigation Dock */}
        <BottomBar
          currentView={appView}
          onViewChange={handleViewChange}
          onReportClick={() => setIsReportMenuOpen(true)}
        />

        {/* MyPal Orbital Assistant (Persistent Bottom Left) */}
        {/* HIDE Orbital Assistant if Sidebar is open to prevent overlapping content */}
        {!sidebarOpen && (
          <View className="absolute bottom-32 left-6 z-50 pointer-events-auto">
            <OrbitalAssistant
              isActive={isLiveSessionActive}
              state={aiState}
              onClick={toggleLiveSession}
            />
          </View>
        )}

      </View>
    </View>
  );
}
