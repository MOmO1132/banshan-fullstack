-- 半山 BANSHAN · 数据库结构
-- 三合一：笔记（博客）/ 问山（问答）/ 市集（商城）
-- 说明：金额统一以「分」为整数存储，避免浮点误差

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ========== 用户 ==========
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,                -- bcrypt hash
  bio         TEXT DEFAULT '',
  avatar_hue  INTEGER NOT NULL DEFAULT 24,  -- 头像渐变主色相，前端据此生成头像
  points      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ========== 笔记 / 博客 ==========
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  summary     TEXT DEFAULT '',
  content     TEXT NOT NULL,                -- Markdown
  cover_url   TEXT NOT NULL DEFAULT '',     -- 封面图（本地 /images/...）
  cover_hue   INTEGER NOT NULL DEFAULT 24,  -- 无图时的兜底渐变主色相
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  tags        TEXT NOT NULL DEFAULT '[]',   -- JSON 数组
  author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_minutes INTEGER NOT NULL DEFAULT 5,
  views       INTEGER NOT NULL DEFAULT 0,
  likes       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);

-- ========== 问山 / 问答 ==========
CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,              -- Markdown
  tags          TEXT NOT NULL DEFAULT '[]',
  author_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  views         INTEGER NOT NULL DEFAULT 0,
  votes         INTEGER NOT NULL DEFAULT 0,
  answers_count INTEGER NOT NULL DEFAULT 0,
  is_solved     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  votes       INTEGER NOT NULL DEFAULT 0,
  is_accepted INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- 点赞：一个用户对同一目标只能点一次（唯一索引兜底，防并发重复）
CREATE TABLE IF NOT EXISTS votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('question','answer')),
  target_id   INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE (user_id, target_type, target_id)
);

-- ========== 市集 / 商城 ==========
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  subtitle    TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price       INTEGER NOT NULL,             -- 单位：分
  stock       INTEGER NOT NULL DEFAULT 0,
  category    TEXT NOT NULL,
  images      TEXT NOT NULL DEFAULT '[]',   -- 图片 URL 数组（JSON）
  cover_hue   INTEGER NOT NULL DEFAULT 24,
  material    TEXT DEFAULT '',
  spec        TEXT DEFAULT '',
  origin      TEXT DEFAULT '',
  maker       TEXT DEFAULT '',
  rating      REAL NOT NULL DEFAULT 5,
  review_count INTEGER NOT NULL DEFAULT 0,
  sales       INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- 商品评价（详情页展示，评分参与平均分）
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT NOT NULL DEFAULT '',
  avatar_hue INTEGER NOT NULL DEFAULT 24,
  rating     INTEGER NOT NULL DEFAULT 5,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  province   TEXT NOT NULL,
  city       TEXT NOT NULL,
  district   TEXT NOT NULL,
  detail     TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no     TEXT NOT NULL UNIQUE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id   INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  receiver     TEXT NOT NULL DEFAULT '',   -- 下单时地址快照，防止地址被改后订单信息失真
  address_text TEXT NOT NULL DEFAULT '',
  total_price  INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','shipped','completed','cancelled')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  name       TEXT NOT NULL,                -- 商品名快照
  image      TEXT NOT NULL DEFAULT '',     -- 商品图快照
  cover_hue  INTEGER NOT NULL DEFAULT 24,
  price      INTEGER NOT NULL,             -- 下单时价格快照
  quantity   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
