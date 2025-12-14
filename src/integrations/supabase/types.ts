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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_prompts: {
        Row: {
          agent_slug: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          limits: Json | null
          output_structure: string | null
          status: string
          system_prompt: string
          updated_at: string
          version: number
        }
        Insert: {
          agent_slug: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          limits?: Json | null
          output_structure?: string | null
          status?: string
          system_prompt: string
          updated_at?: string
          version?: number
        }
        Update: {
          agent_slug?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          limits?: Json | null
          output_structure?: string | null
          status?: string
          system_prompt?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_prompts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          category: string | null
          color: string
          core_function: string | null
          created_at: string
          description: string
          expected_inputs: string | null
          few_shot_examples: Json | null
          frequency_penalty: number | null
          icon: string
          id: string
          is_active: boolean
          is_featured: boolean | null
          is_public: boolean | null
          knowledge_base_ids: Json | null
          language: string | null
          max_characters: number | null
          max_tokens: number | null
          max_words: number | null
          min_words: number | null
          model_id: string | null
          name: string
          output_structure: string | null
          persona_backstory: string | null
          persona_name: string | null
          presence_penalty: number | null
          quality_rules: string | null
          role_definition: string | null
          slug: string
          sort_order: number | null
          system_prompt: string
          temperature: number | null
          tone: string | null
          top_p: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          color: string
          core_function?: string | null
          created_at?: string
          description: string
          expected_inputs?: string | null
          few_shot_examples?: Json | null
          frequency_penalty?: number | null
          icon: string
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_ids?: Json | null
          language?: string | null
          max_characters?: number | null
          max_tokens?: number | null
          max_words?: number | null
          min_words?: number | null
          model_id?: string | null
          name: string
          output_structure?: string | null
          persona_backstory?: string | null
          persona_name?: string | null
          presence_penalty?: number | null
          quality_rules?: string | null
          role_definition?: string | null
          slug: string
          sort_order?: number | null
          system_prompt: string
          temperature?: number | null
          tone?: string | null
          top_p?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string
          core_function?: string | null
          created_at?: string
          description?: string
          expected_inputs?: string | null
          few_shot_examples?: Json | null
          frequency_penalty?: number | null
          icon?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean | null
          is_public?: boolean | null
          knowledge_base_ids?: Json | null
          language?: string | null
          max_characters?: number | null
          max_tokens?: number | null
          max_words?: number | null
          min_words?: number | null
          model_id?: string | null
          name?: string
          output_structure?: string | null
          persona_backstory?: string | null
          persona_name?: string | null
          presence_penalty?: number | null
          quality_rules?: string | null
          role_definition?: string | null
          slug?: string
          sort_order?: number | null
          system_prompt?: string
          temperature?: number | null
          tone?: string | null
          top_p?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          active: boolean
          context_window: string
          cost_per_1k: string
          created_at: string
          description: string | null
          id: string
          max_tokens: string
          model_id: string
          name: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          context_window?: string
          cost_per_1k?: string
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: string
          model_id: string
          name: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          context_window?: string
          cost_per_1k?: string
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: string
          model_id?: string
          name?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          goals: string | null
          id: string
          name: string
          status: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          name: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goals?: string | null
          id?: string
          name?: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_results: {
        Row: {
          agent_slug: string
          campaign_id: string | null
          content: string
          created_at: string
          id: string
          is_favorite: boolean
          rating: number | null
          user_id: string
        }
        Insert: {
          agent_slug: string
          campaign_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          rating?: number | null
          user_id: string
        }
        Update: {
          agent_slug?: string
          campaign_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_results_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      headlines: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_favorite: boolean
          tags: string[] | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          tags?: string[] | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string
          id: string
          is_public: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description: string
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          credits_used: number
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          credits_used?: number
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          credits_used?: number
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      positioning_diagnoses: {
        Row: {
          created_at: string | null
          differentiators: string | null
          id: string
          niche: string
          target_audience: string
          user_id: string | null
          value_proposition: string | null
        }
        Insert: {
          created_at?: string | null
          differentiators?: string | null
          id?: string
          niche: string
          target_audience: string
          user_id?: string | null
          value_proposition?: string | null
        }
        Update: {
          created_at?: string | null
          differentiators?: string | null
          id?: string
          niche?: string
          target_audience?: string
          user_id?: string | null
          value_proposition?: string | null
        }
        Relationships: []
      }
      positioning_mappings: {
        Row: {
          block_1_audience: string | null
          block_10_transformation: string | null
          block_11_voice: string | null
          block_12_promises: string | null
          block_2_pain_points: string | null
          block_3_solution: string | null
          block_4_differentiators: string | null
          block_5_awareness_stage: string | null
          block_6_urgency: string | null
          block_7_social_proof: string | null
          block_8_objections: string | null
          block_9_emotional_connection: string | null
          completed_blocks: number
          conversation: Json
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_1_audience?: string | null
          block_10_transformation?: string | null
          block_11_voice?: string | null
          block_12_promises?: string | null
          block_2_pain_points?: string | null
          block_3_solution?: string | null
          block_4_differentiators?: string | null
          block_5_awareness_stage?: string | null
          block_6_urgency?: string | null
          block_7_social_proof?: string | null
          block_8_objections?: string | null
          block_9_emotional_connection?: string | null
          completed_blocks?: number
          conversation?: Json
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_1_audience?: string | null
          block_10_transformation?: string | null
          block_11_voice?: string | null
          block_12_promises?: string | null
          block_2_pain_points?: string | null
          block_3_solution?: string | null
          block_4_differentiators?: string | null
          block_5_awareness_stage?: string | null
          block_6_urgency?: string | null
          block_7_social_proof?: string | null
          block_8_objections?: string | null
          block_9_emotional_connection?: string | null
          completed_blocks?: number
          conversation?: Json
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          email: string
          first_name: string
          id: string
          level: number
          phone: string | null
          preferred_language: string | null
          stripe_customer_id: string | null
          subscription_status: string
          updated_at: string
          xp: number
        }
        Insert: {
          created_at?: string
          credits?: number
          email: string
          first_name: string
          id: string
          level?: number
          phone?: string | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string
          updated_at?: string
          xp?: number
        }
        Update: {
          created_at?: string
          credits?: number
          email?: string
          first_name?: string
          id?: string
          level?: number
          phone?: string | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      prompt_approvals: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string | null
          performed_by: string
          prompt_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          notes?: string | null
          performed_by: string
          prompt_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string
          prompt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_approvals_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_approvals_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "agent_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "pro" | "legend" | "admin"
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
    Enums: {
      app_role: ["user", "pro", "legend", "admin"],
    },
  },
} as const
