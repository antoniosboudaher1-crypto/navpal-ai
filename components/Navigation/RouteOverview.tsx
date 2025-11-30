
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationRoute, RouteStep } from '../../types';
import GlassCard from '../UI/GlassCard';
import { Clock, MapPin, Navigation, ArrowRight, ArrowLeft, ArrowUp, ChevronDown, ChevronUp, X, Flag, Timer, Ban, List } from 'lucide-react-native';

interface RouteOverviewProps {
  route: NavigationRoute;
  isPreview: boolean;
  onClose: () => void;
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
}

const getIconForManeuver = (type: string, modifier?: string) => {
  if (type === 'turn') {
    if (modifier?.includes('left')) return <ArrowLeft size={16} color="white" />;
    if (modifier?.includes('right')) return <ArrowRight size={16} color="white" />;
  }
  if (type === 'arrive') return <Flag size={16} color="#4ade80" />;
  return <ArrowUp size={16} color="#cbd5e1" />;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const RouteOverview: React.FC<RouteOverviewProps> = ({ route, isPreview, onClose, onStartNavigation, onStopNavigation }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSteps, setShowSteps] = useState(true);

  // Calculate Arrival Time
  const arrivalTime = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Trackers for the loop
  let cumulativeTime = 0;
  let cumulativeDistance = 0;

  return (
    <View className={`absolute top-20 right-6 z-30 ${isCollapsed ? 'w-auto' : 'w-full max-w-md'}`}>
      <GlassCard className="flex-col overflow-hidden border border-white/10 bg-slate-900/95 shadow-2xl rounded-2xl">

        {/* Header (Always Visible) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCollapsed(!isCollapsed)}
          className="p-4 border-b border-white/5 flex-row justify-between items-start"
        >
          <View>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-2xl font-bold text-green-400">{formatDuration(route.duration)}</Text>
              <Text className="text-slate-400 font-medium">({formatDistance(route.distance)})</Text>
            </View>
            <Text className="text-sm text-slate-300 mt-1 font-medium">
              Arrival <Text className="text-white font-bold">{arrivalTime}</Text>
            </Text>
          </View>

          <View className="flex-row gap-2">
            <View
              className="p-2 bg-white/5 rounded-lg"
            >
              {isCollapsed ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronUp size={20} color="#94a3b8" />}
            </View>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onClose(); }}
              className="p-2 bg-white/5 rounded-lg"
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {!isCollapsed && (
          <View>
            {/* Primary Actions Area */}
            <View className="p-4 bg-slate-900/50 border-b border-white/5 gap-3">

              {/* Start Button (Preview Mode) */}
              {isPreview && onStartNavigation && (
                <TouchableOpacity
                  onPress={onStartNavigation}
                  className="w-full bg-purple-600 py-3 rounded-xl shadow-lg shadow-purple-900/30 flex-row items-center justify-center gap-2"
                >
                  <Navigation size={20} color="white" />
                  <Text className="text-white font-bold">Start Navigation</Text>
                </TouchableOpacity>
              )}

              {/* Cancel Button (Active Mode) */}
              {!isPreview && onStopNavigation && (
                <TouchableOpacity
                  onPress={onStopNavigation}
                  className="w-full bg-red-500/10 border border-red-500/20 py-3 rounded-xl shadow-lg flex-row items-center justify-center gap-2"
                >
                  <Ban size={20} color="#f87171" />
                  <Text className="text-red-400 font-bold">Cancel Route</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Steps Toggle Header */}
            <TouchableOpacity
              onPress={() => setShowSteps(!showSteps)}
              className="w-full p-3 bg-slate-900/30 border-b border-white/5 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-2">
                <List size={16} color="#94a3b8" />
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Details ({route.steps.length})</Text>
              </View>
              {showSteps ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </TouchableOpacity>

            {/* Steps List Panel (Collapsible) */}
            {showSteps && (
              <View className="relative h-[40vh]">
                {/* Top-to-bottom gradient mask for smooth scroll appearance - optional, can be removed if complex */}
                {/* <View className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent z-20 pointer-events-none" /> */}

                <ScrollView className="flex-1 p-2 bg-slate-950/30" contentContainerStyle={{ paddingBottom: 20 }}>
                  {route.steps.map((step, idx) => {
                    // Calculate Remaining Metrics FROM this step to Destination
                    const remainingDistance = Math.max(0, route.distance - cumulativeDistance);
                    const remainingTime = Math.max(0, route.duration - cumulativeTime);

                    // Update cumulative for next iteration
                    cumulativeDistance += step.distance;
                    cumulativeTime += step.duration;

                    const isLast = idx === route.steps.length - 1;

                    return (
                      <View key={idx} className="flex-row gap-4 p-3 rounded-xl relative overflow-visible">

                        {/* Continuous Timeline Line */}
                        {!isLast && (
                          <View className="absolute left-[27px] top-8 bottom-[-14px] w-0.5 bg-slate-800 z-0" />
                        )}

                        {/* Step Number/Icon */}
                        <View className={`w-8 h-8 rounded-full items-center justify-center shrink-0 z-10 border-2 border-slate-900 shadow-md ${idx === 0 ? 'bg-purple-600' : 'bg-slate-800'}`}>
                          {getIconForManeuver(step.maneuver.type, step.maneuver.modifier)}
                        </View>

                        <View className="flex-1 min-w-0 z-10 pt-1">
                          <Text className="text-slate-200 font-medium text-sm leading-snug">{step.instruction}</Text>

                          {/* Leg Details */}
                          <View className="flex-row justify-between items-center mt-2">
                            <View className="flex-row items-center gap-2">
                              <View className="bg-slate-800/80 px-2 py-0.5 rounded-full">
                                <Text className="text-[10px] text-slate-400 font-bold">
                                  {formatDistance(step.distance)}
                                </Text>
                              </View>
                            </View>

                            {/* Remaining Info Panel (Per Step) */}
                            <View className="flex-row items-center gap-3">
                              <View className="flex-row items-center gap-1">
                                <Timer size={12} color="#64748b" />
                                <Text className="text-[10px] text-slate-500 font-bold tracking-wide">{formatDuration(remainingTime)}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Destination Marker */}
                  <View className="flex-row gap-4 p-3 items-center pb-6">
                    <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center shrink-0 shadow-lg shadow-green-900/50 border-2 border-slate-900 z-10">
                      <Flag size={16} color="white" />
                    </View>
                    <Text className="text-white font-bold text-sm">You have arrived</Text>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </GlassCard>
    </View>
  );
};

export default RouteOverview;
