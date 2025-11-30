
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { AppView } from '../../types';
import GlassCard from './GlassCard';
import { Map, User, AlertTriangle } from 'lucide-react-native';

interface BottomBarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onReportClick: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  currentView,
  onViewChange,
  onReportClick
}) => {
  return (
    <View className="absolute bottom-6 left-0 right-0 z-40 flex-row justify-center pointer-events-none">
      <View className="pointer-events-auto">
        <GlassCard className="flex-row items-center gap-6 px-6 py-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-full">

          {/* Map / Home */}
          <TouchableOpacity
            onPress={() => onViewChange(AppView.MAP)}
            className={`flex-col items-center justify-center w-14 h-14 rounded-full ${currentView === AppView.MAP
              ? 'bg-white/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-transparent'
              }`}
          >
            <Map
              size={24}
              color={currentView === AppView.MAP ? '#a855f7' : '#94a3b8'}
            />
            <Text className={`text-[9px] font-bold tracking-wide uppercase mt-1 ${currentView === AppView.MAP ? 'text-purple-400 opacity-100' : 'text-slate-400 opacity-80'
              }`}>Map</Text>
          </TouchableOpacity>

          {/* Primary Action: Report (Center Floating) */}
          <View className="relative -mt-12 mx-2">
            <TouchableOpacity
              onPress={onReportClick}
              className="w-16 h-16 bg-gradient-to-b from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(234,88,12,0.5)] border-4 border-slate-950"
            >
              <AlertTriangle size={28} color="white" fill="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          </View>

          {/* Profile */}
          <TouchableOpacity
            onPress={() => onViewChange(AppView.PROFILE)}
            className={`flex-col items-center justify-center w-14 h-14 rounded-full ${currentView === AppView.PROFILE
              ? 'bg-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'bg-transparent'
              }`}
          >
            <User
              size={24}
              color={currentView === AppView.PROFILE ? '#818cf8' : '#94a3b8'}
            />
            <Text className={`text-[9px] font-bold tracking-wide uppercase mt-1 ${currentView === AppView.PROFILE ? 'text-indigo-400 opacity-100' : 'text-slate-400 opacity-80'
              }`}>Profile</Text>
          </TouchableOpacity>

        </GlassCard>
      </View>
    </View>
  );
};

export default BottomBar;
