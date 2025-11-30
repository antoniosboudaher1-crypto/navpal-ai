
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ReportType } from '../../types';
import GlassCard from '../UI/GlassCard';
import { Siren, CarFront, TriangleAlert, OctagonAlert } from 'lucide-react-native';

interface ReportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: (type: ReportType) => void;
}

const ReportMenu: React.FC<ReportMenuProps> = ({ isOpen, onClose, onReport }) => {
  if (!isOpen) return null;

  const reportOptions = [
    {
      type: ReportType.POLICE,
      label: 'Police',
      icon: <Siren size={32} color="white" />,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-500/40'
    },
    {
      type: ReportType.ACCIDENT,
      label: 'Accident',
      icon: <CarFront size={32} color="white" />,
      color: 'bg-red-600',
      shadow: 'shadow-red-500/40'
    },
    {
      type: ReportType.HAZARD,
      label: 'Hazard',
      icon: <TriangleAlert size={32} color="white" />,
      color: 'bg-orange-500',
      shadow: 'shadow-orange-500/40'
    },
    {
      type: ReportType.TRAFFIC,
      label: 'Traffic',
      icon: <OctagonAlert size={32} color="white" />,
      color: 'bg-yellow-500',
      shadow: 'shadow-yellow-500/40'
    }
  ];

  return (
    <View className="absolute inset-0 z-50 flex-col items-center justify-end p-4">
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <GlassCard className="w-full max-w-md p-6 relative border-t border-white/20 bg-slate-900/95">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-white">Report Incident</Text>
          <TouchableOpacity
            onPress={onClose}
            className="p-2 bg-slate-800 rounded-full"
          >
            <Text className="text-slate-400 font-bold text-lg">×</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between gap-4">
          {reportOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              onPress={() => onReport(option.type)}
              className={`w-[47%] flex-col items-center justify-center p-6 rounded-2xl ${option.color} shadow-lg ${option.shadow}`}
            >
              <View className="mb-2">
                {option.icon}
              </View>
              <Text className="text-white font-bold tracking-wide">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-center text-slate-500 text-xs mt-6 font-medium uppercase tracking-wider">
          Thank you for keeping the community safe
        </Text>
      </GlassCard>
    </View>
  );
};

export default ReportMenu;
