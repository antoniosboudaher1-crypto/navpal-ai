
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Place } from '../../types';
import GlassCard from '../UI/GlassCard';
import { MapPin, Navigation2 } from 'lucide-react-native';

interface SearchResultsProps {
  places: Place[];
  onSelect: (place: Place) => void;
  onHover: (place: Place) => void;
  onLeave: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ places, onSelect, onHover, onLeave }) => {
  if (places.length === 0) return null;

  return (
    <GlassCard className="absolute top-[72px] left-0 right-0 mx-auto w-full max-w-2xl overflow-hidden max-h-[300px]">
      <ScrollView className="flex-1 p-1" contentContainerStyle={{ paddingBottom: 4 }}>
        {places.map((place) => (
          <TouchableOpacity
            key={place.id}
            onPress={() => onSelect(place)}
            onPressIn={() => onHover(place)}
            onPressOut={() => onLeave()}
            className="flex-row items-center gap-3 p-3 rounded-xl border border-transparent"
          >
            <View className="w-10 h-10 bg-slate-800 rounded-lg items-center justify-center shrink-0">
              <MapPin size={20} color="#94a3b8" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white font-medium" numberOfLines={1}>{place.name}</Text>
              <Text className="text-sm text-slate-400" numberOfLines={1}>{place.address}</Text>
            </View>
            <Navigation2 size={16} color="#64748b" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </GlassCard>
  );
};

export default SearchResults;
