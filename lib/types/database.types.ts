// Generated from the Evergreen Run Supabase schema.
// Regenerate with: npx supabase gen types typescript --project-id <ref> > lib/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      calculator_lead: {
        Row: {
          created_at: string
          email: string
          id: string
          score: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          score?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          score?: number | null
        }
        Relationships: []
      }
      consent_record: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string
          id: string
          policy_version: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          granted_at?: string
          id?: string
          policy_version?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string
          id?: string
          policy_version?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_record_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      durability_index_snapshot: {
        Row: {
          breakdown: Json | null
          computed_at: string
          consistency_subscore: number | null
          created_at: string
          id: string
          load_subscore: number | null
          readiness_subscore: number | null
          rule_set_version: string
          score: number
          strength_subscore: number | null
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          computed_at?: string
          consistency_subscore?: number | null
          created_at?: string
          id?: string
          load_subscore?: number | null
          readiness_subscore?: number | null
          rule_set_version: string
          score: number
          strength_subscore?: number | null
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          computed_at?: string
          consistency_subscore?: number | null
          created_at?: string
          id?: string
          load_subscore?: number | null
          readiness_subscore?: number | null
          rule_set_version?: string
          score?: number
          strength_subscore?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "durability_index_snapshot_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise: {
        Row: {
          block: string | null
          category: string | null
          contraindication_flags: string[]
          created_at: string
          id: string
          instructions: string | null
          name: string
          progression_of: string | null
          regression_of: string | null
          slug: string
          tempo: string | null
          updated_at: string
        }
        Insert: {
          block?: string | null
          category?: string | null
          contraindication_flags?: string[]
          created_at?: string
          id?: string
          instructions?: string | null
          name: string
          progression_of?: string | null
          regression_of?: string | null
          slug: string
          tempo?: string | null
          updated_at?: string
        }
        Update: {
          block?: string | null
          category?: string | null
          contraindication_flags?: string[]
          created_at?: string
          id?: string
          instructions?: string | null
          name?: string
          progression_of?: string | null
          regression_of?: string | null
          slug?: string
          tempo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_progression_of_fkey"
            columns: ["progression_of"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_regression_of_fkey"
            columns: ["regression_of"]
            isOneToOne: false
            referencedRelation: "exercise"
            referencedColumns: ["id"]
          },
        ]
      }
      feel_log: {
        Row: {
          confidence: number | null
          created_at: string
          fatigue: number | null
          id: string
          logged_at: string
          morning_stiffness: number | null
          notes: string | null
          pain_area: string | null
          pain_intensity: number | null
          soreness: number | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          fatigue?: number | null
          id?: string
          logged_at?: string
          morning_stiffness?: number | null
          notes?: string | null
          pain_area?: string | null
          pain_intensity?: number | null
          soreness?: number | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          fatigue?: number | null
          id?: string
          logged_at?: string
          morning_stiffness?: number | null
          notes?: string | null
          pain_area?: string | null
          pain_intensity?: number | null
          soreness?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feel_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          created_at: string
          id: string
          program: string | null
          rule_set_version: string
          status: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          program?: string | null
          rule_set_version: string
          status?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          program?: string | null
          rule_set_version?: string
          status?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_session: {
        Row: {
          completed: boolean
          created_at: string
          day_of_week: number | null
          id: string
          notes: string | null
          plan_id: string
          run_activity_id: string | null
          session_type: string
          target_distance_m: number | null
          target_duration_s: number | null
          target_zone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          day_of_week?: number | null
          id?: string
          notes?: string | null
          plan_id: string
          run_activity_id?: string | null
          session_type: string
          target_distance_m?: number | null
          target_duration_s?: number | null
          target_zone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          day_of_week?: number | null
          id?: string
          notes?: string | null
          plan_id?: string
          run_activity_id?: string | null
          session_type?: string
          target_distance_m?: number | null
          target_duration_s?: number | null
          target_zone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_session_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_session_run_activity_id_fkey"
            columns: ["run_activity_id"]
            isOneToOne: false
            referencedRelation: "run_activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      red_flag_event: {
        Row: {
          action_taken: string | null
          created_at: string
          feel_log_id: string | null
          id: string
          reason: string | null
          rule_set_version: string | null
          severity: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          feel_log_id?: string | null
          id?: string
          reason?: string | null
          rule_set_version?: string | null
          severity: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          feel_log_id?: string | null
          id?: string
          reason?: string | null
          rule_set_version?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "red_flag_event_feel_log_id_fkey"
            columns: ["feel_log_id"]
            isOneToOne: false
            referencedRelation: "feel_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "red_flag_event_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_set: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          published_at: string | null
          version: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          published_at?: string | null
          version: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          published_at?: string | null
          version?: string
        }
        Relationships: []
      }
      run_activity: {
        Row: {
          avg_hr: number | null
          avg_pace_s_per_km: number | null
          created_at: string
          distance_m: number | null
          duration_s: number | null
          id: string
          raw_payload: Json | null
          rpe: number | null
          source: string
          source_hash: string | null
          started_at: string | null
          talk_test: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_hr?: number | null
          avg_pace_s_per_km?: number | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          raw_payload?: Json | null
          rpe?: number | null
          source?: string
          source_hash?: string | null
          started_at?: string | null
          talk_test?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_hr?: number | null
          avg_pace_s_per_km?: number | null
          created_at?: string
          distance_m?: number | null
          duration_s?: number | null
          id?: string
          raw_payload?: Json | null
          rpe?: number | null
          source?: string
          source_hash?: string | null
          started_at?: string | null
          talk_test?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      runner_profile: {
        Row: {
          age_band: string | null
          created_at: string
          display_name: string | null
          experience_level: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_band?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_band?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runner_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_profile: {
        Row: {
          contraindications: string[]
          created_at: string
          id: string
          injury_history: Json
          notes: string | null
          red_flag_baseline: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          contraindications?: string[]
          created_at?: string
          id?: string
          injury_history?: Json
          notes?: string | null
          red_flag_baseline?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          contraindications?: string[]
          created_at?: string
          id?: string
          injury_history?: Json
          notes?: string | null
          red_flag_baseline?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strength_session: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          performed_at: string
          session_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          session_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_at?: string
          session_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strength_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      weekly_load: {
        Row: {
          acute_load: number | null
          chronic_load: number | null
          created_at: string
          hard_days: number
          id: string
          total_distance_m: number
          total_duration_s: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          acute_load?: number | null
          chronic_load?: number | null
          created_at?: string
          hard_days?: number
          id?: string
          total_distance_m?: number
          total_duration_s?: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          acute_load?: number | null
          chronic_load?: number | null
          created_at?: string
          hard_days?: number
          id?: string
          total_distance_m?: number
          total_duration_s?: number
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_load_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
