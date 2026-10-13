/**
 * Supabase database types.
 * Regenerate after changing the schema:
 *   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 * Hand-written to match supabase/migrations/0001_init.sql until the project exists.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          locale: string;
          unit_system: 'metric' | 'imperial';
          daily_calorie_goal: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          locale?: string;
          unit_system?: 'metric' | 'imperial';
          daily_calorie_goal?: number | null;
        };
        Update: {
          display_name?: string | null;
          locale?: string;
          unit_system?: 'metric' | 'imperial';
          daily_calorie_goal?: number | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
