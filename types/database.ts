export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          initials: string;
          avatar_id: string | null;
          referral_code: string;
          onboarding_done: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          initials?: string;
          avatar_id?: string | null;
          referral_code: string;
          onboarding_done?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          initials?: string;
          avatar_id?: string | null;
          referral_code?: string;
          onboarding_done?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      session_segments: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          subject_name: string;
          started_at: string;
          ended_at: string | null;
          duration_secs: number | null;
          linked_todo_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          subject_name?: string;
          started_at: string;
          ended_at?: string | null;
          linked_todo_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          subject_name?: string;
          started_at?: string;
          ended_at?: string | null;
          linked_todo_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_segments_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "study_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_segments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_segments_linked_todo_id_fkey";
            columns: ["linked_todo_id"];
            isOneToOne: false;
            referencedRelation: "todos";
            referencedColumns: ["id"];
          },
        ];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          text: string;
          is_completed: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          text: string;
          is_completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          text?: string;
          is_completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      friend_requests: {
        Row: {
          id: string;
          requester_id: string;
          requested_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          requested_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          requested_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friend_requests_requested_id_fkey";
            columns: ["requested_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friend_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_user_a_fkey";
            columns: ["user_a"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_user_b_fkey";
            columns: ["user_b"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_friend_request: {
        Args: {
          request_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
