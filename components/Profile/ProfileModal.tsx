
import React, { useState } from 'react';
import { User } from '../../types';
import GlassCard from '../UI/GlassCard';
import { X, Trophy, Map, Shield, LogOut, User as UserIcon, ChevronRight, Volume2, VolumeX, History, Edit2, Check, ChevronLeft, Lock, FileText, Download, Trash2, Info, Globe } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  showSpeedLimit: boolean;
  onToggleSpeedLimit: () => void;
  isVoiceMuted: boolean;
  onToggleVoiceMute: () => void;
  onUpdateUser: (name: string) => void;
  onClearHistory: () => void;
}

type ModalView = 'MAIN' | 'PRIVACY' | 'ABOUT';

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  user, 
  onClose, 
  onLogout, 
  showSpeedLimit, 
  onToggleSpeedLimit,
  isVoiceMuted,
  onToggleVoiceMute,
  onUpdateUser,
  onClearHistory
}) => {
  const [currentView, setCurrentView] = useState<ModalView>('MAIN');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateUser(editName);
      setIsEditing(false);
    }
  };

  const renderHeader = (title?: string) => (
    <div className="relative h-32 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-t-3xl shrink-0">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        {currentView !== 'MAIN' ? (
          <button 
            onClick={() => setCurrentView('MAIN')}
            className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm flex items-center gap-1 pr-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back</span>
          </button>
        ) : (
          <div /> /* Spacer */
        )}
        
        <button 
          onClick={onClose}
          className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Avatar - Only show on Main view */}
      {currentView === 'MAIN' && (
        <div className="absolute -bottom-10 left-8">
          <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-slate-500" />
            )}
          </div>
        </div>
      )}

      {/* Title for Sub-views */}
      {currentView !== 'MAIN' && (
        <div className="absolute bottom-6 left-8">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
      )}
    </div>
  );

  const renderMainView = () => (
    <div className="mt-12 px-8 pb-8">
      <div className="flex justify-between items-end mb-6">
        <div className="w-full mr-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-white font-bold text-xl w-full focus:outline-none focus:border-purple-500"
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 bg-green-600/20 text-green-400 rounded-lg">
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <Edit2 className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>
        <div className="shrink-0 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-500 font-bold text-xs uppercase tracking-wider">Gold</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Map className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.milesDriven || '1,204'} <span className="text-sm text-slate-500 font-normal">km</span></p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Reports</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.contributionScore || '42'} <span className="text-sm text-slate-500 font-normal">points</span></p>
        </div>
      </div>

      {/* Navigation Preferences */}
      <div className="space-y-2 mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Navigation Preferences</h3>
        
        {/* Speed Limit Toggle */}
        <div className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${showSpeedLimit ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                    <div className="border border-current w-4 h-5 flex items-center justify-center text-[8px] font-bold">50</div>
                </div>
                <span className="text-slate-300 font-medium">Show Speed Limits</span>
            </div>
            <button 
                onClick={onToggleSpeedLimit}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${showSpeedLimit ? 'bg-purple-600' : 'bg-slate-700'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${showSpeedLimit ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>

        {/* Voice Toggle */}
        <div className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${!isVoiceMuted ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {!isVoiceMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <span className="text-slate-300 font-medium">Voice Navigation</span>
            </div>
            <button 
                onClick={onToggleVoiceMute}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${!isVoiceMuted ? 'bg-purple-600' : 'bg-slate-700'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${!isVoiceMuted ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Settings</h3>
        
        <button 
          onClick={onClearHistory}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-white/10 transition-all group"
        >
           <div className="flex items-center gap-3">
             <History className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
             <span className="text-slate-300 group-hover:text-white font-medium">Clear History</span>
           </div>
           <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400" />
        </button>

        <button 
          onClick={() => setCurrentView('PRIVACY')}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-white/10 transition-all group"
        >
           <div className="flex items-center gap-3">
             <Lock className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
             <span className="text-slate-300 group-hover:text-white font-medium">Privacy & Data</span>
           </div>
           <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400" />
        </button>

        <button 
          onClick={() => setCurrentView('ABOUT')}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-white/10 transition-all group"
        >
           <div className="flex items-center gap-3">
             <Info className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
             <span className="text-slate-300 group-hover:text-white font-medium">About NavPal</span>
           </div>
           <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-purple-400" />
        </button>
      </div>

      {/* Logout */}
      <button 
        onClick={onLogout}
        className="w-full mt-8 flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-bold"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>

      <div className="mt-6 text-center">
         <p className="text-xs text-slate-600">NavPal AI v2.5.0 • Build 2025.10</p>
      </div>
    </div>
  );

  const renderPrivacyView = () => (
    <div className="p-8 pb-20">
      <div className="space-y-6">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3 text-purple-400">
            <Shield className="w-6 h-6" />
            <h3 className="text-lg font-bold">Data Protection</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your location data is processed locally on your device whenever possible. We only store minimal information required to provide your commute suggestions and trip history.
          </p>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-3 text-blue-400">
            <FileText className="w-6 h-6" />
            <h3 className="text-lg font-bold">Usage Analytics</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            We collect anonymous usage statistics to improve route accuracy and app performance. No personally identifiable information is sold to third parties.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all">
            <Download className="w-5 h-5" />
            Export My Data
          </button>
          <button className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-bold">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderAboutView = () => (
    <div className="p-8 pb-20 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-6">
        <Map className="w-12 h-12 text-white" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-1">NavPal AI</h3>
      <p className="text-purple-400 font-medium mb-8">Luxury Intelligent Navigator</p>

      <div className="space-y-4 text-left">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <span className="text-slate-400">Version</span>
          <span className="text-white font-mono">2.5.0 (Stable)</span>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <span className="text-slate-400">AI Model</span>
          <span className="text-white font-mono">Gemini 2.5 Flash</span>
        </div>
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <span className="text-slate-400">Maps Provider</span>
          <span className="text-white font-mono">Mapbox GL v3</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-6">
        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Terms of Service</a>
        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Privacy Policy</a>
        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Website</a>
      </div>
      
      <div className="mt-8 text-slate-600 text-xs">
        &copy; 2025 NavPal AI Inc. All rights reserved.
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
      <GlassCard className="w-full max-w-lg max-h-[85vh] h-[800px] flex flex-col overflow-hidden bg-slate-900 border-purple-500/20 animate-zoom-in relative">
        {renderHeader(currentView === 'PRIVACY' ? 'Privacy & Data' : 'About NavPal')}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'MAIN' && renderMainView()}
          {currentView === 'PRIVACY' && renderPrivacyView()}
          {currentView === 'ABOUT' && renderAboutView()}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileModal;
