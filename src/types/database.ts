/**
 * Supabase database types for supabase/migrations (0001 + 0002).
 * After the project exists you can regenerate them with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 * Numeric columns are returned by PostgREST as JSON numbers.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MealTypeDb = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type UnitSystemDb = 'metric' | 'imperial';
export type ThemeDb = 'system' | 'light' | 'dark';
export type LanguageDb = 'en-US' | 'pt-BR' | 'es';
export type GoalDb = 'lose' | 'maintain' | 'gain';
export type SexDb = 'female' | 'male';
export type ActivityLevelDb = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FoodSourceDb = 'user' | 'usda' | 'open_food_facts';

type Table<Row, Insert, Update, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          display_name: string | null;
          email: string | null;
          language: LanguageDb;
          country: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        },
        never,
        {
          display_name?: string | null;
          language?: LanguageDb;
          country?: string | null;
          onboarding_completed_at?: string | null;
        }
      >;
      user_preferences: Table<
        {
          user_id: string;
          unit_system: UnitSystemDb;
          notification_preferences: Json;
          theme: ThemeDb;
          updated_at: string;
        },
        {
          user_id: string;
          unit_system?: UnitSystemDb;
          notification_preferences?: Json;
          theme?: ThemeDb;
        },
        {
          unit_system?: UnitSystemDb;
          notification_preferences?: Json;
          theme?: ThemeDb;
        }
      >;
      health_profiles: Table<
        {
          user_id: string;
          goal: GoalDb | null;
          sex: SexDb | null;
          birth_year: number | null;
          height_cm: number | null;
          activity_level: ActivityLevelDb | null;
          updated_at: string;
        },
        {
          user_id: string;
          goal?: GoalDb | null;
          sex?: SexDb | null;
          birth_year?: number | null;
          height_cm?: number | null;
          activity_level?: ActivityLevelDb | null;
        },
        {
          goal?: GoalDb | null;
          sex?: SexDb | null;
          birth_year?: number | null;
          height_cm?: number | null;
          activity_level?: ActivityLevelDb | null;
        }
      >;
      nutrition_goals: Table<
        {
          user_id: string;
          daily_calorie_target: number;
          protein_target: number | null;
          carb_target: number | null;
          fat_target: number | null;
          source: 'estimate' | 'manual';
          updated_at: string;
        },
        {
          user_id: string;
          daily_calorie_target: number;
          protein_target?: number | null;
          carb_target?: number | null;
          fat_target?: number | null;
          source?: 'estimate' | 'manual';
        },
        {
          daily_calorie_target?: number;
          protein_target?: number | null;
          carb_target?: number | null;
          fat_target?: number | null;
          source?: 'estimate' | 'manual';
        }
      >;
      foods: Table<
        {
          id: string;
          name: string;
          brand: string | null;
          barcode: string | null;
          calories_per_100g: number;
          protein_per_100g: number | null;
          carbs_per_100g: number | null;
          fat_per_100g: number | null;
          source: FoodSourceDb;
          source_id: string | null;
          created_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          brand?: string | null;
          barcode?: string | null;
          calories_per_100g: number;
          protein_per_100g?: number | null;
          carbs_per_100g?: number | null;
          fat_per_100g?: number | null;
          source?: 'user';
          created_by: string;
        },
        {
          name?: string;
          brand?: string | null;
          barcode?: string | null;
          calories_per_100g?: number;
          protein_per_100g?: number | null;
          carbs_per_100g?: number | null;
          fat_per_100g?: number | null;
        }
      >;
      meal_entries: Table<
        {
          id: string;
          user_id: string;
          meal_type: MealTypeDb;
          consumed_at: string;
          created_at: string;
        },
        { id?: string; user_id?: string; meal_type: MealTypeDb; consumed_at?: string },
        { meal_type?: MealTypeDb; consumed_at?: string }
      >;
      meal_items: Table<
        {
          id: string;
          meal_entry_id: string;
          food_id: string;
          quantity_grams: number;
          calculated_calories: number;
          calculated_protein: number | null;
          calculated_carbs: number | null;
          calculated_fat: number | null;
          created_at: string;
        },
        { meal_entry_id: string; food_id: string; quantity_grams: number },
        { quantity_grams?: number },
        [
          {
            foreignKeyName: 'meal_items_meal_entry_id_fkey';
            columns: ['meal_entry_id'];
            isOneToOne: false;
            referencedRelation: 'meal_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_items_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
        ]
      >;
      favorite_meals: Table<
        {
          id: string;
          user_id: string;
          name: string;
          meal_type: MealTypeDb | null;
          created_at: string;
        },
        { id?: string; user_id?: string; name: string; meal_type?: MealTypeDb | null },
        { name?: string; meal_type?: MealTypeDb | null }
      >;
      favorite_meal_items: Table<
        { id: string; favorite_meal_id: string; food_id: string; quantity_grams: number },
        { favorite_meal_id: string; food_id: string; quantity_grams: number },
        { quantity_grams?: number },
        [
          {
            foreignKeyName: 'favorite_meal_items_favorite_meal_id_fkey';
            columns: ['favorite_meal_id'];
            isOneToOne: false;
            referencedRelation: 'favorite_meals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorite_meal_items_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
        ]
      >;
      weight_logs: Table<
        { id: string; user_id: string; weight_kg: number; recorded_at: string; created_at: string },
        { id?: string; user_id?: string; weight_kg: number; recorded_at?: string },
        { weight_kg?: number; recorded_at?: string }
      >;
      user_entitlements: Table<
        {
          user_id: string;
          entitlement: 'pro';
          expires_at: string | null;
          source: 'app_store' | 'play_store' | 'revenuecat' | 'manual_grant';
          updated_at: string;
        },
        never,
        never
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      has_pro_access: { Args: Record<string, never>; Returns: boolean };
      delete_own_account: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
