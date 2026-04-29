-- ═══════════════════════════════════════════
-- Account Vault — Migration V2: Tags & Password Strength
-- ═══════════════════════════════════════════

-- 1. Thêm cột tags (mảng text)
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Thêm cột sức khỏe mật khẩu (0-100)
ALTER TABLE stored_accounts ADD COLUMN IF NOT EXISTS strength_score INTEGER DEFAULT 0;

-- 3. Index cho tags
CREATE INDEX IF NOT EXISTS idx_stored_accounts_tags ON stored_accounts USING GIN (tags);
