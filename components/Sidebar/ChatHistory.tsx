
import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ChatMessage } from '../../types';
import { Bot, User, ExternalLink, MapPin, Globe } from 'lucide-react-native';

interface ChatHistoryProps {
  messages: ChatMessage[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  return (
    <View className="flex-col gap-6 pb-4">
      {messages.map((msg) => (
        <View
          key={msg.id}
          className={`flex-row gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          {/* Avatar */}
          <View className={`w-8 h-8 rounded-full items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-600'}`}>
            {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
          </View>

          <View className="flex-col max-w-[85%]">
            {/* Message Bubble */}
            <View className={`p-4 rounded-2xl shadow-md ${msg.role === 'user'
              ? 'bg-slate-800 rounded-tr-none'
              : 'bg-purple-900/40 border border-purple-500/20 rounded-tl-none'
              }`}>
              <Text className={msg.role === 'user' ? 'text-slate-200 text-sm leading-relaxed' : 'text-slate-100 text-sm leading-relaxed'}>
                {msg.text}
              </Text>
            </View>

            {/* Sources / Grounding Chips */}
            {msg.sources && msg.sources.length > 0 && (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {msg.sources.slice(0, 3).map((source, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => Linking.openURL(source.url)}
                    className="flex-row items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/50 border border-white/5 rounded-lg"
                  >
                    {source.sourceType === 'map' ? <MapPin size={12} color="#94a3b8" /> : <Globe size={12} color="#94a3b8" />}
                    <Text className="text-xs text-slate-400 max-w-[150px]" numberOfLines={1}>{source.title}</Text>
                    <ExternalLink size={12} color="#94a3b8" style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default ChatHistory;
