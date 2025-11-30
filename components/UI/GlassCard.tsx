import React from 'react';
import { View } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <View className={`bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl ${className}`}>
      {children}
    </View>
  );
};

export default GlassCard;