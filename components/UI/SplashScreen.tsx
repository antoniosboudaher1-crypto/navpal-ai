import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Navigation, Map } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate system initialization progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Random increment for realism
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <View className="absolute inset-0 z-50 flex-col items-center justify-center bg-slate-950 overflow-hidden">
      {/* Sophisticated Background */}
      <LinearGradient
        colors={['rgba(30, 27, 75, 0.4)', '#020617', '#020617']}
        locations={[0, 0.5, 1]}
        className="absolute inset-0"
      />
      {/* Technical Grid Pattern - simplified for RN as CSS gradients are complex */}
      <View className="absolute inset-0 opacity-10 bg-slate-500" />

      <View className="relative z-10 flex-col items-center">
        {/* Logo Composition */}
        <View className="relative mb-12 scale-110">
          {/* Glow Effect */}
          <View className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl" />

          {/* Main Icon Container */}
          <View className="relative w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl shadow-black/50 transform rotate-3">
            <View className="absolute inset-0 bg-white/5 rounded-2xl" />
            <Navigation size={48} color="#c084fc" fill="rgba(168,85,247,0.1)" />
          </View>

          {/* Decorative Floating Element */}
          <View className="absolute -right-4 -bottom-4 w-10 h-10 bg-slate-800/90 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-lg">
            <Map size={20} color="#818cf8" />
          </View>
        </View>

        {/* Typography */}
        <View className="items-center space-y-3">
          <Text className="text-4xl font-bold text-white tracking-tight">
            NavPal <Text className="text-purple-400">AI</Text>
          </Text>
          <Text className="text-slate-400 text-xs font-semibold tracking-[0.3em] uppercase">
            Next Gen Navigation System
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="mt-16 w-64 h-1 bg-slate-800 rounded-full overflow-hidden relative">
          <View
            className="absolute top-0 left-0 h-full bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </View>

        <Text className="mt-3 text-[10px] text-slate-500 font-mono tracking-wider">
          INITIALIZING SYSTEMS... {progress}%
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;