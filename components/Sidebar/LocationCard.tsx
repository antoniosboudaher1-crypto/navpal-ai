
import React from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import { Place } from '../../types';
import { Navigation, Star, MapPin, Share2, Clock, TriangleAlert, Phone } from 'lucide-react-native';
import GlassCard from '../UI/GlassCard';

interface LocationCardProps {
  place: Place;
  onClose: () => void;
  onNavigate?: () => void;
  onReport?: () => void; // Now opens the menu
}

const LocationCard: React.FC<LocationCardProps> = ({ place, onClose, onNavigate, onReport }) => {

  const handleShare = async () => {
    try {
      await Share.share({
        title: place.name,
        message: `Check out ${place.name} on NavPal: ${place.sourceUrl || `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`}`,
        url: place.sourceUrl || `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <GlassCard className="p-6 shadow-2xl border-white/10 w-full">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-4">
          <Text className="text-2xl font-bold text-white leading-tight">{place.name}</Text>
          {place.distance && <Text className="text-sm text-purple-300 font-medium mt-1">{place.distance} away</Text>}
        </View>
        <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-white/5">
          <Text className="text-slate-400 text-lg font-bold">×</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Section - Only show if real data exists */}
      {place.rating ? (
        <View className="flex-row items-center gap-2 mb-4">
          <Star size={20} color="#facc15" fill="#facc15" />
          <Text className="font-bold text-lg text-yellow-400">{place.rating}</Text>
          <Text className="text-slate-400 text-sm">({place.userRatingsTotal || '10+'} reviews)</Text>
        </View>
      ) : (
        <View className="mb-2" />
      )}

      <View className="flex-col gap-3 mb-6">
        <View className="flex-row items-start gap-3">
          <MapPin size={20} color="#c084fc" style={{ marginTop: 2 }} />
          <Text className="text-sm leading-relaxed text-slate-200 flex-1">{place.address}</Text>
        </View>

        {/* Hours - Only show if data exists */}
        {(place.isOpen !== undefined || place.closesAt) && (
          <View className="flex-row items-center gap-3">
            <Clock size={20} color="#c084fc" />
            <Text className="text-sm text-slate-300">
              {place.isOpen ? <Text className="text-green-400 font-bold">Open Now</Text> : <Text className="text-red-400 font-bold">Closed</Text>}
              {place.closesAt && <Text className="text-slate-400"> • Closes {place.closesAt}</Text>}
            </Text>
          </View>
        )}

        {place.phone && (
          <View className="flex-row items-center gap-3">
            <Phone size={20} color="#c084fc" />
            <Text className="text-sm text-slate-300">{place.phone}</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onNavigate}
          className="flex-1 flex-row items-center justify-center gap-2 bg-purple-600 py-3 rounded-xl shadow-lg shadow-purple-900/30"
        >
          <Navigation size={20} color="white" />
          <Text className="text-white font-bold">Go Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          className="flex-col items-center justify-center gap-1 bg-white/5 px-4 py-2 rounded-xl border border-white/5"
        >
          <Share2 size={20} color="#cbd5e1" />
          <Text className="text-[10px] uppercase text-slate-300 font-medium">Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onReport}
          className="flex-col items-center justify-center gap-1 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl"
        >
          <TriangleAlert size={20} color="#fb923c" />
          <Text className="text-[10px] uppercase text-orange-400 font-medium">Report</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

export default LocationCard;
