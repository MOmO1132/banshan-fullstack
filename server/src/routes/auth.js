import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { get, run } from '../lib/db.js';
import { asyncHandler, ok, requireFields, checkString, checkEmail, badRequest, conflict, unauthorized } from '../lib/http.js';
import { auth, signToken, publicUser } from '../middleware/auth.js';

const router = Router();

// 注册：用户名 3-20、邮箱唯一、密码 ≥6 位，bcrypt 加密后落库
router.post('/register', asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'email', 'password']);
  const username = checkString(req.body.username, '用户名', { min: 3, max: 20 });
  const email = checkEmail(req.body.email);
  const password = checkString(req.body.password, '密码', { min: 6, max: 64 });

  if (get('SELECT id FROM users WHERE username = ?', [username])) throw conflict('这个用户名已经被占用了');
  if (get('SELECT id FROM users WHERE email = ?', [email])) throw conflict('这个邮箱已经注册过了');

  const hash = await bcrypt.hash(password, 10);
  const hue = Math.floor(Math.random() * 360);
  const info = run(
    'INSERT INTO users (username, email, password, avatar_hue) VALUES (?, ?, ?, ?)',
    [username, email, hash, hue]
  );
  const user = get('SELECT * FROM users WHERE id = ?', [info.lastInsertRowid]);
  // 新人礼：100 积分，可直接提第一个问题
  run('UPDATE users SET points = 100 WHERE id = ?', [user.id]);
  user.points = 100;

  ok(res, { token: signToken(user), user: publicUser(user) }, '注册成功，已赠送 100 积分', 201);
}));

// 登录：支持用户名或邮箱
router.post('/login', asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const key = checkString(req.body.username, '账号', { min: 3, max: 60 });
  const user = get('SELECT * FROM users WHERE username = ? OR email = ?', [key, key.toLowerCase()]);
  if (!user) throw unauthorized('账号或密码不正确');
  const match = await bcrypt.compare(String(req.body.password), user.password);
  if (!match) throw unauthorized('账号或密码不正确');

  ok(res, { token: signToken(user), user: publicUser(user) }, '登录成功');
}));

router.get('/me', auth, (req, res) => {
  ok(res, publicUser(req.user));
});

router.put('/me', auth, asyncHandler(async (req, res) => {
  const bio = req.body.bio !== undefined ? checkString(String(req.body.bio), '简介', { min: 0, max: 120 }) : req.user.bio;
  const hue = req.body.avatar_hue !== undefined ? Number(req.body.avatar_hue) : req.user.avatar_hue;
  if (!Number.isInteger(hue) || hue < 0 || hue > 360) throw badRequest('头像色相取值应在 0-360 之间');
  run('UPDATE users SET bio = ?, avatar_hue = ? WHERE id = ?', [bio, hue, req.user.id]);
  ok(res, publicUser(get('SELECT * FROM users WHERE id = ?', [req.user.id])), '资料已更新');
}));

/** 我的投稿 / 提问 / 回答统计，个人中心用 */
router.get('/me/overview', auth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const one = (sql) => get(sql, [uid])?.n ?? 0;
  ok(res, {
    posts: one('SELECT COUNT(*) AS n FROM posts WHERE author_id = ?'),
    questions: one('SELECT COUNT(*) AS n FROM questions WHERE author_id = ?'),
    answers: one('SELECT COUNT(*) AS n FROM answers WHERE author_id = ?'),
    orders: one('SELECT COUNT(*) AS n FROM orders WHERE user_id = ?'),
    views: one('SELECT COALESCE(SUM(views),0) AS n FROM posts WHERE author_id = ?')
      + one('SELECT COALESCE(SUM(views),0) AS n FROM questions WHERE author_id = ?'),
  });
}));

export default router;
