import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Markdown from '../components/Markdown';
import { useToast } from '../components/Toast';

export default function Ask() {
  const nav = useNavigate();
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (form.title.trim().length < 5) return setError('标题至少 5 个字，把问题说清楚');
    if (form.content.trim().length < 10) return setError('问题描述至少 10 个字');
    setBusy(true);
    try {
      const q = await api.post('/questions', form);
      toast('已发布，消耗 5 积分');
      refresh();
      nav(`/qa/${q.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 24 }}>
          <span className="mono-label">NEW QUESTION</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 30, margin: '8px 0 6px' }}>提一个问题</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            当前积分 <b style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{user?.points ?? 0}</b> · 发布提问将扣除 5 积分
          </p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="field">
          <label>标题</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例如：独立开发做后端，选 Node 还是 Python 更省心？"
          />
        </div>

        <div className="field">
          <label>问题描述（支持 Markdown，可贴代码）</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            style={{ minHeight: 220, fontFamily: 'var(--mono)', fontSize: 13.4 }}
            placeholder={'说清背景、你试过的做法、遇到的具体问题。\n\n```js\n// 粘贴关键代码\n```'}
          />
        </div>

        <div className="field">
          <label>标签（空格分隔，最多 5 个）</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="后端 技术选型 独立开发" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--rule)' }}>
          <div>
            <span className="mono-label">PREVIEW</span>
            <div style={{ marginTop: 12, maxHeight: 260, overflow: 'auto' }}>
              {form.content ? <Markdown>{form.content}</Markdown> : <p style={{ color: 'var(--muted)', fontSize: 13 }}>预览会显示在这里</p>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12 }}>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.9, margin: 0 }}>
              · 一个问题只问一件事；<br />
              · 附上最小可复现的例子；<br />
              · 被采纳的回答会获得 30 积分。
            </p>
            <button className="btn" onClick={submit} disabled={busy}>{busy ? '发布中…' : '发布问题（-5 积分）'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
