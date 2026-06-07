export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          tier: "free" | "premium" | "creator";
          badge_type: "none" | "premium" | "creator";
          followers_count: number;
          following_count: number;
          is_verified: boolean;
          created_at: string;
          // Hidden fields
          premium_subscriber_count: number;
          consecutive_premium_months: number;
          creator_eligible: boolean;
          creator_enrolled_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          tier?: "free" | "premium" | "creator";
          badge_type?: "none" | "premium" | "creator";
          followers_count?: number;
          following_count?: number;
          is_verified?: boolean;
          created_at?: string;
          premium_subscriber_count?: number;
          consecutive_premium_months?: number;
          creator_eligible?: boolean;
          creator_enrolled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          media_urls: string[] | null;
          post_type: "text" | "image" | "video" | "poll" | "collaborative";
          is_time_locked: boolean;
          unlock_at: string | null;
          is_ghost: boolean;
          ghost_reveal_at: number | null;
          engagement_score: number;
          view_count: number;
          like_count: number;
          comment_count: number;
          share_count: number;
          boost_count: number;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          amount: number;
          status: "active" | "cancelled" | "expired";
          flutterwave_ref: string | null;
          started_at: string;
          expires_at: string;
        };
      };
      post_boosts: {
        Row: {
          id: string;
          post_id: string;
          booster_id: string;
          creator_id: string;
          amount: number;
          platform_fee: number;
          creator_earnings: number;
          flutterwave_ref: string | null;
          created_at: string;
        };
      };
      boost_bounties: {
        Row: {
          id: string;
          post_id: string;
          target_amount: number;
          current_amount: number;
          status: "active" | "funded" | "expired";
          contributors: Json;
          created_at: string;
        };
      };
      creator_earnings: {
        Row: {
          id: string;
          creator_id: string;
          source_type: "subscription" | "boost" | "bounty" | "gift";
          source_id: string;
          gross_amount: number;
          platform_fee: number;
          net_amount: number;
          status: "pending" | "paid_out";
          paid_at: string | null;
          created_at: string;
        };
      };
      engagement_rewards: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          points_earned: number;
          cash_equivalent: number;
          redeemed: boolean;
          created_at: string;
        };
      };
      admin_profiles: {
        Row: {
          id: string;
          role: "super" | "ops" | "finance" | "support" | "content" | "analytics";
          department: string | null;
          employee_id: string | null;
          admin_since: string;
          last_login: string | null;
          two_factor_enabled: boolean;
          is_active: boolean;
        };
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
      moderation_decisions: {
        Row: {
          id: string;
          admin_id: string;
          content_id: string;
          decision: "remove" | "demonetize" | "warn" | "strike" | "clear";
          reason: string;
          appealable: boolean;
          appealed: boolean;
          appeal_result: string | null;
          created_at: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Profile = Tables<"profiles">;
export type Post = Tables<"posts">;
export type Subscription = Tables<"subscriptions">;
export type PostBoost = Tables<"post_boosts">;
export type CreatorEarning = Tables<"creator_earnings">;
export type AdminProfile = Tables<"admin_profiles">;
export type AdminAuditLog = Tables<"admin_audit_log">;
export type ModerationDecision = Tables<"moderation_decisions">;
