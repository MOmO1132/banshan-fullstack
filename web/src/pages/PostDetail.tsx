import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Markdown from '../components/Markdown';
import { Avatar, Cover, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { day, fromNow } from '../lib/utils';

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setPost(null);
    api.get(`/posts/${id}`)
      .then((p) => {
        setPost(p);
        if (p.category_slug) {
          api.get(`/posts?category=${p.category_slug}&pageSize=4`).then((d) => {
            setRelated(d.list.filter((x: any) => x.id !== p.id).slice(0, 3));
          }).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="page theme-notes"><div className="wrap"><div className="empty">
        <span className="glyph">404</span><p>{error}</p>
        <Link className="btn btn-ghost" to="/notes">返回手记</Link>
      </div></div></div>
    );
  }
  if (!post) return <div className="page theme-notes"><Loading /></div>;

  const isOwner = user?.id === post.author_id;

  const like = async () => {
    if (!user) { toast('登录后可以点赞'); nav('/login'); return; }
    try {
      const d = await api.post(`/posts/${post.id}/like`);
      setPost({ ...post, likes: d.likes });
      setLiked(true);
      toast('已记录你的喜欢');
    } catch (e: any) { toast(e.message); }
  };

  const remove = async () => {
    if (!window.confirm('确定删除这篇手记吗？删除后不可恢复。')) return;
    try { await api.del(`/posts/${post.id}`); toast('已删除'); nav('/notes'); }
    catch (e: any) { toast(e.message); }
  };

  return (
    <div className="page theme-notes">
      <div className="wrap">
        <div style={{ marginBottom: 26, fontSize: 12, color: 'var(--muted)' }}>
          <Link to="/notes" style={{ color: 'var(--muted)' }}>山间手记</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link to={`/notes?category=${post.category_slug || ''}`} style={{ color: 'var(--accent)' }}>
            {post.category_name || '未分类'}
          </Link>
        </div>

        <header className="article-head">
          <div className="meta" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ color: 'var(--accent)', letterSpacing: 1 }}>{post.category_name || '手记'}</span>
            <span className="dot" />
            <span>{day(post.created_at)}</span>
            <span className="dot" />
            <span>{post.read_minutes} 分钟读完</span>
          </div>
          <h1>{post.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: '30em', margin: '0 auto 16px', lineHeight: 1.8 }}>
            {post.summary}
          </p>
          <div className="meta">
            <Avatar name={post.username} hue={post.avatar_hue} size="md" />
            <span style={{ color: 'var(--ink)' }}>{post.username}</span>
            <span className="dot" />
            <span>{fromNow(post.created_at)}</span>
            <span className="dot" />
            <span>{post.views} 次阅读</span>
            <span className="dot" />
            <span>{post.likes} 人喜欢</span>
          </div>
        </header>

        <div className="article-cover">
          <Cover src={post.cover_url} glyph={post.title.slice(0, 1)} ratio="hero" tag={post.category_name} />
        </div>

        <article className="article-body">
          <Markdown>{post.content}</Markdown>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 34 }}>
            {post.tags.map((t: string) => (
              <Link key={t} to={`/notes?keyword=${encodeURIComponent(t)}`} className="chip"># {t}</Link>
            ))}
          </div>

          <div className="article-actions">
            <button className={`like-btn ${liked ? 'done' : ''}`} onClick={like}>
              <span style={{ fontSize: 13 }}>♥</span> 喜欢这篇 · {post.likes}
            </button>
            <span style={{ flex: 1 }} />
            {isOwner && (
              <>
                <Link to={`/notes/${post.id}/edit`} className="btn btn-ghost btn-sm">编辑</Link>
                <button className="btn-text" onClick={remove}>删除</button>
              </>
            )}
          </div>
        </article>

        <div style={{ maxWidth: 700, margin: '44px auto 0', padding: '26px 0 0', borderTop: '1px solid var(--ink)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar name={post.username} hue={post.avatar_hue} size="lg" />
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{post.username}</div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
              写于 {day(post.created_at)} · 也在市集摆摊
            </p>
          </div>
          <Link to="/notes" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>更多手记</Link>
        </div>

        {related.length > 0 && (
          <section style={{ marginTop: 64 }}>
            <div className="section-head">
              <h2 style={{ fontSize: 22 }}>同栏目</h2>
              <span className="section-desc">{post.category_name}</span>
            </div>
            <div className="post-grid">
              {related.map((r) => (
                <article className="post-card" key={r.id}>
                  <Link to={`/notes/${r.id}`}>
                    <Cover src={r.cover_url} glyph={r.title.slice(0, 1)} ratio="tall" />
                  </Link>
                  <h3 style={{ fontSize: 17 }}><Link to={`/notes/${r.id}`}>{r.title}</Link></h3>
                  <div className="meta" style={{ marginTop: 6 }}>
                    <span>{r.username}</span><span className="dot" />
                    <span>{r.read_minutes} 分钟</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
