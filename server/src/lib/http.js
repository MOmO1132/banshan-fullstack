// 统一的响应格式、错误类型与参数校验
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(400, msg, details);
export const unauthorized = (msg = '请先登录') => new ApiError(401, msg);
export const forbidden = (msg = '没有操作权限') => new ApiError(403, msg);
export const notFound = (msg = '资源不存在') => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);

/** 包装 async 路由，异常交给全局错误中间件 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 成功响应：{ code: 0, data, message } */
export function ok(res, data = null, message = 'ok', status = 200) {
  return res.status(status).json({ code: 0, message, data });
}

// ===== 参数校验小工具 =====
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body?.[f] === null || body?.[f] === '');
  if (missing.length) throw badRequest(`缺少必填字段：${missing.join('、')}`);
}

export function checkString(value, label, { min = 1, max = 10000 } = {}) {
  if (typeof value !== 'string') throw badRequest(`${label}格式不正确`);
  const v = value.trim();
  if (v.length < min) throw badRequest(`${label}至少 ${min} 个字符`);
  if (v.length > max) throw badRequest(`${label}不能超过 ${max} 个字符`);
  return v;
}

export function checkEmail(v) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '')) throw badRequest('邮箱格式不正确');
  return v.trim().toLowerCase();
}

export function checkInt(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n)) throw badRequest(`${label}必须是整数`);
  if (n < min) throw badRequest(`${label}不能小于 ${min}`);
  if (n > max) throw badRequest(`${label}过大`);
  return n;
}

export function parseTags(tags) {
  if (tags == null) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(/[,，\s]+/);
  const cleaned = arr.map((t) => String(t).trim()).filter(Boolean);
  if (cleaned.length > 5) throw badRequest('标签最多 5 个');
  return [...new Set(cleaned)];
}

export const safeJson = (v, fallback = []) => {
  try { return JSON.parse(v); } catch { return fallback; }
};
