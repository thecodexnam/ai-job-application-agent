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
      application_form_fields: {
        Row: {
          application_id: string
          created_at: string
          field_key: string
          field_type: string
          id: string
          label: string
          options: Json | null
          platform: string | null
          profile_mapping: string | null
          required: boolean
          selector: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          field_key: string
          field_type: string
          id?: string
          label: string
          options?: Json | null
          platform?: string | null
          profile_mapping?: string | null
          required?: boolean
          selector?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          field_key?: string
          field_type?: string
          id?: string
          label?: string
          options?: Json | null
          platform?: string | null
          profile_mapping?: string | null
          required?: boolean
          selector?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_form_fields_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      additional_info: {
        Row: {
          category: string
          created_at: string
          date: string | null
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization: string
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      educations: {
        Row: {
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string
          location: string | null
          order_index: number | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution: string
          location?: string | null
          order_index?: number | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string
          location?: string | null
          order_index?: number | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "educations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          application_mode: string | null
          application_status: string | null
          applied_at: string | null
          browser_session_id: string | null
          company_name: string
          confirmation_details: string | null
          cover_letter: string | null
          created_at: string
          current_step: string | null
          error_message: string | null
          form_data: Json | null
          id: string
          job_description: string | null
          job_id: string | null
          job_title: string
          job_url: string | null
          last_retry_at: string | null
          live_debug_url: string | null
          location: string | null
          match_score: number | null
          missing_fields: Json | null
          notes: string | null
          platform: string | null
          processing_started_at: string | null
          retry_count: number
          salary_range: string | null
          status: string
          submission_confirmed_at: string | null
          tailored_resume_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_mode?: string | null
          application_status?: string | null
          applied_at?: string | null
          browser_session_id?: string | null
          company_name: string
          confirmation_details?: string | null
          cover_letter?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          form_data?: Json | null
          id?: string
          job_description?: string | null
          job_id?: string | null
          job_title: string
          job_url?: string | null
          last_retry_at?: string | null
          live_debug_url?: string | null
          location?: string | null
          match_score?: number | null
          missing_fields?: Json | null
          notes?: string | null
          platform?: string | null
          processing_started_at?: string | null
          retry_count?: number
          salary_range?: string | null
          status?: string
          submission_confirmed_at?: string | null
          tailored_resume_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_mode?: string | null
          application_status?: string | null
          applied_at?: string | null
          browser_session_id?: string | null
          company_name?: string
          confirmation_details?: string | null
          cover_letter?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          form_data?: Json | null
          id?: string
          job_description?: string | null
          job_id?: string | null
          job_title?: string
          job_url?: string | null
          last_retry_at?: string | null
          live_debug_url?: string | null
          location?: string | null
          match_score?: number | null
          missing_fields?: Json | null
          notes?: string | null
          platform?: string | null
          processing_started_at?: string | null
          retry_count?: number
          salary_range?: string | null
          status?: string
          submission_confirmed_at?: string | null
          tailored_resume_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_tailored_resume_id_fkey"
            columns: ["tailored_resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_status: string | null
          company: string
          company_logo: string | null
          created_at: string
          description: string | null
          experience_level: string | null
          fetched_at: string
          id: string
          job_type: string | null
          job_url: string
          location: string | null
          match_score: number | null
          platform: string
          posted_at: string | null
          salary: string | null
          saved_status: boolean | null
          source_url: string | null
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          application_status?: string | null
          company: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          fetched_at?: string
          id?: string
          job_type?: string | null
          job_url: string
          location?: string | null
          match_score?: number | null
          platform: string
          posted_at?: string | null
          salary?: string | null
          saved_status?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          application_status?: string | null
          company?: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          fetched_at?: string
          id?: string
          job_type?: string | null
          job_url?: string
          location?: string | null
          match_score?: number | null
          platform?: string
          posted_at?: string | null
          salary?: string | null
          saved_status?: boolean | null
          source_url?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          category: string
          created_at: string
          id: string
          level: string | null
          name: string
          order_index: number | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          level?: string | null
          name: string
          order_index?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          order_index?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          additional_links: Json | null
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          notice_period: string | null
          phone: string | null
          portfolio_url: string | null
          requires_sponsorship: boolean | null
          salary_expectation: string | null
          skills: string[] | null
          summary: string | null
          target_roles: string[] | null
          updated_at: string
          work_authorization: string | null
        }
        Insert: {
          additional_links?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          notice_period?: string | null
          phone?: string | null
          portfolio_url?: string | null
          requires_sponsorship?: boolean | null
          salary_expectation?: string | null
          skills?: string[] | null
          summary?: string | null
          target_roles?: string[] | null
          updated_at?: string
          work_authorization?: string | null
        }
        Update: {
          additional_links?: Json | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          notice_period?: string | null
          phone?: string | null
          portfolio_url?: string | null
          requires_sponsorship?: boolean | null
          salary_expectation?: string | null
          skills?: string[] | null
          summary?: string | null
          target_roles?: string[] | null
          updated_at?: string
          work_authorization?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          github_url: string | null
          highlights: string[] | null
          id: string
          live_url: string | null
          order_index: number | null
          technologies: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          highlights?: string[] | null
          id?: string
          live_url?: string | null
          order_index?: number | null
          technologies?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          highlights?: string[] | null
          id?: string
          live_url?: string | null
          order_index?: number | null
          technologies?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_primary: boolean | null
          parsed_content: Json | null
          parsing_status: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          parsed_content?: Json | null
          parsing_status?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_primary?: boolean | null
          parsed_content?: Json | null
          parsing_status?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experiences: {
        Row: {
          company_name: string
          created_at: string
          description: string | null
          employment_type: string | null
          end_date: string | null
          highlights: string[] | null
          id: string
          is_current: boolean | null
          location: string | null
          order_index: number | null
          position: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          highlights?: string[] | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
