import { Router } from 'express';
import { all, get, run, tx } from '../lib/db.js';
import {
  asyncHandler, ok, requireFields, checkString, checkInt, parseTags,
  badRequest, forbidden, notFound, safeJson,
} from '../lib/http.js';
import { auth, maybeAuth } from '../middleware/auth.js';

const router = Router();

/** 积分规则：提问 -5，回答 +10，被采纳 +30，问题被赞 +5，回答被赞 +10 */
export const POINTS = { ask: -5, answer: 10, accepted: 30, questionVoted: 5, answerVoted: 10 };

const Q_SELECT = `
  SELECT q.*, u.username, u.avatar_hue,
    (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'question' AND v.target_id = q.id) AS vote_rows
  FROM questions q JOIN users u ON u.id = q.author_id
`;

function shapeQuestion(q, userId) {
  const voted = userId
    ? !!get(`SELECT id FROM votes WHERE user_id = ? AND target_type = 'question' AND target_id = ?`, [userId, q.id])
    : false;
  return { ...q, tags: safeJson(q.tags), voted };
}

// 问题列表：latest / hot / unsolved / unanswered + 标签筛选 + 搜索
router.get('/questions', maybeAuth, asyncHandler(async (req, res) => {
  const page = Math.max(1, checkInt(req.query.page ?? 1, '页码', { min: 1 }));
  const pageSize = Math.min(20, checkInt(req.query.pageSize ?? 8, '每页条数', { min: 1, max: 20 }));
  const { sort = 'latest', tag, keyword } = req.query;

  const where = [];
  const params = [];
  if (sort === 'unsolved') where.push('q.is_solved = 0');
  if (sort === 'unanswered') where.push('q.answers_count = 0');
  if (tag) { where.push('q.tags LIKE ?'); params.push(`%${tag}%`); }
  if (keyword) { where.push('(q.title LIKE ? OR q.content LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderMap = {
    latest: 'ORDER BY q.created_at DESC, q.id DESC',
    hot: 'ORDER BY q.votes DESC, q.answers_count DESC, q.views DESC',
    unsolved: 'ORDER BY q.created_at DESC',
    unanswered: 'ORDER BY q.created_at DESC',
  };

  const total = get(`SELECT COUNT(*) AS n FROM questions q ${whereSql}`, params).n;
  const rows = all(
    `${Q_SELECT} ${whereSql} ${orderMap[sort] || orderMap.latest} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  ok(res, {
    list: rows.map((q) => shapeQuestion(q, req.user?.id)),
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}));

// 热门标签（云端聚合，前端据此渲染筛选条）
router.get('/questions/tags', (_req, res) => {
  const counter = new Map();
  for (const row of all('SELECT tags FROM questions')) {
    for (const t of safeJson(row.tags)) counter.set(t, (counter.get(t) || 0) + 1);
  }
  ok(res, [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })));
});

// 问题详情：附回答列表、当前用户是否已赞
router.get('/questions/:id', maybeAuth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '问题 ID', { min: 1 });
  const q = get(`${Q_SELECT} WHERE q.id = ?`, [id]);
  if (!q) throw notFound('这个问题不存在');
  run('UPDATE questions SET views = views + 1 WHERE id = ?', [id]);

  const answers = all(
    `SELECT a.*, u.username, u.avatar_hue FROM answers a JOIN users u ON u.id = a.author_id
     WHERE a.question_id = ? ORDER BY a.is_accepted DESC, a.votes DESC, a.id ASC`,
    [id]
  ).map((a) => ({
    ...a,
    voted: req.user ? !!get('SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?', [req.user.id, 'answer', a.id]) : false,
  }));

  ok(res, { ...shapeQuestion({ ...q, views: q.views + 1 }, req.user?.id), answers });
}));

// 提问：扣 5 积分（事务内先校验余额，避免扣成负数）
router.post('/questions', auth, asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'content']);
  const title = checkString(req.body.title, '标题', { min: 5, max: 100 });
  const content = checkString(req.body.content, '问题描述', { min: 10, max: 20000 });
  const tags = JSON.stringify(parseTags(req.body.tags));
  const uid = req.user.id;

  const id = tx(() => {
    const me = get('SELECT points FROM users WHERE id = ?', [uid]);
    if (me.points + POINTS.ask < 0) throw badRequest(`积分不足，提问需要 ${-POINTS.ask} 积分`);
    run('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.ask, uid]);
    const info = run('INSERT INTO questions (title, content, tags, author_id) VALUES (?, ?, ?, ?)', [title, content, tags, uid]);
    return Number(info.lastInsertRowid);
  });

  ok(res, shapeQuestion(get(`${Q_SELECT} WHERE q.id = ?`, [id]), uid), '已发布，消耗 5 积分', 201);
}));

// 回答：+10 积分，并累加问题的 answers_count
router.post('/questions/:id/answers', auth, asyncHandler(async (req, res) => {
  const qid = checkInt(req.params.id, '问题 ID', { min: 1 });
  const content = checkString(req.body.content, '回答内容', { min: 5, max: 20000 });
  if (!get('SELECT id FROM questions WHERE id = ?', [qid])) throw notFound('问题不存在');
  const uid = req.user.id;

  const aid = tx(() => {
    const info = run('INSERT INTO answers (question_id, author_id, content) VALUES (?, ?, ?)', [qid, uid, content]);
    run('UPDATE questions SET answers_count = answers_count + 1, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', [qid]);
    run('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.answer, uid]);
    return Number(info.lastInsertRowid);
  });

  ok(res, get('SELECT a.*, u.username, u.avatar_hue FROM answers a JOIN users u ON u.id = a.author_id WHERE a.id = ?', [aid]), '回答成功，+10 积分', 201);
}));

/** 点赞开关：点赞/取消都在事务里同步维护目标的 votes 字段 */
router.post('/votes', auth, asyncHandler(async (req, res) => {
  const target_type = req.body.target_type;
  if (!['question', 'answer'].includes(target_type)) throw badRequest('点赞目标类型只能是 question 或 answer');
  const target_id = checkInt(req.body.target_id, '目标 ID', { min: 1 });
  const table = target_type === 'question' ? 'questions' : 'answers';
  const uid = req.user.id;

  const result = tx(() => {
    const target = get(`SELECT * FROM ${table} WHERE id = ?`, [target_id]);
    if (!target) throw notFound('点赞的内容不存在');
    const existing = get('SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?', [uid, target_type, target_id]);

    if (existing) {
      run('DELETE FROM votes WHERE id = ?', [existing.id]);
      run(`UPDATE ${table} SET votes = MAX(votes - 1, 0) WHERE id = ?`, [target_id]);
      // 取消点赞回收作者积分，但不低于 0
      const bonus = target_type === 'question' ? POINTS.questionVoted : POINTS.answerVoted;
      run('UPDATE users SET points = MAX(points - ?, 0) WHERE id = ?', [bonus, target.author_id]);
      return { voted: false };
    }
    run('INSERT INTO votes (user_id, target_type, target_id) VALUES (?, ?, ?)', [uid, target_type, target_id]);
    run(`UPDATE ${table} SET votes = votes + 1 WHERE id = ?`, [target_id]);
    const bonus = target_type === 'question' ? POINTS.questionVoted : POINTS.answerVoted;
    run('UPDATE users SET points = points + ? WHERE id = ?', [bonus, target.author_id]);
    return { voted: true };
  });

  const votes = get(`SELECT votes FROM ${table} WHERE id = ?`, [target_id]).votes;
  ok(res, { ...result, votes }, result.voted ? '已点赞' : '已取消点赞');
}));

// 采纳答案：仅提问者、每题仅一次、采纳后置为已解决
router.post('/questions/:id/accept', auth, asyncHandler(async (req, res) => {
  const qid = checkInt(req.params.id, '问题 ID', { min: 1 });
  const aid = checkInt(req.body.answer_id, '回答 ID', { min: 1 });
  const q = get('SELECT * FROM questions WHERE id = ?', [qid]);
  if (!q) throw notFound('问题不存在');
  if (q.author_id !== req.user.id) throw forbidden('只有提问者可以采纳答案');
  if (q.is_solved) throw badRequest('这个问题已经采纳过答案了');
  const answer = get('SELECT * FROM answers WHERE id = ? AND question_id = ?', [aid, qid]);
  if (!answer) throw notFound('回答不存在');

  tx(() => {
    run('UPDATE answers SET is_accepted = 1 WHERE id = ?', [aid]);
    run('UPDATE questions SET is_solved = 1, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?', [qid]);
    run('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.accepted, answer.author_id]);
  });
  ok(res, { question_id: qid, answer_id: aid }, '已采纳，答主 +30 积分');
}));

export default router;
