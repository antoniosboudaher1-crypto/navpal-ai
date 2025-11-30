
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChatMessage } from '../../types';
import GlassCard from '../UI/GlassCard';
import { Bot, User, MapPin } from 'lucide-react-native';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, onClose }) => {
  return (
    <GlassCard className="absolute top-20 left-4 bottom-24 w-80 flex-col z-40 bg-slate-900/95 border-purple-500/20 shadow-2xl">
      <View className="p-4 border-b border-white/10 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Bot size={20} color="#c084fc" />
          <Text className="text-white font-bold text-lg">Chat Assistant</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-slate-400 text-xl font-bold">×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4 space-y-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.length === 0 && (
          <View className="mt-10 items-center">
            <Text className="text-slate-500 text-center">Ask me anything about the map or navigation.</Text>
          </View>
        )}

        {messages.map((msg) => (
          <View key={msg.id} className={`flex-row gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <View className={`w-8 h-8 rounded-full items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-purple-600'}`}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </View>
            <View className={`p-3 rounded-xl max-w-[80%] ${msg.role === 'user' ? 'bg-slate-800' : 'bg-purple-900/40 border border-purple-500/20'}`}>
              <Text className={msg.role === 'user' ? 'text-slate-200 text-sm' : 'text-slate-100 text-sm'}>
                {msg.text}
              </Text>
              {msg.places && msg.places.length > 0 && (
                <View className="mt-2 pt-2 border-t border-white/10 space-y-1">
                  {msg.places.map((p, i) => (
                    <View key={i} className="flex-row items-center gap-1">
                      <MapPin size={12} color="#d8b4fe" />
                      <Text className="text-xs text-purple-300">{p.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </GlassCard>
  );
};

export default ChatSidebar;
