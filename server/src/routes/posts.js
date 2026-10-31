import { Router } from 'express';
import { all, get, run } from '../lib/db.js';
import {
  asyncHandler, ok, requireFields, checkString, checkInt, parseTags,
  badRequest, forbidden, notFound, safeJson,
} from '../lib/http.js';
import { auth, maybeAuth } from '../middleware/auth.js';

const router = Router();

const POST_SELECT = `
  SELECT p.*, u.username, u.avatar_hue, c.name AS category_name, c.slug AS category_slug
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id
`;

const shape = (row) => ({ ...row, tags: safeJson(row.tags) });

// 分类列表（含每个分类下的文章数）；/posts/categories 作为语义化别名
router.get(['/categories', '/posts/categories'], (_req, res) => {
  ok(res, all(`
    SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) AS post_count
    FROM categories c ORDER BY c.id`));
});

// 文章列表：分页 + 分类筛选 + 标题/正文搜索 + 排序
router.get('/posts', maybeAuth, asyncHandler(async (req, res) => {
  const page = Math.max(1, checkInt(req.query.page ?? 1, '页码', { min: 1 }));
  const pageSize = Math.min(24, checkInt(req.query.pageSize ?? 6, '每页条数', { min: 1, max: 24 }));
  const { category, keyword, sort = 'latest', author } = req.query;

  const where = [];
  const params = [];
  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (author) { where.push('p.author_id = ?'); params.push(Number(author)); }
  if (keyword) { where.push('(p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = sort === 'hot' ? 'ORDER BY p.views DESC, p.id DESC' : 'ORDER BY p.created_at DESC, p.id DESC';

  const total = get(`SELECT COUNT(*) AS n FROM posts p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`, params).n;
  const rows = all(
    `${POST_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  ok(res, { list: rows.map(shape), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}));

// 文章详情：浏览量 +1
router.get('/posts/:id', asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '文章 ID', { min: 1 });
  const post = get(`${POST_SELECT} WHERE p.id = ?`, [id]);
  if (!post) throw notFound('这篇文章不存在或已删除');
  run('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
  ok(res, shape({ ...post, views: post.views + 1 }));
}));

function readPostBody(body) {
  requireFields(body, ['title', 'content']);
  const title = checkString(body.title, '标题', { min: 2, max: 80 });
  const content = checkString(body.content, '正文', { min: 10, max: 40000 });
  const summary = body.summary ? checkString(body.summary, '摘要', { min: 0, max: 200 }) : '';
  const hueRaw = body.cover_hue === undefined ? 24 : Number(body.cover_hue);
  const cover_hue = Number.isFinite(hueRaw) ? Math.max(0, Math.min(360, Math.round(hueRaw))) : 24;
  const category_id = body.category_id ? checkInt(body.category_id, '分类', { min: 1 }) : null;
  if (category_id && !get('SELECT id FROM categories WHERE id = ?', [category_id])) throw badRequest('分类不存在');
  return { title, content, summary: summary || content.replace(/[#>*`\-]/g, ' ').trim().slice(0, 80), cover_hue, category_id, tags: JSON.stringify(parseTags(body.tags)) };
}

router.post('/posts', auth, asyncHandler(async (req, res) => {
  const p = readPostBody(req.body);
  const info = run(
    `INSERT INTO posts (title, summary, content, cover_hue, category_id, tags, author_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [p.title, p.summary, p.content, p.cover_hue, p.category_id, p.tags, req.user.id]
  );
  ok(res, shape(get(`${POST_SELECT} WHERE p.id = ?`, [info.lastInsertRowid])), '已发布', 201);
}));

router.put('/posts/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '文章 ID', { min: 1 });
  const post = get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw notFound('这篇文章不存在');
  if (post.author_id !== req.user.id) throw forbidden('只能编辑自己的文章');
  const p = readPostBody({ ...post, ...req.body, tags: req.body.tags ?? safeJson(post.tags) });
  run(
    `UPDATE posts SET title = ?, summary = ?, content = ?, cover_hue = ?, category_id = ?, tags = ?,
     updated_at = datetime('now','localtime') WHERE id = ?`,
    [p.title, p.summary, p.content, p.cover_hue, p.category_id, p.tags, id]
  );
  ok(res, shape(get(`${POST_SELECT} WHERE p.id = ?`, [id])), '已保存');
}));

router.delete('/posts/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '文章 ID', { min: 1 });
  const post = get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw notFound('这篇文章不存在');
  if (post.author_id !== req.user.id) throw forbidden('只能删除自己的文章');
  run('DELETE FROM posts WHERE id = ?', [id]);
  ok(res, { id }, '已删除');
}));

// 文章点赞（简单累加，博客场景不做去重）
router.post('/posts/:id/like', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '文章 ID', { min: 1 });
  if (!get('SELECT id FROM posts WHERE id = ?', [id])) throw notFound('文章不存在');
  run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
  ok(res, { likes: get('SELECT likes FROM posts WHERE id = ?', [id]).likes }, '感谢喜欢');
}));

export default router;
