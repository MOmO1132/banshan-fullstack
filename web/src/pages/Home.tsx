import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Avatar, Cover, Loading, SectionHead, Stars } from '../components/ui';
import { fromNow, num, yuan } from '../lib/utils';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [makers, setMakers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => {});
    api.get('/posts?pageSize=3').then((d) => setPosts(d.list)).catch(() => {});
    api.get('/questions?sort=hot&pageSize=4').then((d) => setQuestions(d.list)).catch(() => {});
    api.get('/products?pageSize=4&sort=sales').then((d) => setProducts(d.list)).catch(() => {});
    api.get('/makers').then(setMakers).catch(() => {});
  }, []);

  const [feature, ...rest] = posts;

  return (
    <div className="page theme-notes">
      <div className="wrap">
        {/* Hero */}
        <section className="hero2">
          <div className="hero2-grid">
            <div>
              <span className="mono-label">BANSHAN · 一个给手作人的社区</span>
              <h1>
                写字、问山、<em>赶集</em>。<br />
                把日子过成作品。
              </h1>
              <p className="lead">
                这里住着一群做东西的人：烧陶的、烘豆的、做木工的、写代码的。
                他们把过程写成手记，把困惑丢进问山，把做出来的器物摆到市集上。
                没有算法推荐，只有人和人的来往。
              </p>
              <div className="hero-actions">
                <Link to="/notes" className="btn">读一篇手记</Link>
                <Link to="/shop" className="btn btn-ghost">逛市集</Link>
                <span className="hero-note">本周新增 5 篇手记 · 12 件器物</span>
              </div>
            </div>

            <div className="mosaic">
              <Cover src="/images/scene-studio-1.jpg" ratio="square" tag="工作室" />
              <Cover src="/images/prod-mug-orange.jpg" ratio="square" tag="器物" />
              <Cover src="/images/scene-coffee.jpg" ratio="square" tag="咖啡" />
            </div>
          </div>

          <div className="number-strip">
            {[
              [stats?.posts, '篇手记'], [stats?.questions, '个提问'],
              [stats?.products, '件器物'], [stats?.members, '位山民'],
            ].map(([v, label]) => (
              <div className="cell" key={label as string}>
                <b>{v ? num(v as number) : '—'}</b><span>{label as string}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 三个模块 */}
        <section style={{ marginTop: 56 }}>
          <SectionHead title="三个入口" desc="每个地方有自己的颜色和规矩" />
          <div className="module-grid">
            <Link to="/notes" className="module-card t-notes">
              <span className="module-no">01 / NOTES</span>
              <h3>山间手记</h3>
              <p>长文写作，支持 Markdown、分类与标签。适合把一段经历慢慢写完，读者会在文末留言。</p>
              <span className="module-go">去读手记 →</span>
              <span className="module-watermark">记</span>
            </Link>
            <Link to="/qa" className="module-card t-qa">
              <span className="module-no">02 / ASK</span>
              <h3>问山</h3>
              <p>提问、回答、点赞、采纳。提问扣 5 积分，回答加 10 分，被采纳加 30 分。</p>
              <span className="module-go">去提个问 →</span>
              <span className="module-watermark">问</span>
            </Link>
            <Link to="/shop" className="module-card t-shop">
              <span className="module-no">03 / MARKET</span>
              <h3>市集</h3>
              <p>二十余件手作器物与烘焙咖啡豆，每件都写着作者、产地和做法，下单后由本人打包寄出。</p>
              <span className="module-go">去逛市集 →</span>
              <span className="module-watermark">集</span>
            </Link>
          </div>
        </section>

        {/* 头条 + 两篇 */}
        <section style={{ marginTop: 64 }}>
          <SectionHead title="编辑推荐" desc="这一周值得读完的三篇" more="全部手记" to="/notes" />
          {!posts.length ? <Loading /> : (
            <div className="feature-grid">
              <article className="feature-main">
                <Link to={`/notes/${feature.id}`}>
                  <Cover src={feature.cover_url} glyph={feature.title.slice(0, 1)} tag={feature.category_name} />
                </Link>
                <div className="meta" style={{ marginBottom: 10 }}>
                  <span style={{ color: 'var(--accent)' }}>{feature.category_name}</span>
                  <span className="dot" />
                  <span>{feature.read_minutes} 分钟读完</span>
                </div>
                <h3><Link to={`/notes/${feature.id}`}>{feature.title}</Link></h3>
                <p>{feature.summary}</p>
                <div className="meta">
                  <Avatar name={feature.username} hue={feature.avatar_hue} />
                  <span>{feature.username}</span>
                  <span className="dot" />
                  <span>{fromNow(feature.created_at)}</span>
                  <span className="dot" />
                  <span>{feature.views} 阅读</span>
                  <span className="dot" />
                  <span>♥ {feature.likes}</span>
                </div>
              </article>

              <div className="feature-side">
                {rest.map((p) => (
                  <article className="feature-mini" key={p.id}>
                    <Link to={`/notes/${p.id}`}>
                      <Cover src={p.cover_url} glyph={p.title.slice(0, 1)} />
                    </Link>
                    <div>
                      <h4><Link to={`/notes/${p.id}`}>{p.title}</Link></h4>
                      <div className="meta">
                        <span>{p.username}</span><span className="dot" />
                        <span>{p.read_minutes} 分钟</span>
                      </div>
                    </div>
                  </article>
                ))}
                <Link to="/notes" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>查看更多手记</Link>
              </div>
            </div>
          )}
        </section>

        {/* 问山 + 作者榜 */}
        <section style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 52 }}>
          <div className="theme-qa">
            <SectionHead title="问山 · 正在讨论" desc="回答有积分" more="进入问山" to="/qa" />
            {questions.map((q) => (
              <Link to={`/qa/${q.id}`} key={q.id} className="q-item" style={{ gridTemplateColumns: '54px 1fr', padding: '16px 0' }}>
                <div className="q-stats">
                  <div className="q-stat"><b>{q.votes}</b><span>赞同</span></div>
                  <div className={`q-stat ${q.is_solved ? 'accepted' : ''}`}><b>{q.answers_count}</b><span>回答</span></div>
                </div>
                <div>
                  <div className="q-title" style={{ fontSize: 16.5, marginBottom: 6 }}>
                    {q.title}
                    {q.is_solved ? <span className="solved-flag" style={{ marginLeft: 8 }}>已解决</span> : null}
                  </div>
                  <div className="meta">
                    <span>{q.username}</span><span className="dot" />
                    <span>{fromNow(q.created_at)}</span><span className="dot" />
                    <span>{q.views} 浏览</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div>
            <SectionHead title="山民榜" desc="按积分" />
            <div className="maker-list">
              {makers.map((m, i) => (
                <div className="maker-row" key={m.id}>
                  <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                  <Avatar name={m.username} hue={m.avatar_hue} size="md" />
                  <div>
                    <div className="name">{m.username}</div>
                    <div className="bio">{m.posts} 篇手记 · {m.answers} 个回答</div>
                  </div>
                  <span className="pts">{m.points}</span>
                </div>
              ))}
            </div>
            <div className="side-card" style={{ marginTop: 26 }}>
              <h4>这里在做什么</h4>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.95, margin: 0 }}>
                半山是一个练习项目：用 React + TypeScript 写前端，Express + SQLite 写后端，
                把博客、问答、商城三套业务放进同一个账号体系里。
              </p>
            </div>
          </div>
        </section>

        {/* 市集 */}
        <section style={{ marginTop: 64 }} className="theme-shop">
          <SectionHead title="市集 · 本周热卖" desc="作者直发，48 小时内打包" more="全部商品" to="/shop" />
          <div className="product-grid">
            {products.map((p: any) => (
              <Link to={`/shop/${p.id}`} key={p.id} className="prod-card">
                <Cover src={p.images?.[0]} glyph={p.name.slice(0, 1)} tag={p.category} ratio="square" />
                <h3 className="name">{p.name}</h3>
                <p className="sub">{p.subtitle}</p>
                <div className="meta" style={{ marginBottom: 6 }}>
                  <Stars value={p.rating} />
                  <span>{p.rating} · {p.review_count} 条评价</span>
                </div>
                <div className="row">
                  <span className="price">{yuan(p.price)}</span>
                  <span className="sold">已售 {p.sales}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 引文 */}
        <section style={{ marginTop: 72, padding: '36px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.9, maxWidth: '34em', margin: '0 auto', color: 'var(--ink)' }}>
            「城市教我们缩短反馈回路，山里教我们接受延迟。」
          </p>
          <span className="mono-label" style={{ display: 'block', marginTop: 14 }}>
            — 林深 · 把工作室搬到山里之后的第 100 天
          </span>
        </section>
      </div>
    </div>
  );
}
