import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Avatar, Cover, Loading, Stars } from '../components/ui';
import { useToast } from '../components/Toast';
import { fromNow, yuan } from '../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [p, setP] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQty(1);
    setActive(0);
    api.get(`/products/${id}`).then(setP).catch(() => {});
  }, [id]);

  if (!p) return <div className="page theme-shop"><Loading /></div>;

  const images = p.images?.length ? p.images : [''];
  const dist: Record<number, number> = {};
  for (const d of p.rating_dist || []) dist[d.rating] = d.n;

  const add = async () => {
    if (!user) { toast('登录后即可加入购物车'); nav('/login'); return; }
    setBusy(true);
    try {
      await api.post('/cart', { product_id: p.id, quantity: qty });
      window.dispatchEvent(new Event('banshan:cart'));
      toast('已加入购物车');
    } catch (e: any) { toast(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="page theme-shop">
      <div className="wrap">
        <div style={{ marginBottom: 24, fontSize: 12, color: 'var(--muted)' }}>
          <Link to="/shop" style={{ color: 'var(--muted)' }}>市集</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link to={`/shop?category=${encodeURIComponent(p.category)}`} style={{ color: 'var(--muted)' }}>{p.category}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{p.name}</span>
        </div>

        <div className="detail-grid">
          <div className="gallery">
            <Cover src={images[active]} glyph={p.name.slice(0, 1)} tag={p.category} ratio="square" />
            <div className="gallery-thumbs">
              {images.map((src: string, i: number) => (
                <button key={i} className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
                  <Cover src={src} glyph={p.name.slice(0, 1)} ratio="square" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mono-label">SKU-{String(p.id).padStart(4, '0')} · {p.category} · {p.maker}</span>
            <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 32, margin: '10px 0 6px', lineHeight: 1.35 }}>{p.name}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 12px' }}>{p.subtitle}</p>

            <div className="meta" style={{ marginBottom: 16 }}>
              <Stars value={p.rating} size={13} />
              <span style={{ color: 'var(--ink)' }}>{p.rating}</span>
              <span>· {p.review_count} 条评价</span>
              <span className="dot" />
              <span>已售 {p.sales} 件</span>
            </div>

            <div className="price-lg">
              {yuan(p.price)} <small>/ 件</small>
            </div>

            <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.95, margin: '16px 0 0' }}>{p.description}</p>

            <div className="buy-box">
              <div className="buy-row"><span>作者</span><span>{p.maker}</span></div>
              <div className="buy-row"><span>产地</span><span>{p.origin}</span></div>
              <div className="buy-row"><span>库存</span><span>{p.stock} 件</span></div>
              <div className="buy-row"><span>发货</span><span>48 小时内，包邮</span></div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</button>
              </div>
              <button className="btn btn-accent" onClick={add} disabled={busy || p.stock === 0} style={{ flex: 1 }}>
                {p.stock === 0 ? '已售罄' : busy ? '加入中…' : '加入购物车'}
              </button>
              <Link to="/cart" className="btn btn-ghost">去结算</Link>
            </div>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--rule)' }}>
              <table className="spec-table">
                <tbody>
                  <tr><th>材质</th><td>{p.material}</td></tr>
                  <tr><th>规格</th><td>{p.spec}</td></tr>
                  <tr><th>产地</th><td>{p.origin}</td></tr>
                  <tr><th>说明</th><td>小批量制作，颜色与纹理会有细微差异；7 天内可原包装寄回。</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 评价 */}
        <section style={{ marginTop: 60, maxWidth: 820 }}>
          <div className="section-head">
            <h2 style={{ fontSize: 22 }}>买家评价</h2>
            <span className="section-desc">{p.review_count} 条 · 全部来自已购买用户</span>
          </div>

          <div className="rating-summary">
            <div className="rating-big">
              <b>{p.rating}</b>
              <Stars value={p.rating} size={14} />
              <span>{p.review_count} 条评价</span>
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = dist[star] || 0;
                const pct = p.review_count ? Math.round((n / p.review_count) * 100) : 0;
                return (
                  <div className="rating-bar" key={star}>
                    <span>{star} 星</span>
                    <span className="track"><span className="fill" style={{ width: `${pct}%`, display: 'block' }} /></span>
                    <span style={{ width: 26, textAlign: 'right' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {p.reviews.map((r: any) => (
            <div className="review" key={r.id}>
              <Avatar name={r.author} hue={r.avatar_hue} size="md" />
              <div>
                <div className="who">
                  <b>{r.author}</b>
                  <Stars value={r.rating} />
                  <span style={{ marginLeft: 'auto' }}>{fromNow(r.created_at)}</span>
                </div>
                <p>{r.content}</p>
              </div>
            </div>
          ))}
        </section>

        {p.related?.length > 0 && (
          <section style={{ marginTop: 64 }}>
            <div className="section-head">
              <h2 style={{ fontSize: 22 }}>同类的东西</h2>
              <span className="section-desc">来自「{p.category}」</span>
              <Link to={`/shop?category=${encodeURIComponent(p.category)}`} className="section-more">看全部 →</Link>
            </div>
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {p.related.map((r: any) => (
                <Link to={`/shop/${r.id}`} className="prod-card" key={r.id}>
                  <Cover src={r.images?.[0]} glyph={r.name.slice(0, 1)} tag={r.category} ratio="square" />
                  <h3 className="name">{r.name}</h3>
                  <div className="row">
                    <span className="price">{yuan(r.price)}</span>
                    <span className="sold">已售 {r.sales}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
