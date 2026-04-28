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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audio_tracks: {
        Row: {
          artist: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          is_curated: boolean
          license: string | null
          mood: string
          name: string
          storage_path: string
          user_id: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_curated?: boolean
          license?: string | null
          mood?: string
          name: string
          storage_path: string
          user_id?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_curated?: boolean
          license?: string | null
          mood?: string
          name?: string
          storage_path?: string
          user_id?: string | null
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          address: string | null
          body_font: string | null
          business_name: string | null
          created_at: string
          default_cta: string | null
          default_music_mood: string | null
          default_voice_id: string | null
          email: string | null
          heading_font: string | null
          id: string
          logo_path: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          slogan: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          body_font?: string | null
          business_name?: string | null
          created_at?: string
          default_cta?: string | null
          default_music_mood?: string | null
          default_voice_id?: string | null
          email?: string | null
          heading_font?: string | null
          id?: string
          logo_path?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slogan?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          body_font?: string | null
          business_name?: string | null
          created_at?: string
          default_cta?: string | null
          default_music_mood?: string | null
          default_voice_id?: string | null
          email?: string | null
          heading_font?: string | null
          id?: string
          logo_path?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slogan?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      connected_integrations: {
        Row: {
          config: Json | null
          connected_at: string
          id: string
          integration_name: string
          status: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          connected_at?: string
          id?: string
          integration_name: string
          status?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          connected_at?: string
          id?: string
          integration_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          ai_generated: boolean
          assets: Json | null
          campaign_type: string
          channels: Json | null
          content_plan: Json | null
          created_at: string
          description: string | null
          goals: Json | null
          id: string
          name: string
          schedule: Json | null
          share_token: string | null
          status: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean
          assets?: Json | null
          campaign_type?: string
          channels?: Json | null
          content_plan?: Json | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          id?: string
          name: string
          schedule?: Json | null
          share_token?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean
          assets?: Json | null
          campaign_type?: string
          channels?: Json | null
          content_plan?: Json | null
          created_at?: string
          description?: string | null
          goals?: Json | null
          id?: string
          name?: string
          schedule?: Json | null
          share_token?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pitch_deck_slides: {
        Row: {
          content: Json | null
          created_at: string
          deck_id: string
          id: string
          notes: string | null
          slide_order: number
          slide_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          deck_id: string
          id?: string
          notes?: string | null
          slide_order?: number
          slide_type?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          deck_id?: string
          id?: string
          notes?: string | null
          slide_order?: number
          slide_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_deck_slides_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "pitch_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          share_token: string | null
          theme: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_token?: string | null
          theme?: Json | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          share_token?: string | null
          theme?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          run_count: number
          steps: Json
          trigger_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          steps?: Json
          trigger_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          steps?: Json
          trigger_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          ai_suggested: boolean
          attendees: string[] | null
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_focus_block: boolean
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_suggested?: boolean
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          is_focus_block?: boolean
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_suggested?: boolean
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_focus_block?: boolean
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_monthly_grant_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_grant_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_monthly_grant_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          ad_preset: string | null
          ai_generated: boolean
          campaign_id: string | null
          created_at: string
          description: string | null
          duration_type: string
          exported_video_url: string | null
          format: string
          id: string
          music_track_id: string | null
          music_volume: number | null
          platform: string
          script: Json | null
          share_token: string | null
          status: string
          storyboard: Json | null
          template_style: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          voiceover_id: string | null
        }
        Insert: {
          ad_preset?: string | null
          ai_generated?: boolean
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          duration_type?: string
          exported_video_url?: string | null
          format?: string
          id?: string
          music_track_id?: string | null
          music_volume?: number | null
          platform?: string
          script?: Json | null
          share_token?: string | null
          status?: string
          storyboard?: Json | null
          template_style?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          voiceover_id?: string | null
        }
        Update: {
          ad_preset?: string | null
          ai_generated?: boolean
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          duration_type?: string
          exported_video_url?: string | null
          format?: string
          id?: string
          music_track_id?: string | null
          music_volume?: number | null
          platform?: string
          script?: Json | null
          share_token?: string | null
          status?: string
          storyboard?: Json | null
          template_style?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          voiceover_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_projects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_projects_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "audio_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_projects_voiceover_id_fkey"
            columns: ["voiceover_id"]
            isOneToOne: false
            referencedRelation: "voiceovers"
            referencedColumns: ["id"]
          },
        ]
      }
      voiceovers: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          script: string | null
          source: string
          storage_path: string
          user_id: string
          video_id: string | null
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          script?: string | null
          source?: string
          storage_path: string
          user_id: string
          video_id?: string | null
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          script?: string | null
          source?: string
          storage_path?: string
          user_id?: string
          video_id?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voiceovers_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_deck_share_token: {
        Args: { p_deck_id: string }
        Returns: string
      }
      generate_video_share_token: {
        Args: { p_video_id: string }
        Returns: string
      }
      get_shared_campaign: {
        Args: { p_share_token: string }
        Returns: {
          ai_generated: boolean
          assets: Json
          campaign_type: string
          channels: Json
          content_plan: Json
          created_at: string
          description: string
          goals: Json
          id: string
          name: string
          schedule: Json
          status: string
          target_audience: string
          updated_at: string
        }[]
      }
      get_shared_deck: {
        Args: { p_share_token: string }
        Returns: {
          created_at: string
          description: string
          id: string
          slides: Json
          theme: Json
          title: string
          updated_at: string
        }[]
      }
      get_shared_video: {
        Args: { p_share_token: string }
        Returns: {
          ai_generated: boolean
          campaign_id: string
          created_at: string
          description: string
          duration_type: string
          format: string
          id: string
          platform: string
          script: Json
          status: string
          storyboard: Json
          title: string
          updated_at: string
        }[]
      }
      grant_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      spend_credits: {
        Args: { p_amount: number; p_description: string; p_user_id: string }
        Returns: boolean
      }
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
