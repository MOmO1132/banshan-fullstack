import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initSchema, get, all } from './lib/db.js';
import { ApiError } from './lib/http.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import questionRoutes from './routes/questions.js';
import shopRoutes from './routes/shop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3001);

initSchema();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 简单访问日志，方便排查前后端联调问题
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`${new Date().toLocaleTimeString('zh-CN')}  ${req.method} ${req.originalUrl}`);
  next();
});

// 站点概览：首页的数字看板
app.get('/api/stats', (_req, res) => {
  const n = (sql) => get(sql)?.n ?? 0;
  res.json({
    code: 0, message: 'ok',
    data: {
      posts: n('SELECT COUNT(*) AS n FROM posts'),
      questions: n('SELECT COUNT(*) AS n FROM questions'),
      answers: n('SELECT COUNT(*) AS n FROM answers'),
      products: n('SELECT COUNT(*) AS n FROM products WHERE is_active = 1'),
      members: n('SELECT COUNT(*) AS n FROM users'),
      views: n('SELECT COALESCE(SUM(views),0) AS n FROM posts') + n('SELECT COALESCE(SUM(views),0) AS n FROM questions'),
    },
  });
});

// 作者榜：按积分排序，附手记 / 回答数
app.get('/api/makers', (_req, res) => {
  const rows = all(`
    SELECT u.id, u.username, u.bio, u.avatar_hue, u.points,
      (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS posts,
      (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id) AS answers
    FROM users u ORDER BY u.points DESC LIMIT 5`);
  res.json({ code: 0, message: 'ok', data: rows });
});

app.use('/api/auth', authRoutes);
app.use('/api', postRoutes);
app.use('/api', questionRoutes);
app.use('/api', shopRoutes);

app.use('/api', (_req, res) => res.status(404).json({ code: 404, message: '接口不存在' }));

// 生产模式下由 Express 直接托管前端构建产物（单端口部署）
const distDir = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// 统一错误处理：把 ApiError 与未知异常都转成 JSON
app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.status, message: err.message, details: err.details });
  }
  console.error('[未捕获异常]', err);
  res.status(500).json({ code: 500, message: '服务器开小差了，请稍后再试' });
});

app.listen(PORT, () => {
  console.log(`\n  半山 BANSHAN · 服务已启动  http://localhost:${PORT}\n`);
});
