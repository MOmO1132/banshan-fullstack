import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import Markdown from '../components/Markdown';
import { useToast } from '../components/Toast';

const TEMPLATE = `## 起因

写清楚是什么让你开始做这件事。

## 过程

- 第一件具体的事
- 第二件具体的事

> 一句留给自己看的话

## 结果

数字、感受，或者没有结果的结论。
`;

/** 写 / 编辑手记：左侧 Markdown，右侧实时预览 */
export default function Write() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: '', summary: '', content: TEMPLATE, tags: '', category_id: '', cover_hue: 24,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/posts/categories').then((list) => {
      setCategories(list);
      if (!isEdit && list.length) setForm((f) => ({ ...f, category_id: String(list[0].id) }));
    }).catch(() => {});

    if (isEdit) {
      api.get(`/posts/${id}`).then((p) => {
        setForm({
          title: p.title, summary: p.summary || '', content: p.content,
          tags: (p.tags || []).join(' '), category_id: String(p.category_id || ''), cover_hue: p.cover_hue,
        });
      }).catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  const words = useMemo(() => form.content.replace(/\s/g, '').length, [form.content]);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    if (form.title.trim().length < 2) return setError('标题至少 2 个字');
    if (form.content.trim().length < 10) return setError('正文至少 10 个字');
    setSaving(true);
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      tags: form.tags,
      cover_hue: Number(form.cover_hue),
      category_id: form.category_id ? Number(form.category_id) : null,
    };
    try {
      const saved = isEdit ? await api.put(`/posts/${id}`, payload) : await api.post('/posts', payload);
      toast(isEdit ? '已保存修改' : '手记已发布');
      nav(`/notes/${saved.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page theme-notes">
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
          <span className="mono-label">{isEdit ? 'EDIT NOTE' : 'NEW NOTE'}</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 26, margin: 0 }}>
            {isEdit ? '编辑手记' : '写一篇手记'}
          </h1>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{words} 字</span>
          <Link to="/notes" className="btn-text">放弃</Link>
          <button className="btn btn-sm" onClick={submit} disabled={saving}>{saving ? '保存中…' : isEdit ? '保存修改' : '发布'}</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="writer-head">
          <input
            className="writer-title"
            placeholder="给这篇手记起个标题…"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <select
            className="chip"
            style={{ height: 36 }}
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
          >
            <option value="">未分类</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: 14, marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>标签（空格分隔，最多 5 个）</label>
            <input value={form.tags} placeholder="手作 山居 记录" onChange={(e) => set('tags', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>摘要（留空自动截取正文）</label>
            <input value={form.summary} placeholder="一句话说明这篇写了什么" onChange={(e) => set('summary', e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>封面色相 {form.cover_hue}°</label>
            <input type="range" min={0} max={360} value={form.cover_hue} onChange={(e) => set('cover_hue', e.target.value)} />
          </div>
        </div>

        <div className="editor-grid">
          <div className="editor-pane">
            <div className="pane-label"><span>MARKDOWN</span><span>支持 GFM 表格 / 代码块</span></div>
            <textarea
              className="md-input"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="editor-pane">
            <div className="pane-label"><span>PREVIEW</span><span>实时渲染</span></div>
            <Markdown>{form.content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
