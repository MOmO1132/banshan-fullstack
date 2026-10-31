// 初始化演示数据（幂等：已有用户则跳过，FORCE=1 时清空重建）
import bcrypt from 'bcryptjs';
import { db, initSchema, all, get, run } from './lib/db.js';
import { CATEGORIES as POST_CATS, POSTS } from './data/writing.js';
import { PRODUCTS, REVIEW_POOL, REVIEWERS } from './data/catalog.js';
import { QUESTIONS } from './data/qa.js';

initSchema();

const force = process.env.FORCE === '1';
if (get('SELECT COUNT(*) AS n FROM users').n > 0 && !force) {
  console.log('已有数据，跳过 seed（如需重建：FORCE=1 npm run seed）');
  process.exit(0);
}

db.exec(`DELETE FROM reviews; DELETE FROM votes; DELETE FROM answers; DELETE FROM questions;
         DELETE FROM order_items; DELETE FROM orders; DELETE FROM cart_items; DELETE FROM addresses;
         DELETE FROM products; DELETE FROM posts; DELETE FROM categories; DELETE FROM users;
         DELETE FROM sqlite_sequence;`);

const PWD = bcrypt.hashSync('demo123456', 10);
const img = (name) => `/images/${name}`;

const USERS = [
  ['林深', 'linshen@banshan.dev', 18, '在山里做陶，也在城里写代码。景德镇 · 浮梁。', 1860],
  ['周愚', 'zhouyu@banshan.dev', 200, '独立开发者，做小而美的东西。两个产品，一个团队。', 2440],
  ['沈白', 'shenbai@banshan.dev', 262, '写字的人，偶尔做书。杭州 · 良渚。', 1520],
  ['阿禾', 'ahe@banshan.dev', 96, '咖啡烘焙师，12 平米小店主理人。', 1380],
  ['小满', 'xiaoman@banshan.dev', 330, '前大厂设计，现在做木工。', 720],
  ['老陈', 'laochen@banshan.dev', 74, '宜兴做壶三十年。', 640],
  ['阿吉', 'aji@banshan.dev', 152, '拍手作的人，顺便卖一点。', 410],
  ['demo', 'demo@banshan.dev', 12, '正在学习全栈开发的同学，请多指教。', 100],
];
const uid = {};
for (const [username, email, hue, bio, points] of USERS) {
  uid[username] = Number(run(
    'INSERT INTO users (username, email, password, avatar_hue, bio, points) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, PWD, hue, bio, points]
  ).lastInsertRowid);
}

const cid = {};
for (const c of POST_CATS) {
  cid[c.slug] = Number(run('INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)',
    [c.slug, c.name, c.description]).lastInsertRowid);
}

// ============ 手记 ============
for (const p of POSTS) {
  run(`INSERT INTO posts (title, summary, content, cover_url, cover_hue, category_id, tags, author_id,
        read_minutes, views, likes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime', ?), datetime('now','localtime', ?))`,
    [p.title, p.summary, p.content, img(p.cover), p.hue, cid[p.cat], JSON.stringify(p.tags),
      uid[p.author], p.read, p.views, p.likes, `-${p.days} days`, `-${p.days} days`]);
}

// ============ 问答 ============
for (const q of QUESTIONS) {
  const qid = Number(run(
    `INSERT INTO questions (title, content, tags, author_id, views, answers_count, is_solved, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime', ?), datetime('now','localtime', ?))`,
    [q.title, q.content, JSON.stringify(q.tags), uid[q.author], q.views, q.answers.length, q.solved,
      `-${q.days} days`, `-${q.days} days`]
  ).lastInsertRowid);

  for (const a of q.answers) {
    const aid = Number(run(
      `INSERT INTO answers (question_id, author_id, content, is_accepted, created_at)
       VALUES (?, ?, ?, ?, datetime('now','localtime', ?))`,
      [qid, uid[a.author], a.content, a.accepted, `-${Math.max(0, a.days)} days`]
    ).lastInsertRowid);
    const voters = USERS.map((u) => u[0]).filter((n) => n !== a.author).slice(0, Math.min(a.votes, 6));
    for (const v of voters) {
      run(`INSERT OR IGNORE INTO votes (user_id, target_type, target_id) VALUES (?, 'answer', ?)`, [uid[v], aid]);
    }
    run('UPDATE answers SET votes = ? WHERE id = ?', [a.votes, aid]);
  }

  const qVoters = USERS.map((u) => u[0]).filter((n) => n !== q.author).slice(0, Math.min(q.votes, 7));
  for (const v of qVoters) {
    run(`INSERT OR IGNORE INTO votes (user_id, target_type, target_id) VALUES (?, 'question', ?)`, [uid[v], qid]);
  }
  run('UPDATE questions SET votes = ? WHERE id = ?', [q.votes, qid]);
}

// ============ 商品 + 评价 ============
let reviewSeq = 0;
for (const [i, p] of PRODUCTS.entries()) {
  const pid = Number(run(
    `INSERT INTO products (name, subtitle, description, price, stock, category, images, cover_hue,
       material, spec, origin, maker, sales, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime', ?), datetime('now','localtime', ?))`,
    [p.name, p.subtitle, p.desc, p.price, p.stock, p.category, JSON.stringify(p.images.map(img)),
      p.hue, p.material, p.spec, p.origin, p.maker, p.sales, `-${60 - i} days`, `-${60 - i} days`]
  ).lastInsertRowid);

  // 每个商品 3-5 条评价，评分参与平均分
  const pool = REVIEW_POOL[p.category];
  const count = 3 + (i % 3);
  let sum = 0;
  for (let k = 0; k < count; k++) {
    const [text, rating] = pool[(i + k) % pool.length];
    const name = REVIEWERS[(reviewSeq + k) % REVIEWERS.length];
    reviewSeq++;
    sum += rating;
    run(`INSERT INTO reviews (product_id, user_id, author, avatar_hue, rating, content, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, datetime('now','localtime', ?))`,
      [pid, name, (k * 67 + i * 31) % 360, rating, text, `-${(k * 3 + i) % 30 + 1} days`]);
  }
  run('UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
    [Math.round((sum / count) * 10) / 10, count, pid]);
}

// ============ 演示账号的地址 ============
run(`INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
  [uid.demo, '陈同学', '13800001111', '浙江省', '杭州市', '西湖区', '文三路 88 号 创意园 A 座 502']);

const n = (sql) => get(sql).n;
console.log(`seed 完成：${n('SELECT COUNT(*) AS n FROM users')} 位用户 / `
  + `${n('SELECT COUNT(*) AS n FROM posts')} 篇手记 / `
  + `${n('SELECT COUNT(*) AS n FROM questions')} 个问题 / `
  + `${n('SELECT COUNT(*) AS n FROM answers')} 条回答 / `
  + `${n('SELECT COUNT(*) AS n FROM products')} 件商品 / `
  + `${n('SELECT COUNT(*) AS n FROM reviews')} 条评价`);
console.log('演示账号： demo / demo123456');
