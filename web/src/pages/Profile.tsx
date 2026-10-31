import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar, Empty, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { STATUS_TEXT, day, fromNow, yuan } from '../lib/utils';

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'posts' | 'questions' | 'orders'>('posts');
  const [overview, setOverview] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bio, setBio] = useState(user?.bio || '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get('/auth/me/overview').then(setOverview).catch(() => {});
    if (user) {
      api.get(`/posts?author=${user.id}&pageSize=20`).then((d) => setPosts(d.list)).catch(() => {});
      api.get('/questions?pageSize=20').then((d) => setQuestions(d.list.filter((q: any) => q.author_id === user.id))).catch(() => {});
      api.get('/orders').then(setOrders).catch(() => {});
    }
    setBio(user?.bio || '');
  }, [user?.id]);

  if (!user) return <div className="page"><Loading /></div>;

  const saveBio = async () => {
    try {
      await api.put('/auth/me', { bio });
      await refresh();
      setEditing(false);
      toast('资料已更新');
    } catch (e: any) { toast(e.message); }
  };

  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 940 }}>
        <div className="profile-head">
          <Avatar name={user.username} hue={user.avatar_hue} size="lg" />
          <div>
            <h1>{user.username}</h1>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  style={{ border: '1px solid var(--rule-strong)', background: 'var(--paper-2)', padding: '6px 10px', fontSize: 13, width: 320 }}
                />
                <button className="btn btn-sm" onClick={saveBio}>保存</button>
                <button className="btn-text" onClick={() => { setEditing(false); setBio(user.bio || ''); }}>取消</button>
              </div>
            ) : (
              <p>
                {user.bio || '还没有写简介'} · 加入于 {day(user.created_at)}
                <button className="btn-text" style={{ marginLeft: 10 }} onClick={() => setEditing(true)}>编辑</button>
              </p>
            )}
          </div>
          <div className="points-badge">
            <b>{user.points}</b><span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>积分</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: 26 }}>
          {[
            ['手记', overview?.posts], ['提问', overview?.questions], ['回答', overview?.answers],
            ['订单', overview?.orders], ['被阅读', overview?.views],
          ].map(([label, value]: any) => (
            <div className="stat-cell" key={label} style={{ background: 'var(--paper-2)' }}>
              <b style={{ fontSize: 22 }}>{value ?? '—'}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button className={tab === 'posts' ? 'on' : ''} onClick={() => setTab('posts')}>我的手记 {posts.length ? `(${posts.length})` : ''}</button>
          <button className={tab === 'questions' ? 'on' : ''} onClick={() => setTab('questions')}>我的提问 {questions.length ? `(${questions.length})` : ''}</button>
          <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>我的订单</button>
          <span style={{ flex: 1 }} />
          <Link to="/write" className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }}>写手记</Link>
        </div>

        {tab === 'posts' && (posts.length === 0 ? (
          <Empty glyph="记" text="还没有写过手记" action={<Link to="/write" className="btn btn-sm">写第一篇</Link>} />
        ) : posts.map((p) => (
          <Link key={p.id} to={`/notes/${p.id}`} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{p.title}</div>
              <div className="meta" style={{ marginTop: 5 }}>
                <span>{p.category_name || '未分类'}</span><span className="dot" />
                <span>{day(p.created_at)}</span><span className="dot" />
                <span>{p.views} 阅读</span>
              </div>
            </div>
            <span style={{ color: 'var(--muted)' }}>→</span>
          </Link>
        )))}

        {tab === 'questions' && (questions.length === 0 ? (
          <Empty glyph="问" text="还没有提过问题" action={<Link to="/ask" className="btn btn-sm">去提问</Link>} />
        ) : questions.map((q) => (
          <Link key={q.id} to={`/qa/${q.id}`} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            <div className="q-stat" style={{ width: 54, flex: 'none' }}><b>{q.votes}</b><span>赞</span></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{q.title}</div>
              <div className="meta" style={{ marginTop: 5 }}>
                <span>{q.answers_count} 个回答</span><span className="dot" />
                <span>{q.is_solved ? '已解决' : '讨论中'}</span><span className="dot" />
                <span>{fromNow(q.created_at)}</span>
              </div>
            </div>
          </Link>
        )))}

        {tab === 'orders' && (orders.length === 0 ? (
          <Empty glyph="单" text="还没有订单" action={<Link to="/shop" className="btn btn-sm">去市集</Link>} />
        ) : orders.map((o) => (
          <div key={o.id} className="order-card">
            <div className="order-head">
              <span>{o.order_no}</span>
              <span>{fromNow(o.created_at)}</span>
              <span className={`order-status ${o.status}`}>{STATUS_TEXT[o.status]}</span>
            </div>
            <div className="order-body">
              <div style={{ flex: 1, fontSize: 13.5 }}>
                {o.items.map((i: any) => `${i.name} ×${i.quantity}`).join('、')}
              </div>
              <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{yuan(o.total_price)}</div>
            </div>
          </div>
        )))}

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--rule)', display: 'flex', gap: 16 }}>
          <Link to="/orders" className="btn-text">查看全部订单</Link>
          <button className="btn-text" onClick={logout}>退出登录</button>
        </div>
      </div>
    </div>
  );
}
