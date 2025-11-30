
import { supabase } from './supabase';
import { MapReport, ReportType, Coordinates } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

/* 
  =============================================================================
  !!! SUPABASE DATABASE SETUP INSTRUCTIONS !!!
  =============================================================================
  
  To enable persistent real-time reports, open your Supabase Project Dashboard,
  go to the "SQL Editor" tab, and run the following script:

  -- 1. Create the reports table
  create table if not exists public.reports (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    type text not null,
    lat double precision not null,
    lng double precision not null,
    user_id uuid null,
    constraint reports_pkey primary key (id)
  );

  -- 2. Enable Row Level Security (RLS)
  alter table public.reports enable row level security;

  -- 3. Allow public read access (so everyone can see reports)
  create policy "Public read access"
    on public.reports for select
    to anon
    using (true);

  -- 4. Allow public insert access (so users can create reports)
  create policy "Public insert access"
    on public.reports for insert
    to anon
    with check (true);
    
  -- 5. Enable Realtime
  alter publication supabase_realtime add table public.reports;

  =============================================================================
*/

/**
 * Fetch reports with graceful fallback if table is missing.
 */
export const fetchReports = async (): Promise<MapReport[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      const msg = error.message || '';
      const code = error.code || '';

      // Check for specific schema errors (Table missing, Permissions, etc.)
      const isSchemaError = 
        code === '42P01' || // undefined_table (Postgres)
        code === 'PGRST200' || // Schema cache error
        msg.includes('does not exist') ||
        msg.includes('Could not find the table');

      if (isSchemaError) {
        // Suppress the red error. Just warn once.
        console.warn("⚠️ [NavPal Database] Table 'public.reports' missing. Switched to Local-Only mode.");
        return [];
      }

      console.error('Database Error (fetchReports):', msg);
      return [];
    }

    if (!data) return [];

    // Map and validate data
    return data
      .filter((row: any) => row.lat !== undefined && row.lng !== undefined && row.type)
      .map((row: any) => ({
        id: row.id,
        type: row.type as ReportType,
        coordinates: {
          lat: row.lat,
          lng: row.lng
        },
        timestamp: new Date(row.created_at).getTime()
      }));
  } catch (err: any) {
    // If supabase client is mocked or completely fails
    console.warn('Local Mode (fetchReports): Backend unavailable.');
    return [];
  }
};

/**
 * Subscribe to new reports in real-time.
 */
export const subscribeToReports = (onNewReport: (report: MapReport) => void): RealtimeChannel => {
  return supabase
    .channel('public:reports')
    .on(
      'postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'reports' }, 
      (payload) => {
        const row = payload.new as any;
        if (row && row.type && row.lat && row.lng) {
          const report: MapReport = {
            id: row.id,
            type: row.type as ReportType,
            coordinates: { lat: row.lat, lng: row.lng },
            timestamp: new Date(row.created_at).getTime()
          };
          onNewReport(report);
        }
      }
    )
    .subscribe();
};

/**
 * Create a report with Optimistic UI return.
 * If DB fails (e.g. missing table), it returns a local object so the UI still updates.
 */
export const createReport = async (type: ReportType, coords: Coordinates, userId?: string): Promise<MapReport | null> => {
  // Prepare the optimistic/local object
  const localReport: MapReport = {
    id: `local_${Date.now()}`,
    type,
    coordinates: coords,
    timestamp: Date.now()
  };

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          type,
          lat: coords.lat,
          lng: coords.lng,
          user_id: userId || null
        }
      ])
      .select()
      .single();

    if (error) {
      const msg = error.message || '';
      const code = error.code || '';

      const isSchemaError = 
        code === '42P01' || 
        code === 'PGRST200' || 
        msg.includes('does not exist') ||
        msg.includes('Could not find the table');

      if (isSchemaError) {
         // Silent fallback for missing table - prevent error spam
         return localReport; 
      }
      
      console.error('Database Error (createReport):', msg);
      return localReport; // Fallback to local even on other errors
    }

    if (!data) return localReport;

    return {
      id: data.id,
      type: data.type as ReportType,
      coordinates: {
        lat: data.lat,
        lng: data.lng
      },
      timestamp: new Date(data.created_at).getTime()
    };
  } catch (err: any) {
    console.warn('Local Mode (createReport): Backend unavailable.');
    return localReport;
  }
};
