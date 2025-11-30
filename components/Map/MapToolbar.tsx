
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MapStyle } from '../../types';
import { Layers, List, CarFront, Moon, Satellite, Map as MapIcon, Sparkles, Crosshair } from 'lucide-react-native';

interface MapToolbarProps {
  showRouteList: boolean;
  onToggleRouteList: () => void;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  isNavigating: boolean;
  onRecenter: () => void;
}

const MapToolbar: React.FC<MapToolbarProps> = ({
  showRouteList,
  onToggleRouteList,
  showTraffic,
  onToggleTraffic,
  currentStyle,
  onStyleChange,
  isNavigating,
  onRecenter
}) => {
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const styles = [
    { id: MapStyle.NAVPAL, label: 'Luxury', icon: <Sparkles size={16} color="#c084fc" /> },
    { id: MapStyle.DARK, label: 'Dark', icon: <Moon size={16} color="#cbd5e1" /> },
    { id: MapStyle.STREET, label: 'Street', icon: <MapIcon size={16} color="#cbd5e1" /> },
    { id: MapStyle.SATELLITE, label: 'Live Map', icon: <Satellite size={16} color="#cbd5e1" /> },
  ];

  return (
    <View className="absolute bottom-32 right-6 z-20 flex-col gap-3 pointer-events-auto items-end">

      {/* Toggle Route List (Nav Mode Only) */}
      {isNavigating && (
        <TouchableOpacity
          onPress={onToggleRouteList}
          className={`w-12 h-12 rounded-full backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center ${showRouteList ? 'bg-purple-600' : 'bg-slate-900/90'}`}
        >
          <List size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Recenter / Locate Me Button */}
      <TouchableOpacity
        onPress={onRecenter}
        className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center bg-slate-900/90"
      >
        <Crosshair size={24} color="white" />
      </TouchableOpacity>

      {/* Layer Menu (Expanded) */}
      {isLayersOpen && (
        <View className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl mb-2 flex-col gap-2 min-w-[140px]">
          <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-1">Map Style</Text>

          {styles.map((style) => (
            <TouchableOpacity
              key={style.id}
              onPress={() => {
                onStyleChange(style.id);
                setIsLayersOpen(false);
              }}
              className={`flex-row items-center gap-3 px-3 py-2 rounded-xl ${currentStyle === style.id ? 'bg-purple-600' : 'bg-transparent'}`}
            >
              {style.icon}
              <Text className={`text-sm font-medium ${currentStyle === style.id ? 'text-white' : 'text-slate-300'}`}>
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View className="h-px bg-white/10 my-1" />

          <TouchableOpacity
            onPress={onToggleTraffic}
            className={`flex-row items-center gap-3 px-3 py-2 rounded-xl ${showTraffic ? 'bg-green-600' : 'bg-transparent'}`}
          >
            <CarFront size={16} color={showTraffic ? 'white' : '#cbd5e1'} />
            <Text className={`text-sm font-medium ${showTraffic ? 'text-white' : 'text-slate-300'}`}>
              Traffic
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Layers Toggle Button */}
      <TouchableOpacity
        onPress={() => setIsLayersOpen(!isLayersOpen)}
        className={`w-12 h-12 rounded-full backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center ${isLayersOpen || showTraffic ? 'bg-purple-600' : 'bg-slate-900/90'}`}
      >
        <Layers size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default MapToolbar;
