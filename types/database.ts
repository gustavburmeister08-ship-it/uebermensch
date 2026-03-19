// Supabase database type definitions
// Generated manually — replace with `supabase gen types typescript` after setup

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          phase: 'dissonance' | 'uncertainty' | 'discovery';
          level: '1.0' | '2.0' | '3.0';
          active_pillars: string[];
          onboarding_complete: boolean;
          subscription_tier: 'free' | 'pro';
          pillar_scores: Record<string, number>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          energy_level: number;
          note: string | null;
          completed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['check_ins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['check_ins']['Insert']>;
      };
      metric_entries: {
        Row: {
          id: string;
          check_in_id: string;
          user_id: string;
          metric_id: string;
          value: number;
          note: string | null;
          logged_at: string;
        };
        Insert: Omit<Database['public']['Tables']['metric_entries']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['metric_entries']['Insert']>;
      };
      directives: {
        Row: {
          id: string;
          user_id: string;
          pillar: string;
          title: string;
          body: string;
          why: string;
          action: string;
          model: string;
          generated_at: string;
          completed_at: string | null;
          skipped_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['directives']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['directives']['Insert']>;
      };
      weekly_audits: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          pillar_scores: Record<string, number>;
          highlights: string[];
          gaps: string[];
          directive_completion: number;
          ai_summary: string | null;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_audits']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['weekly_audits']['Insert']>;
      };
      onboarding_answers: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          answer: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['onboarding_answers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['onboarding_answers']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
