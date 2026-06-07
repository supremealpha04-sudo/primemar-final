-- PrimeMar Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'creator')),
  badge_type TEXT DEFAULT 'none' CHECK (badge_type IN ('none', 'premium', 'creator')),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Hidden fields (never exposed in public API)
  premium_subscriber_count INTEGER DEFAULT 0,
  consecutive_premium_months INTEGER DEFAULT 0,
  creator_eligible BOOLEAN DEFAULT FALSE,
  creator_enrolled_at TIMESTAMPTZ,
  content_quality_score DECIMAL(3,2) DEFAULT 0.00,
  total_earnings DECIMAL(12,2) DEFAULT 0.00,
  pending_earnings DECIMAL(12,2) DEFAULT 0.00,
  strike_count INTEGER DEFAULT 0,
  last_strike_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$')
);

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'poll', 'collaborative')),

  -- Time-locked content
  is_time_locked BOOLEAN DEFAULT FALSE,
  unlock_at TIMESTAMPTZ,

  -- Ghost mode
  is_ghost BOOLEAN DEFAULT FALSE,
  ghost_reveal_at INTEGER, -- view count threshold to reveal identity

  -- Engagement metrics
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  boost_count INTEGER DEFAULT 0,

  -- AI scores (hidden)
  originality_score DECIMAL(3,2),
  engagement_prediction DECIMAL(3,2),
  trend_alignment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST COLLABORATORS
-- ============================================
CREATE TABLE post_collaborators (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  revenue_split DECIMAL(3,2) DEFAULT 0.50,
  PRIMARY KEY (post_id, collaborator_id)
);

-- ============================================
-- INTERACTIONS (likes, bookmarks)
-- ============================================
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2), -- AI scored
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS (Premium & Creator)
-- ============================================
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 4.99,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  flutterwave_ref TEXT,
  flutterwave_plan_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  UNIQUE(subscriber_id, creator_id)
);

-- ============================================
-- POST BOOSTS
-- ============================================
CREATE TABLE post_boosts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 1.00 AND amount <= 100.00),
  platform_fee DECIMAL(10,2) NOT NULL,
  creator_earnings DECIMAL(10,2) NOT NULL,
  flutterwave_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOST BOUNTIES (Crowdfunded)
-- ============================================
CREATE TABLE boost_bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'funded', 'expired')),
  contributors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================
-- CONTENT FUTURES (Staking)
-- ============================================
CREATE TABLE content_futures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stake_amount DECIMAL(10,2) NOT NULL CHECK (stake_amount >= 1.00 AND stake_amount <= 10.00),
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('views_10k', 'likes_1k', 'shares_500', 'comments_100')),
  target_deadline TIMESTAMPTZ NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  won BOOLEAN,
  payout_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATOR EARNINGS LEDGER
-- ============================================
CREATE TABLE creator_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'boost', 'bounty', 'gift', 'ad_revenue', 'content_future')),
  source_id UUID,
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid_out', 'held')),
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENGAGEMENT REWARDS (Users earn points)
-- ============================================
CREATE TABLE engagement_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('daily_active', 'quality_comment', 'referral', 'curation', 'report_verified', 'streak')),
  points_earned INTEGER NOT NULL,
  cash_equivalent DECIMAL(10,2) DEFAULT 0,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIRTUAL GIFTS
-- ============================================
CREATE TABLE virtual_gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  gift_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  creator_earnings DECIMAL(10,2) NOT NULL,
  flutterwave_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATOR INSURANCE
-- ============================================
CREATE TABLE creator_insurance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  premium_rate DECIMAL(3,2) DEFAULT 0.05,
  total_premiums_paid DECIMAL(10,2) DEFAULT 0,
  claims_made INTEGER DEFAULT 0,
  claims_approved INTEGER DEFAULT 0,
  total_claims_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMIN SYSTEM
-- ============================================
CREATE TABLE admin_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('super', 'ops', 'finance', 'support', 'content', 'analytics')),
  department TEXT,
  employee_id TEXT,
  admin_since TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  can_impersonate BOOLEAN DEFAULT FALSE
);

CREATE TABLE admin_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL CHECK (resource IN ('users', 'content', 'payouts', 'analytics', 'settings', 'moderation', 'finance')),
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete', 'approve', 'impersonate')),
  allowed BOOLEAN DEFAULT FALSE,
  UNIQUE(role, resource, action)
);

CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('user', 'post', 'payout', 'setting', 'moderation', 'system')),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  peer_approved_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES admin_profiles(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES admin_profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('permanent_ban', 'payout_override', 'threshold_change', 'mass_action', 'impersonate')),
  details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- MODERATION SYSTEM
-- ============================================
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'profile')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  assigned_admin UUID REFERENCES admin_profiles(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE moderation_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_profiles(id),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('remove', 'demonetize', 'warn', 'strike', 'clear', 'shadow_restrict')),
  reason TEXT NOT NULL,
  appealable BOOLEAN DEFAULT TRUE,
  appealed BOOLEAN DEFAULT FALSE,
  appeal_result TEXT,
  appeal_resolved_by UUID REFERENCES admin_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE user_strikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id),
  decision_id UUID REFERENCES moderation_decisions(id),
  strike_number INTEGER NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'subscribe', 'boost', 'mention', 'system', 'creator_unlocked', 'payout', 'strike')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIRECT MESSAGES
-- ============================================
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT TRUE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_engagement ON posts(engagement_score DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator ON subscriptions(creator_id);
CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_moderation_content ON moderation_decisions(content_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Public read, own write
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id);

-- Admin tables: Only admins
CREATE POLICY "Only admins can view admin profiles"
  ON admin_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Only super admins can modify admin profiles"
  ON admin_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND role = 'super' AND is_active = true)
  );

-- Audit log: Admins only
CREATE POLICY "Only admins can view audit log"
  ON admin_audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE id = auth.uid() AND is_active = true)
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment/decrement counters
CREATE OR REPLACE FUNCTION increment_counter(table_name TEXT, column_name TEXT, row_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + %s WHERE id = %L', table_name, column_name, column_name, amount, row_id);
END;
$$ LANGUAGE plpgsql;

-- Creator eligibility check (runs via cron/edge function)
CREATE OR REPLACE FUNCTION check_creator_eligibility()
RETURNS TABLE(user_id UUID, eligible BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    (
      p.followers_count >= 5000 AND
      p.premium_subscriber_count >= 1000 AND
      p.consecutive_premium_months >= 4 AND
      p.strike_count = 0 AND
      p.created_at <= NOW() - INTERVAL '6 months' AND
      p.creator_eligible = FALSE
    )::BOOLEAN as eligible
  FROM profiles p
  WHERE p.tier = 'premium'
  AND p.creator_eligible = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Log admin action
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, resource_type, resource_id, old_value, new_value)
  VALUES (
    NEW.id,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Admin Permissions
-- ============================================
INSERT INTO admin_permissions (role, resource, action, allowed) VALUES
('super', 'users', 'read', true),
('super', 'users', 'write', true),
('super', 'users', 'delete', true),
('super', 'users', 'approve', true),
('super', 'content', 'read', true),
('super', 'content', 'write', true),
('super', 'content', 'delete', true),
('super', 'payouts', 'read', true),
('super', 'payouts', 'write', true),
('super', 'payouts', 'approve', true),
('super', 'settings', 'read', true),
('super', 'settings', 'write', true),
('super', 'moderation', 'read', true),
('super', 'moderation', 'write', true),
('super', 'moderation', 'delete', true),
('super', 'analytics', 'read', true),
('super', 'users', 'impersonate', true),

('ops', 'users', 'read', true),
('ops', 'users', 'write', true),
('ops', 'content', 'read', true),
('ops', 'content', 'write', true),
('ops', 'moderation', 'read', true),
('ops', 'moderation', 'write', true),
('ops', 'analytics', 'read', true),

('finance', 'payouts', 'read', true),
('finance', 'payouts', 'write', true),
('finance', 'payouts', 'approve', true),
('finance', 'users', 'read', true),
('finance', 'analytics', 'read', true),

('support', 'users', 'read', true),
('support', 'users', 'write', true),
('support', 'moderation', 'read', true),
('support', 'moderation', 'write', true),

('content', 'content', 'read', true),
('content', 'content', 'write', true),
('content', 'content', 'delete', true),
('content', 'moderation', 'read', true),
('content', 'moderation', 'write', true),

('analytics', 'analytics', 'read', true),
('analytics', 'users', 'read', true),
('analytics', 'content', 'read', true);
