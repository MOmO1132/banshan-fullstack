// JWT 签发与鉴权中间件
import jwt from 'jsonwebtoken';
import { get } from '../lib/db.js';
import { unauthorized } from '../lib/http.js';

const SECRET = process.env.JWT_SECRET || 'banshan-dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: EXPIRES_IN });

function readUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), SECRET);
    return get('SELECT * FROM users WHERE id = ?', [payload.id]) || null;
  } catch {
    return null; // token 过期 / 伪造，统一按未登录处理
  }
}

/** 必须登录 */
export function auth(req, _res, next) {
  const user = readUser(req);
  if (!user) return next(unauthorized('登录状态已失效，请重新登录'));
  req.user = user;
  next();
}

/** 可选登录：有 token 就带上用户，没有也放行（用于「是否已点赞」等场景） */
export function maybeAuth(req, _res, next) {
  req.user = readUser(req);
  next();
}

export const publicUser = (u) =>
  u && { id: u.id, username: u.username, email: u.email, bio: u.bio, avatar_hue: u.avatar_hue, points: u.points, created_at: u.created_at };
