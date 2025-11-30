import React from 'react';
import { View } from 'react-native';

interface VoiceWaveProps {
  isActive: boolean;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <View className="flex-row items-center gap-1 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="w-1 bg-purple-400 rounded-full animate-wave"
          style={{
            height: '100%',
            // animationDelay is not directly supported in RN styling, usually needs Reanimated or Animated API
            // For now keeping it but it might be ignored on native
          }}
        />
      ))}
    </View>
  );
};

export default VoiceWave;