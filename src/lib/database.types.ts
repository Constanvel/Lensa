/**
 * Generated from the schema in supabase/migrations. Do not edit by hand.
 *
 * Against a linked project:
 *   npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      blocks: {
        Row: {
          id: string
          essay_id: string
          position: number
          kind: string
          claim_kind: Database["public"]["Enums"]["claim_kind"]
          body: string
          margin_note: string | null
          covers_from: number | null
          covers_to: number | null
          revised_after_essay_id: string | null
        }
        Insert: {
          id?: string
          essay_id: string
          position: number
          kind?: string
          claim_kind?: Database["public"]["Enums"]["claim_kind"]
          body?: string
          margin_note?: string | null
          covers_from?: number | null
          covers_to?: number | null
          revised_after_essay_id?: string | null
        }
        Update: {
          id?: string
          essay_id?: string
          position?: number
          kind?: string
          claim_kind?: Database["public"]["Enums"]["claim_kind"]
          body?: string
          margin_note?: string | null
          covers_from?: number | null
          covers_to?: number | null
          revised_after_essay_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_revised_after_essay_id_fkey"
            columns: ["revised_after_essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          }
        ]
      }
      characters: {
        Row: {
          id: string
          slug: string
          name: string
          work_id: string
          description: string | null
          portrait_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          work_id: string
          description?: string | null
          portrait_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          work_id?: string
          description?: string | null
          portrait_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          }
        ]
      }
      citations: {
        Row: {
          id: string
          block_id: string
          work_id: string
          quote: string | null
          created_at: string
          chapter: number
        }
        Insert: {
          id?: string
          block_id: string
          work_id: string
          quote?: string | null
          created_at?: string
          chapter: number
        }
        Update: {
          id?: string
          block_id?: string
          work_id?: string
          quote?: string | null
          created_at?: string
          chapter?: number
        }
        Relationships: [
          {
            foreignKeyName: "citations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          }
        ]
      }
      claim_links: {
        Row: {
          claim_id: string
          essay_id: string
          stance: Database["public"]["Enums"]["stance"]
        }
        Insert: {
          claim_id: string
          essay_id: string
          stance: Database["public"]["Enums"]["stance"]
        }
        Update: {
          claim_id?: string
          essay_id?: string
          stance?: Database["public"]["Enums"]["stance"]
        }
        Relationships: [
          {
            foreignKeyName: "claim_links_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_links_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          }
        ]
      }
      claims: {
        Row: {
          id: string
          character_id: string
          text: string
          work_title: string
          locator: string
          created_at: string
        }
        Insert: {
          id?: string
          character_id: string
          text: string
          work_title: string
          locator: string
          created_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          text?: string
          work_title?: string
          locator?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          }
        ]
      }
      contests: {
        Row: {
          block_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          block_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          block_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contests_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      counterpoints: {
        Row: {
          id: string
          essay_id: string
          target_block_id: string
          claim: string
          strongest: string
          mark: Database["public"]["Enums"]["steelman_mark"] | null
          created_at: string
        }
        Insert: {
          id?: string
          essay_id: string
          target_block_id: string
          claim: string
          strongest: string
          mark?: Database["public"]["Enums"]["steelman_mark"] | null
          created_at?: string
        }
        Update: {
          id?: string
          essay_id?: string
          target_block_id?: string
          claim?: string
          strongest?: string
          mark?: Database["public"]["Enums"]["steelman_mark"] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counterpoints_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: true
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counterpoints_target_block_id_fkey"
            columns: ["target_block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          }
        ]
      }
      essays: {
        Row: {
          id: string
          slug: string | null
          author_id: string
          character_id: string
          title: string | null
          thesis: string | null
          lenses: Database["public"]["Enums"]["lens"][]
          spoiler_level: Database["public"]["Enums"]["spoiler_level"]
          status: Database["public"]["Enums"]["essay_status"]
          reading_minutes: number | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug?: string | null
          author_id: string
          character_id: string
          title?: string | null
          thesis?: string | null
          lenses?: Database["public"]["Enums"]["lens"][]
          spoiler_level?: Database["public"]["Enums"]["spoiler_level"]
          status?: Database["public"]["Enums"]["essay_status"]
          reading_minutes?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string | null
          author_id?: string
          character_id?: string
          title?: string | null
          thesis?: string | null
          lenses?: Database["public"]["Enums"]["lens"][]
          spoiler_level?: Database["public"]["Enums"]["spoiler_level"]
          status?: Database["public"]["Enums"]["essay_status"]
          reading_minutes?: number | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essays_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essays_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          }
        ]
      }
      lenses: {
        Row: {
          id: Database["public"]["Enums"]["lens"]
          name: string
          summary: string
          position: number
        }
        Insert: {
          id: Database["public"]["Enums"]["lens"]
          name: string
          summary: string
          position: number
        }
        Update: {
          id?: Database["public"]["Enums"]["lens"]
          name?: string
          summary?: string
          position?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          handle: string
          display_name: string
          bio: string | null
          lenses: Database["public"]["Enums"]["lens"][]
          onboarded_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          handle: string
          display_name: string
          bio?: string | null
          lenses?: Database["public"]["Enums"]["lens"][]
          onboarded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          handle?: string
          display_name?: string
          bio?: string | null
          lenses?: Database["public"]["Enums"]["lens"][]
          onboarded_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_progress: {
        Row: {
          user_id: string
          work_id: string
          position: number
        }
        Insert: {
          user_id: string
          work_id: string
          position?: number
        }
        Update: {
          user_id?: string
          work_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_progress_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          }
        ]
      }
      revisions: {
        Row: {
          id: string
          essay_id: string
          prompted_by_essay_id: string | null
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          essay_id: string
          prompted_by_essay_id?: string | null
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          essay_id?: string
          prompted_by_essay_id?: string | null
          note?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisions_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_prompted_by_essay_id_fkey"
            columns: ["prompted_by_essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          }
        ]
      }
      works: {
        Row: {
          id: string
          slug: string
          title: string
          creator: string | null
          medium: Database["public"]["Enums"]["medium"]
          year: number | null
          unit_label: string
          unit_count: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          creator?: string | null
          medium: Database["public"]["Enums"]["medium"]
          year?: number | null
          unit_label?: string
          unit_count?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          creator?: string | null
          medium?: Database["public"]["Enums"]["medium"]
          year?: number | null
          unit_label?: string
          unit_count?: number | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      claim_tallies: {
        Row: {
          id: string | null
          character_id: string | null
          text: string | null
          work_title: string | null
          locator: string | null
          supporting: number | null
          contesting: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      claim_kind: "textual" | "interpretive" | "speculative"
      essay_status: "draft" | "published"
      lens: "nietzschean" | "jungian" | "psychoanalytic" | "metafictional" | "sociopolitical" | "narratological"
      medium: "novel" | "manga" | "anime" | "film" | "series" | "game"
      spoiler_level: "none" | "arc" | "full" | "adaptations"
      stance: "supporting" | "contesting"
      steelman_mark: "fair" | "disputed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never;

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
