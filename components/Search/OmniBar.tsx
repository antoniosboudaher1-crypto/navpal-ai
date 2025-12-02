
import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Image, Text } from 'react-native';
import { Mic, Navigation, Loader2, Send, MicOff, AudioLines, User as UserIcon } from 'lucide-react-native';
import GlassCard from '../UI/GlassCard';

interface OmniBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  isListening: boolean;
  onMicClick: () => void;
  onProfileClick?: () => void;
  userAvatar?: string;
}

const OmniBar: React.FC<OmniBarProps> = ({
  onSearch,
  isLoading,
  isListening,
  onMicClick,
  onProfileClick,
  userAvatar
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSearch(query);
      // Note: We DO NOT clear the query here. 
      // In a map app, the search term usually stays visible so the user knows what they are looking at.
      inputRef.current?.blur(); // Dismiss keyboard/focus
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <GlassCard className="relative z-20 w-full max-w-2xl mx-auto mt-4 p-2">
      <View className="flex-row items-center gap-3">

        {/* Left Icon / Profile Toggle */}
        {onProfileClick ? (
          <TouchableOpacity
            onPress={onProfileClick}
            className="relative shrink-0"
          >
            <View className={`w-10 h-10 rounded-2xl overflow-hidden border ${isListening ? 'border-red-500/50' : 'border-white/10'}`}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <UserIcon size={20} color="#94a3b8" />
                </View>
              )}
            </View>
            {/* Status Indicator */}
            <View className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isLoading ? 'bg-yellow-400' : isListening ? 'bg-red-500' : 'bg-green-500'}`} />
          </TouchableOpacity>
        ) : (
          <View className={`p-3 rounded-2xl ${isListening ? 'bg-red-500/20' : 'bg-purple-600/20'}`}>
            {isLoading ? (
              <Loader2 size={24} color={isListening ? '#f87171' : '#d8b4fe'} className="animate-spin" />
            ) : isListening ? (
              <AudioLines size={24} color="#f87171" />
            ) : (
              <Navigation size={24} color="#d8b4fe" />
            )}
          </View>
        )}

        <View className="flex-1 relative justify-center">
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            placeholder={isListening ? "Listening (Live)..." : "Search maps..."}
            placeholderTextColor="rgba(148, 163, 184, 0.7)"
            className="w-full text-lg font-medium text-white h-10"
            style={{ outlineStyle: 'none' } as any} // Web-only fix for outline
          />
          {/* Subtle Typing Indicator / Loader inside input area */}
          {isLoading && query && (
            <View className="absolute right-0 flex-row gap-1">
              <View className="w-1 h-1 bg-slate-400 rounded-full" />
              <View className="w-1 h-1 bg-slate-400 rounded-full" />
              <View className="w-1 h-1 bg-slate-400 rounded-full" />
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 pr-2 shrink-0">
          {query.length > 0 ? (
            <View className="flex-row items-center gap-2">
              {/* Clear Button */}
              <TouchableOpacity
                onPress={handleClear}
                className="p-1.5 rounded-full"
              >
                <Text className="text-slate-500 text-xs font-bold">X</Text>
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                className="p-2.5 rounded-full bg-purple-600 shadow-lg shadow-purple-900/20"
              >
                <Send size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onMicClick}
              className={`p-2.5 rounded-full ${isListening
                ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                : 'bg-transparent'
                }`}
            >
              {isListening ? <MicOff size={20} color="white" /> : <Mic size={20} color="#94a3b8" />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassCard>
  );
};

export default OmniBar;
