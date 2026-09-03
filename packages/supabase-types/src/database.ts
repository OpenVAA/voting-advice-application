export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_jobs: {
        Row: {
          author: string;
          created_at: string;
          election_id: string | null;
          end_status: string;
          end_time: string | null;
          id: string;
          input: Json | null;
          job_id: string;
          job_type: string;
          messages: Json | null;
          metadata: Json | null;
          output: Json | null;
          project_id: string;
          start_time: string | null;
          updated_at: string;
        };
        Insert: {
          author: string;
          created_at?: string;
          election_id?: string | null;
          end_status: string;
          end_time?: string | null;
          id?: string;
          input?: Json | null;
          job_id: string;
          job_type: string;
          messages?: Json | null;
          metadata?: Json | null;
          output?: Json | null;
          project_id: string;
          start_time?: string | null;
          updated_at?: string;
        };
        Update: {
          author?: string;
          created_at?: string;
          election_id?: string | null;
          end_status?: string;
          end_time?: string | null;
          id?: string;
          input?: Json | null;
          job_id?: string;
          job_type?: string;
          messages?: Json | null;
          metadata?: Json | null;
          output?: Json | null;
          project_id?: string;
          start_time?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_jobs_election_id_fkey';
            columns: ['election_id'];
            isOneToOne: false;
            referencedRelation: 'elections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admin_jobs_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      alliances: {
        Row: {
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alliances_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      app_settings: {
        Row: {
          created_at: string;
          customization: Json | null;
          external_id: string | null;
          id: string;
          project_id: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customization?: Json | null;
          external_id?: string | null;
          id?: string;
          project_id: string;
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customization?: Json | null;
          external_id?: string | null;
          id?: string;
          project_id?: string;
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_settings_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: true;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      candidates: {
        Row: {
          answers: Json | null;
          auth_user_id: string | null;
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          first_name: string;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          last_name: string;
          organization_id: string | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          terms_of_use_accepted: string | null;
          updated_at: string;
        };
        Insert: {
          answers?: Json | null;
          auth_user_id?: string | null;
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          first_name: string;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          last_name: string;
          organization_id?: string | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          terms_of_use_accepted?: string | null;
          updated_at?: string;
        };
        Update: {
          answers?: Json | null;
          auth_user_id?: string | null;
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          first_name?: string;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          last_name?: string;
          organization_id?: string | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          terms_of_use_accepted?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      constituencies: {
        Row: {
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          keywords: Json | null;
          name: Json | null;
          parent_id: string | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          keywords?: Json | null;
          name?: Json | null;
          parent_id?: string | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          keywords?: Json | null;
          name?: Json | null;
          parent_id?: string | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'constituencies_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'constituencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'constituencies_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      constituency_group_constituencies: {
        Row: {
          constituency_group_id: string;
          constituency_id: string;
        };
        Insert: {
          constituency_group_id: string;
          constituency_id: string;
        };
        Update: {
          constituency_group_id?: string;
          constituency_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'constituency_group_constituencies_constituency_group_id_fkey';
            columns: ['constituency_group_id'];
            isOneToOne: false;
            referencedRelation: 'constituency_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'constituency_group_constituencies_constituency_id_fkey';
            columns: ['constituency_id'];
            isOneToOne: false;
            referencedRelation: 'constituencies';
            referencedColumns: ['id'];
          }
        ];
      };
      constituency_groups: {
        Row: {
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'constituency_groups_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      election_constituency_groups: {
        Row: {
          constituency_group_id: string;
          election_id: string;
        };
        Insert: {
          constituency_group_id: string;
          election_id: string;
        };
        Update: {
          constituency_group_id?: string;
          election_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'election_constituency_groups_constituency_group_id_fkey';
            columns: ['constituency_group_id'];
            isOneToOne: false;
            referencedRelation: 'constituency_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'election_constituency_groups_election_id_fkey';
            columns: ['election_id'];
            isOneToOne: false;
            referencedRelation: 'elections';
            referencedColumns: ['id'];
          }
        ];
      };
      elections: {
        Row: {
          color: Json | null;
          created_at: string;
          current_round: number | null;
          custom_data: Json | null;
          election_date: string | null;
          election_start_date: string | null;
          election_type: string | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          multiple_rounds: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          color?: Json | null;
          created_at?: string;
          current_round?: number | null;
          custom_data?: Json | null;
          election_date?: string | null;
          election_start_date?: string | null;
          election_type?: string | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          multiple_rounds?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          color?: Json | null;
          created_at?: string;
          current_round?: number | null;
          custom_data?: Json | null;
          election_date?: string | null;
          election_start_date?: string | null;
          election_type?: string | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          multiple_rounds?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'elections_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      factions: {
        Row: {
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'factions_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      feedback: {
        Row: {
          created_at: string;
          date: string;
          description: string | null;
          id: string;
          project_id: string;
          rating: number | null;
          url: string | null;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          project_id: string;
          rating?: number | null;
          url?: string | null;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          project_id?: string;
          rating?: number | null;
          url?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      nominations: {
        Row: {
          alliance_id: string | null;
          candidate_id: string | null;
          color: Json | null;
          constituency_id: string;
          created_at: string;
          custom_data: Json | null;
          election_id: string;
          election_round: number | null;
          election_symbol: string | null;
          entity_type: Database['public']['Enums']['entity_type'];
          external_id: string | null;
          faction_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          organization_id: string | null;
          parent_nomination_id: string | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          unconfirmed: boolean | null;
          updated_at: string;
        };
        Insert: {
          alliance_id?: string | null;
          candidate_id?: string | null;
          color?: Json | null;
          constituency_id: string;
          created_at?: string;
          custom_data?: Json | null;
          election_id: string;
          election_round?: number | null;
          election_symbol?: string | null;
          entity_type?: Database['public']['Enums']['entity_type'];
          external_id?: string | null;
          faction_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          organization_id?: string | null;
          parent_nomination_id?: string | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          unconfirmed?: boolean | null;
          updated_at?: string;
        };
        Update: {
          alliance_id?: string | null;
          candidate_id?: string | null;
          color?: Json | null;
          constituency_id?: string;
          created_at?: string;
          custom_data?: Json | null;
          election_id?: string;
          election_round?: number | null;
          election_symbol?: string | null;
          entity_type?: Database['public']['Enums']['entity_type'];
          external_id?: string | null;
          faction_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          organization_id?: string | null;
          parent_nomination_id?: string | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          unconfirmed?: boolean | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nominations_alliance_id_fkey';
            columns: ['alliance_id'];
            isOneToOne: false;
            referencedRelation: 'alliances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_candidate_id_fkey';
            columns: ['candidate_id'];
            isOneToOne: false;
            referencedRelation: 'candidates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_constituency_id_fkey';
            columns: ['constituency_id'];
            isOneToOne: false;
            referencedRelation: 'constituencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_election_id_fkey';
            columns: ['election_id'];
            isOneToOne: false;
            referencedRelation: 'elections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_faction_id_fkey';
            columns: ['faction_id'];
            isOneToOne: false;
            referencedRelation: 'factions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_parent_nomination_id_fkey';
            columns: ['parent_nomination_id'];
            isOneToOne: false;
            referencedRelation: 'nominations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nominations_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      organizations: {
        Row: {
          answers: Json | null;
          auth_user_id: string | null;
          color: Json | null;
          created_at: string;
          custom_data: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          answers?: Json | null;
          auth_user_id?: string | null;
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          answers?: Json | null;
          auth_user_id?: string | null;
          color?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      projects: {
        Row: {
          account_id: string;
          created_at: string;
          default_locale: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          default_locale?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          default_locale?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          }
        ];
      };
      question_categories: {
        Row: {
          category_type: Database['public']['Enums']['category_type'] | null;
          color: Json | null;
          constituency_ids: Json | null;
          created_at: string;
          custom_data: Json | null;
          election_ids: Json | null;
          election_rounds: Json | null;
          entity_type: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          updated_at: string;
        };
        Insert: {
          category_type?: Database['public']['Enums']['category_type'] | null;
          color?: Json | null;
          constituency_ids?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          election_ids?: Json | null;
          election_rounds?: Json | null;
          entity_type?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Update: {
          category_type?: Database['public']['Enums']['category_type'] | null;
          color?: Json | null;
          constituency_ids?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          election_ids?: Json | null;
          election_rounds?: Json | null;
          entity_type?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'question_categories_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      questions: {
        Row: {
          allow_open: boolean | null;
          category_id: string;
          choices: Json | null;
          color: Json | null;
          constituency_ids: Json | null;
          created_at: string;
          custom_data: Json | null;
          election_ids: Json | null;
          election_rounds: Json | null;
          entity_type: Json | null;
          external_id: string | null;
          id: string;
          image: Json | null;
          info: Json | null;
          is_generated: boolean | null;
          name: Json | null;
          project_id: string;
          published: boolean;
          required: boolean | null;
          settings: Json | null;
          short_name: Json | null;
          sort_order: number | null;
          subtype: string | null;
          type: Database['public']['Enums']['question_type'];
          updated_at: string;
        };
        Insert: {
          allow_open?: boolean | null;
          category_id: string;
          choices?: Json | null;
          color?: Json | null;
          constituency_ids?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          election_ids?: Json | null;
          election_rounds?: Json | null;
          entity_type?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id: string;
          published?: boolean;
          required?: boolean | null;
          settings?: Json | null;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          type: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Update: {
          allow_open?: boolean | null;
          category_id?: string;
          choices?: Json | null;
          color?: Json | null;
          constituency_ids?: Json | null;
          created_at?: string;
          custom_data?: Json | null;
          election_ids?: Json | null;
          election_rounds?: Json | null;
          entity_type?: Json | null;
          external_id?: string | null;
          id?: string;
          image?: Json | null;
          info?: Json | null;
          is_generated?: boolean | null;
          name?: Json | null;
          project_id?: string;
          published?: boolean;
          required?: boolean | null;
          settings?: Json | null;
          short_name?: Json | null;
          sort_order?: number | null;
          subtype?: string | null;
          type?: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'question_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'questions_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      storage_config: {
        Row: {
          key: string;
          value: string;
        };
        Insert: {
          key: string;
          value: string;
        };
        Update: {
          key?: string;
          value?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['user_role_type'];
          scope_id: string | null;
          scope_type: Database['public']['Enums']['role_scope_type'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['user_role_type'];
          scope_id?: string | null;
          scope_type: Database['public']['Enums']['role_scope_type'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role_type'];
          scope_id?: string | null;
          scope_type?: Database['public']['Enums']['role_scope_type'];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _bulk_upsert_record: {
        Args: { p_item: Json; p_project_id: string; p_table_name: string };
        Returns: boolean;
      };
      bulk_delete: { Args: { p_data: Json }; Returns: Json };
      bulk_import: { Args: { p_data: Json }; Returns: Json };
      can_access_project: { Args: { p_project_id: string }; Returns: boolean };
      custom_access_token_hook: { Args: { p_event: Json }; Returns: Json };
      delete_storage_object: {
        Args: { p_bucket: string; p_file_path: string };
        Returns: undefined;
      };
      get_candidate_user_data: {
        Args: { p_entity_type?: Database['public']['Enums']['entity_type'] };
        Returns: {
          answers: Json;
          color: Json;
          custom_data: Json;
          first_name: string;
          id: string;
          image: Json;
          info: Json;
          last_name: string;
          name: Json;
          organization_id: string;
          project_id: string;
          short_name: Json;
          sort_order: number;
          subtype: string;
          terms_of_use_accepted: string;
        }[];
      };
      get_localized: {
        Args: { p_default_locale?: string; p_locale: string; p_val: Json };
        Returns: string;
      };
      get_nominations: {
        Args: {
          p_constituency_id?: string;
          p_election_id?: string;
          p_election_round?: number;
          p_include_unconfirmed?: boolean;
        };
        Returns: {
          alliance_id: string;
          candidate_id: string;
          color: Json;
          constituency_id: string;
          custom_data: Json;
          election_id: string;
          election_round: number;
          election_symbol: string;
          entity_answers: Json;
          entity_color: Json;
          entity_custom_data: Json;
          entity_first_name: string;
          entity_id: string;
          entity_image: Json;
          entity_info: Json;
          entity_last_name: string;
          entity_name: Json;
          entity_organization_id: string;
          entity_short_name: Json;
          entity_sort_order: number;
          entity_subtype: string;
          entity_type: Database['public']['Enums']['entity_type'];
          faction_id: string;
          id: string;
          image: Json;
          info: Json;
          name: Json;
          organization_id: string;
          parent_nomination_id: string;
          short_name: Json;
          sort_order: number;
          subtype: string;
        }[];
      };
      get_questions: {
        Args: {
          p_constituency_id?: string;
          p_election_id?: string;
          p_election_round?: number;
        };
        Returns: Json;
      };
      has_role: {
        Args: {
          p_check_role: Database['public']['Enums']['user_role_type'];
          p_check_scope_id?: string;
          p_check_scope_type?: Database['public']['Enums']['role_scope_type'];
        };
        Returns: boolean;
      };
      is_candidate_self: {
        Args: { p_row_auth_user_id: string };
        Returns: boolean;
      };
      is_image: { Args: { p_val: Json }; Returns: boolean };
      is_localized_string: { Args: { p_val: Json }; Returns: boolean };
      is_storage_entity_published: {
        Args: { p_entity_id_segment: string; p_entity_type_segment: string };
        Returns: boolean;
      };
      is_valid_choice_id: {
        Args: { p_valid_choices: Json; p_value: Json };
        Returns: boolean;
      };
      jsonb_recursive_merge: {
        Args: { p_base: Json; p_patch: Json };
        Returns: Json;
      };
      merge_jsonb_column: {
        Args: {
          p_column_name: string;
          p_partial_data: Json;
          p_row_id: string;
          p_table_name: string;
        };
        Returns: undefined;
      };
      merge_question_custom_data: {
        Args: { p_patch: Json; p_question_id: string };
        Returns: Json;
      };
      resolve_email_variables: {
        Args: {
          p_template_body?: string;
          p_template_subject?: string;
          p_user_ids: string[];
        };
        Returns: {
          email: string;
          preferred_locale: string;
          user_id: string;
          variables: Json;
        }[];
      };
      resolve_external_ref: {
        Args: { p_project_id: string; p_ref: Json; p_target_table: string };
        Returns: string;
      };
      upsert_answers: {
        Args: { p_answers: Json; p_entity_id: string; p_overwrite?: boolean };
        Returns: Json;
      };
      validate_answer_value: {
        Args: {
          p_answer_val: Json;
          p_q_type: Database['public']['Enums']['question_type'];
          p_valid_choices?: Json;
        };
        Returns: undefined;
      };
      validate_image: { Args: { p_val: Json }; Returns: undefined };
    };
    Enums: {
      category_type: 'info' | 'opinion' | 'default';
      entity_type: 'candidate' | 'organization' | 'faction' | 'alliance';
      question_type:
        | 'text'
        | 'number'
        | 'boolean'
        | 'image'
        | 'date'
        | 'multipleText'
        | 'singleChoiceOrdinal'
        | 'singleChoiceCategorical'
        | 'multipleChoiceCategorical';
      role_scope_type: 'candidate' | 'organization' | 'project' | 'account' | 'global';
      user_role_type: 'candidate' | 'organization' | 'project_admin' | 'account_admin' | 'super_admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {
      category_type: ['info', 'opinion', 'default'],
      entity_type: ['candidate', 'organization', 'faction', 'alliance'],
      question_type: [
        'text',
        'number',
        'boolean',
        'image',
        'date',
        'multipleText',
        'singleChoiceOrdinal',
        'singleChoiceCategorical',
        'multipleChoiceCategorical'
      ],
      role_scope_type: ['candidate', 'organization', 'project', 'account', 'global'],
      user_role_type: ['candidate', 'organization', 'project_admin', 'account_admin', 'super_admin']
    }
  }
} as const;
