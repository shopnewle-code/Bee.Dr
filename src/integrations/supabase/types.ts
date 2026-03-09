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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          ai_notes: string | null
          appointment_date: string
          appointment_type: string
          consultation_notes: string | null
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          prescription: string | null
          reason: string | null
          start_time: string
          status: string
          symptoms: string[] | null
          triage_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_notes?: string | null
          appointment_date: string
          appointment_type?: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          prescription?: string | null
          reason?: string | null
          start_time: string
          status?: string
          symptoms?: string[] | null
          triage_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_notes?: string | null
          appointment_date?: string
          appointment_type?: string
          consultation_notes?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          prescription?: string | null
          reason?: string | null
          start_time?: string
          status?: string
          symptoms?: string[] | null
          triage_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          mode: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          image_url: string | null
          is_bookmarked: boolean | null
          message: string
          response: string | null
          scan_id: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_bookmarked?: boolean | null
          message: string
          response?: string | null
          scan_id?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_bookmarked?: boolean | null
          message?: string
          response?: string | null
          scan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          ai_summary: string | null
          appointment_time: string | null
          consultation_type: string
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          appointment_time?: string | null
          consultation_type?: string
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          appointment_time?: string | null
          consultation_type?: string
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          created_at: string
          date: string
          energy: number | null
          exercise_minutes: number | null
          id: string
          mood: number | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          symptoms: string[] | null
          user_id: string
          water_glasses: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          energy?: number | null
          exercise_minutes?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id: string
          water_glasses?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          energy?: number | null
          exercise_minutes?: number | null
          id?: string
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          symptoms?: string[] | null
          user_id?: string
          water_glasses?: number | null
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean
          slot_duration_minutes: number
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string
          experience_years: number | null
          id: string
          is_available: boolean | null
          languages: string[] | null
          location: string | null
          name: string
          rating: number | null
          specialization: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          location?: string | null
          name: string
          rating?: number | null
          specialization: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          location?: string | null
          name?: string
          rating?: number | null
          specialization?: string
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          is_dismissed: boolean
          scan_id: string | null
          test_name: string | null
          test_value: number | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          description: string
          id?: string
          is_dismissed?: boolean
          scan_id?: string | null
          test_name?: string | null
          test_value?: number | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          is_dismissed?: boolean
          scan_id?: string | null
          test_name?: string | null
          test_value?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          age: number | null
          blood_group: string | null
          created_at: string
          gender: string | null
          health_score: number | null
          id: string
          name: string
          owner_id: string
          relation: string
          risk_summary: Json | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          blood_group?: string | null
          created_at?: string
          gender?: string | null
          health_score?: number | null
          id?: string
          name: string
          owner_id: string
          relation: string
          risk_summary?: Json | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          blood_group?: string | null
          created_at?: string
          gender?: string | null
          health_score?: number | null
          id?: string
          name?: string
          owner_id?: string
          relation?: string
          risk_summary?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      health_habits: {
        Row: {
          created_at: string
          date: string
          habit_type: string
          id: string
          target: number | null
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          date?: string
          habit_type: string
          id?: string
          target?: number | null
          unit?: string | null
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          date?: string
          habit_type?: string
          id?: string
          target?: number | null
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      health_insights: {
        Row: {
          details: Json | null
          generated_at: string
          id: string
          risk_score: number
          risk_type: string
          user_id: string
        }
        Insert: {
          details?: Json | null
          generated_at?: string
          id?: string
          risk_score?: number
          risk_type: string
          user_id: string
        }
        Update: {
          details?: Json | null
          generated_at?: string
          id?: string
          risk_score?: number
          risk_type?: string
          user_id?: string
        }
        Relationships: []
      }
      health_profiles: {
        Row: {
          address: string | null
          alcohol: string | null
          allergies: string[] | null
          blood_group: string | null
          chronic_conditions: string[] | null
          city: string | null
          country: string | null
          created_at: string
          diet_type: string | null
          exercise_frequency: string | null
          family_disease_history: string[] | null
          height_cm: number | null
          id: string
          phone: string | null
          sleep_pattern: string | null
          smoking: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          alcohol?: string | null
          allergies?: string[] | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          exercise_frequency?: string | null
          family_disease_history?: string[] | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          sleep_pattern?: string | null
          smoking?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          alcohol?: string | null
          allergies?: string[] | null
          blood_group?: string | null
          chronic_conditions?: string[] | null
          city?: string | null
          country?: string | null
          created_at?: string
          diet_type?: string | null
          exercise_frequency?: string | null
          family_disease_history?: string[] | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          sleep_pattern?: string | null
          smoking?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          start_date: string | null
          time_of_day: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          start_date?: string | null
          time_of_day?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          start_date?: string | null
          time_of_day?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          delivery_available: boolean
          delivery_radius_km: number | null
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          license_number: string | null
          logo_url: string | null
          name: string
          operating_hours: Json | null
          owner_id: string
          phone: string | null
          rating: number | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          owner_id: string
          phone?: string | null
          rating?: number | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_radius_km?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          owner_id?: string
          phone?: string | null
          rating?: number | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pharmacy_orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_type: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          pharmacy_id: string
          prescription_url: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          pharmacy_id: string
          prescription_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_type?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          pharmacy_id?: string
          prescription_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          dosage: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_available: boolean
          manufacturer: string | null
          min_stock_alert: number | null
          mrp: number | null
          name: string
          pharmacy_id: string
          price: number
          requires_prescription: boolean
          stock_quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          manufacturer?: string | null
          min_stock_alert?: number | null
          mrp?: number | null
          name: string
          pharmacy_id: string
          price?: number
          requires_prescription?: boolean
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          dosage?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          manufacturer?: string | null
          min_stock_alert?: number | null
          mrp?: number | null
          name?: string
          pharmacy_id?: string
          price?: number
          requires_prescription?: boolean
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_products_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          gender: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          batch_id: string | null
          created_at: string
          file_name: string
          id: string
          insights: Json | null
          raw_data: Json | null
          recommendations: Json | null
          report_type: string | null
          risk_scores: Json | null
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          insights?: Json | null
          raw_data?: Json | null
          recommendations?: Json | null
          report_type?: string | null
          risk_scores?: Json | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          insights?: Json | null
          raw_data?: Json | null
          recommendations?: Json | null
          report_type?: string | null
          risk_scores?: Json | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skin_scans: {
        Row: {
          analysis: Json | null
          created_at: string
          id: string
          image_path: string
          risk_level: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          id?: string
          image_path: string
          risk_level?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          id?: string
          image_path?: string
          risk_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telemedicine_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          message_type: string
          sender_id: string
          sender_role: string
          session_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          message_type?: string
          sender_id: string
          sender_role?: string
          session_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          sender_id?: string
          sender_role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telemedicine_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_sessions: {
        Row: {
          ai_summary: string | null
          appointment_id: string | null
          created_at: string
          doctor_id: string
          ended_at: string | null
          id: string
          patient_id: string
          patient_rating: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          ai_summary?: string | null
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          ended_at?: string | null
          id?: string
          patient_id: string
          patient_rating?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          ai_summary?: string | null
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          ended_at?: string | null
          id?: string
          patient_id?: string
          patient_rating?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          created_at: string
          id: string
          normal_range_max: number | null
          normal_range_min: number | null
          result_value: number
          scan_id: string
          status: string
          test_name: string
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          normal_range_max?: number | null
          normal_range_min?: number | null
          result_value: number
          scan_id: string
          status?: string
          test_name: string
          unit?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          normal_range_max?: number | null
          normal_range_min?: number | null
          result_value?: number
          scan_id?: string
          status?: string
          test_name?: string
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          batch_number: string | null
          created_at: string
          date_administered: string | null
          id: string
          is_completed: boolean | null
          next_due_date: string | null
          notes: string | null
          provider: string | null
          user_id: string
          vaccine_name: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          date_administered?: string | null
          id?: string
          is_completed?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          provider?: string | null
          user_id: string
          vaccine_name: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          date_administered?: string | null
          id?: string
          is_completed?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          provider?: string | null
          user_id?: string
          vaccine_name?: string
        }
        Relationships: []
      }
      wearable_data: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          recorded_at: string
          source: string | null
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          recorded_at?: string
          source?: string | null
          unit?: string | null
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          recorded_at?: string
          source?: string | null
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
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
