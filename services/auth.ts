
import { User } from '../types';
import { supabase } from './supabase';

const GUEST_KEY = 'navpal_guest_session';

export const loginUser = async (email: string, password: string, captchaToken?: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Login failed');

  // Clear any guest session safely
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch (e) {
    console.warn("Could not access localStorage");
  }

  return {
    id: data.user.id,
    name: data.user.user_metadata?.name || email.split('@')[0],
    email: data.user.email || '',
    avatar: data.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${data.user.id}`
  };
};

export const registerUser = async (name: string, email: string, password: string, captchaToken?: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      captchaToken
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed');

  return {
    id: data.user.id,
    name: name,
    email: email,
    avatar: `https://i.pravatar.cc/150?u=${data.user.id}`
  };
};

export const loginAsGuest = async (): Promise<User> => {
  const guestUser: User = {
    id: 'guest_' + Date.now(),
    name: 'Guest Driver',
    email: 'guest@navpal.ai',
    contributionScore: 0,
    milesDriven: 0
  };
  
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(guestUser));
  } catch (e) {
    console.warn("Could not save guest session to localStorage");
  }
  
  return guestUser;
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch (e) {
    console.warn("Could not access localStorage");
  }
  await supabase.auth.signOut();
};

export const updateUserProfile = async (name: string): Promise<void> => {
  // 1. Try updating Supabase Auth User
  const { error } = await supabase.auth.updateUser({
    data: { name }
  });

  // 2. If it's a guest session (or if Supabase update failed/skipped), update local storage
  try {
    const guestStr = localStorage.getItem(GUEST_KEY);
    if (guestStr) {
      const guest = JSON.parse(guestStr);
      guest.name = name;
      localStorage.setItem(GUEST_KEY, JSON.stringify(guest));
    }
  } catch (e) {
    // ignore local storage errors
  }

  if (error) {
    // If it was a real user and failed, throw error
    const currentUser = await supabase.auth.getUser();
    if (currentUser.data.user) throw error; 
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  // 1. Check Supabase Session
  const { data } = await supabase.auth.getUser();
  
  if (data.user) {
    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Navigator',
      email: data.user.email || '',
      avatar: data.user.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${data.user.id}`
    };
  }

  // 2. Check Guest Session safely
  try {
    const guestStr = localStorage.getItem(GUEST_KEY);
    if (guestStr) {
      try {
        return JSON.parse(guestStr);
      } catch (e) {
        localStorage.removeItem(GUEST_KEY);
      }
    }
  } catch (e) {
    console.warn("Could not access localStorage");
  }

  return null;
};
