CREATE TABLE IF NOT EXISTS chromas (
  release_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  skin_id INTEGER NOT NULL,
  instance_id TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  hero_id TEXT NOT NULL,
  hero_name_zh TEXT NOT NULL,
  hero_name_en TEXT NOT NULL,
  skin_name_zh TEXT NOT NULL,
  skin_name_en TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  game_ver TEXT NOT NULL,
  is_new INTEGER NOT NULL CHECK (is_new IN (0, 1)),
  rank INTEGER NOT NULL,
  image_large TEXT NOT NULL,
  image_medium TEXT NOT NULL,
  image_small TEXT NOT NULL,
  image_tag TEXT NOT NULL,
  PRIMARY KEY (release_id, slug)
);
CREATE TABLE IF NOT EXISTS releases (
  release_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deployed_at TEXT,
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN ('imported', 'active', 'failed'))
);
CREATE INDEX IF NOT EXISTS idx_chromas_release_rank ON chromas(release_id, rank DESC, skin_id DESC);
CREATE INDEX IF NOT EXISTS idx_chromas_release_hero ON chromas(release_id, hero_id);
CREATE INDEX IF NOT EXISTS idx_chromas_release_version ON chromas(release_id, game_ver);
CREATE INDEX IF NOT EXISTS idx_chromas_release_category ON chromas(release_id, category_id);
CREATE INDEX IF NOT EXISTS idx_chromas_release_new ON chromas(release_id, is_new, rank DESC, skin_id DESC);
