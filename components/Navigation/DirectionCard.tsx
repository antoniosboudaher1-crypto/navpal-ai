
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RouteStep } from '../../types';
import GlassCard from '../UI/GlassCard';
import { ArrowRight, ArrowLeft, ArrowUp, MapPin, Clock, Flag } from 'lucide-react-native';

interface DirectionCardProps {
  step: RouteStep;
  remainingDuration: number; // in seconds
  remainingDistance: number; // in meters
  isNearDestination?: boolean;
  onEndNavigation: () => void;
  showSpeedLimit?: boolean;
  currentSpeed?: number | null; // in meters per second
}

const getIconForManeuver = (type: string, modifier?: string) => {
  if (type === 'turn') {
    if (modifier?.includes('left')) return <ArrowLeft size={48} color="white" />;
    if (modifier?.includes('right')) return <ArrowRight size={48} color="white" />;
  }
  return <ArrowUp size={48} color="white" />;
};

const DirectionCard: React.FC<DirectionCardProps> = ({
  step,
  remainingDuration,
  remainingDistance,
  isNearDestination = false,
  onEndNavigation,
  showSpeedLimit = true,
  currentSpeed
}) => {
  const minutes = Math.floor(remainingDuration / 60);
  const km = (remainingDistance / 1000).toFixed(1);

  // Convert current speed to km/h (1 m/s = 3.6 km/h)
  const currentSpeedKmh = currentSpeed !== undefined && currentSpeed !== null
    ? Math.round(currentSpeed * 3.6)
    : 0;

  // Calculate ETA based on current time + remaining seconds
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + remainingDuration * 1000);
  const etaString = arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <View className="absolute top-4 left-4 right-4 z-40 flex-col items-center gap-2">
      <GlassCard className={`w-full max-w-md bg-slate-900/90 p-0 overflow-hidden border-t-4 shadow-2xl shadow-black/50 relative ${isNearDestination ? 'border-t-purple-500 shadow-purple-900/40' : 'border-t-green-500'}`}>

        {/* Arriving Soon Alert Banner */}
        {isNearDestination && (
          <View className="bg-purple-600/90 w-full py-1 flex-row items-center justify-center gap-2">
            <Flag size={12} color="white" fill="white" />
            <Text className="text-[10px] font-bold text-white uppercase tracking-wider">Arriving Soon</Text>
          </View>
        )}

        {/* Speed Information Container (Absolute Positioned) */}
        <View className="absolute top-8 right-4 z-20 flex-col items-end gap-2">

          {/* Current Speed Display (Digital Style) */}
          <View className="flex-col items-center justify-center bg-black/40 rounded-lg border border-white/10 px-2 py-1 shadow-lg">
            <Text className="text-[10px] font-bold text-slate-400 uppercase leading-none">Current</Text>
            <View className="flex-row items-baseline gap-0.5">
              <Text className={`text-2xl font-black leading-none ${currentSpeedKmh > (step.speedLimit || 120) ? 'text-red-400' : 'text-white'}`}>
                {currentSpeedKmh}
              </Text>
              <Text className="text-[10px] font-bold text-slate-500">km/h</Text>
            </View>
          </View>

          {/* Regulatory Speed Limit Sign */}
          {showSpeedLimit && step.speedLimit !== undefined && (
            <View
              className="flex-col items-center justify-center w-14 h-16 bg-white border-[3px] border-slate-900 rounded-md shadow-lg"
            >
              <Text className="text-[8px] font-extrabold text-slate-900 uppercase leading-none mt-1">SPEED</Text>
              <Text className="text-[8px] font-extrabold text-slate-900 uppercase leading-none mb-0.5">LIMIT</Text>
              <Text className="text-2xl font-black text-slate-900 leading-none -mt-0.5">{step.speedLimit}</Text>
            </View>
          )}
        </View>

        <View className="p-6 flex-row items-center gap-6">
          <View
            className={`w-20 h-20 rounded-2xl items-center justify-center shadow-lg shrink-0 ${isNearDestination ? 'bg-purple-600 shadow-purple-900/30' : 'bg-green-600 shadow-green-900/30'}`}
          >
            {isNearDestination ? <Flag size={40} color="white" /> : getIconForManeuver(step.maneuver.type, step.maneuver.modifier)}
          </View>
          <View className="flex-1 pr-16"> {/* Added more padding right to avoid overlapping speed displays */}
            <Text className="text-4xl font-bold text-white mb-1 tracking-tight">
              {Math.round(step.distance)}<Text className="text-2xl text-slate-400">m</Text>
            </Text>
            <Text className="text-slate-300 text-lg leading-tight font-medium" numberOfLines={2}>{step.instruction}</Text>
          </View>
        </View>

        <View className="bg-black/20 p-4 flex-row justify-between items-center border-t border-white/5">
          <View className="flex-row gap-6">
            <View className="flex-col">
              <Text className="text-xs text-slate-500 uppercase font-bold tracking-wider">Arrival</Text>
              <View className="flex-row items-center gap-2">
                <Text className="font-bold text-lg text-white">{etaString}</Text>
              </View>
            </View>
            <View className="flex-col">
              <Text className="text-xs text-slate-500 uppercase font-bold tracking-wider">Time</Text>
              <View className={`flex-row items-center gap-2 ${isNearDestination ? 'text-purple-400' : 'text-green-400'}`}>
                <Clock size={16} color={isNearDestination ? '#c084fc' : '#4ade80'} />
                <Text className={`font-bold text-lg ${isNearDestination ? 'text-purple-400' : 'text-green-400'}`}>{minutes} min</Text>
              </View>
            </View>
            <View className="flex-col">
              <Text className="text-xs text-slate-500 uppercase font-bold tracking-wider">Distance</Text>
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#cbd5e1" />
                <Text className="font-bold text-lg text-slate-300">{km} km</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={onEndNavigation}
            className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl"
          >
            <Text className="text-red-400 font-bold">Exit</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
};

export default DirectionCard;
