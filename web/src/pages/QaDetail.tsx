import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Markdown from '../components/Markdown';
import { Avatar, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { day, fromNow } from '../lib/utils';

export default function QaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState<any>(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => api.get(`/questions/${id}`).then(setQ).catch((e) => setError(e.message));
  useEffect(() => { window.scrollTo(0, 0); load(); }, [id]);

  if (error) return <div className="page theme-qa"><div className="wrap"><div className="empty"><span className="glyph">404</span><p>{error}</p><Link to="/qa" className="btn btn-ghost">返回问山</Link></div></div></div>;
  if (!q) return <div className="page theme-qa"><Loading /></div>;

  const isAsker = user?.id === q.author_id;

  const vote = async (type: 'question' | 'answer', targetId: number) => {
    if (!user) { toast('登录后可以点赞'); nav('/login'); return; }
    try {
      const r = await api.post('/votes', { target_type: type, target_id: targetId });
      if (type === 'question') setQ({ ...q, voted: r.voted, votes: r.votes });
      else setQ({ ...q, answers: q.answers.map((a: any) => (a.id === targetId ? { ...a, voted: r.voted, votes: r.votes } : a)) });
      refresh();
    } catch (e: any) { toast(e.message); }
  };

  const accept = async (answerId: number) => {
    if (!window.confirm('采纳后不可更改，并会把问题标记为已解决，确定吗？')) return;
    try {
      await api.post(`/questions/${q.id}/accept`, { answer_id: answerId });
      toast('已采纳，答主获得 30 积分');
      load();
      refresh();
    } catch (e: any) { toast(e.message); }
  };

  const answer = async () => {
    if (!user) { nav('/login'); return; }
    if (draft.trim().length < 5) { toast('回答至少 5 个字'); return; }
    setSending(true);
    try {
      await api.post(`/questions/${q.id}/answers`, { content: draft });
      setDraft('');
      toast('回答已提交，+10 积分');
      load();
      refresh();
    } catch (e: any) { toast(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="page theme-qa">
      <div className="wrap" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24, fontSize: 12, color: 'var(--muted)' }}>
          <Link to="/qa" style={{ color: 'var(--muted)' }}>问山</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{q.is_solved ? '已解决' : '讨论中'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 26 }}>
          <div className="vote-col" style={{ paddingTop: 4 }}>
            <button className={`vote-btn ${q.voted ? 'on' : ''}`} onClick={() => vote('question', q.id)}>▲</button>
            <span className="vote-count">{q.votes}</span>
            <span style={{ fontSize: 9.5, color: 'var(--muted)' }}>赞同</span>
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 30, lineHeight: 1.42, margin: '0 0 14px' }}>
              {q.title}
            </h1>
            <div className="meta" style={{ marginBottom: 22 }}>
              {q.is_solved ? <span className="solved-flag">✓ 已解决</span> : null}
              <span>提问于 {fromNow(q.created_at)}</span>
              <span className="dot" />
              <span>{q.views} 次浏览</span>
              <span className="dot" />
              <span>{q.answers_count} 个回答</span>
            </div>

            <div style={{ paddingBottom: 26, borderBottom: '1px solid var(--rule)' }}>
              <Markdown>{q.content}</Markdown>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 20 }}>
                {q.tags.map((t: string) => <Link key={t} to={`/qa?tag=${encodeURIComponent(t)}`} className="chip"># {t}</Link>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <Avatar name={q.username} hue={q.avatar_hue} />
                <span style={{ fontSize: 12.5 }}>{q.username}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{day(q.created_at)}</span>
              </div>
            </div>

            {/* 回答列表 */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '22px 0 4px' }}>
                <span className="mono-label">{q.answers.length} ANSWERS</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>按采纳与赞同排序</span>
              </div>

              {q.answers.length === 0 && (
                <div className="empty" style={{ padding: '40px 0' }}>
                  <span className="glyph">答</span>
                  <p>还没有人回答，来写第一条吧</p>
                </div>
              )}

              {q.answers.map((a: any) => (
                <div className={`answer ${a.is_accepted ? 'accepted' : ''}`} key={a.id}>
                  <div className="vote-col">
                    <button className={`vote-btn ${a.voted ? 'on' : ''}`} onClick={() => vote('answer', a.id)}>▲</button>
                    <span className="vote-count">{a.votes}</span>
                  </div>
                  <div>
                    {a.is_accepted ? (
                      <div style={{ fontSize: 11.5, color: 'var(--moss)', marginBottom: 10, letterSpacing: 1 }}>
                        ✓ 已被提问者采纳
                      </div>
                    ) : null}
                    <Markdown>{a.content}</Markdown>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16 }}>
                      <Avatar name={a.username} hue={a.avatar_hue} />
                      <span style={{ fontSize: 12.5 }}>{a.username}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{fromNow(a.created_at)}</span>
                      <span style={{ flex: 1 }} />
                      {isAsker && !q.is_solved && (
                        <button className="btn btn-ghost btn-sm" onClick={() => accept(a.id)}>采纳这个回答</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 写回答 */}
            <div style={{ marginTop: 34, borderTop: '1px solid var(--ink)', paddingTop: 22 }}>
              <div className="section-head" style={{ borderBottom: 'none', marginBottom: 10, paddingBottom: 0 }}>
                <h2 style={{ fontSize: 19 }}>你的回答</h2>
                <span className="section-desc">支持 Markdown · 提交后 +10 积分</span>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={user ? '说说你的做法、踩过的坑，或者不同意见…' : '登录后即可回答'}
                disabled={!user}
                style={{
                  width: '100%', minHeight: 150, padding: 14, background: 'var(--paper-2)',
                  border: '1px solid var(--rule-strong)', borderRadius: 3, outline: 'none',
                  fontSize: 14, lineHeight: 1.85, resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{draft.trim().length} 字</span>
                <span style={{ flex: 1 }} />
                {user ? (
                  <button className="btn" onClick={answer} disabled={sending}>{sending ? '提交中…' : '提交回答'}</button>
                ) : (
                  <Link to="/login" className="btn">登录后回答</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
