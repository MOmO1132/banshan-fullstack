import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Avatar, Cover, Empty, Loading, ModuleMarks, Pager } from '../components/ui';
import { fromNow } from '../lib/utils';

export default function Notes() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [sort, setSort] = useState(params.get('sort') || 'latest');

  const page = Number(params.get('page') || 1);
  const category = params.get('category') || '';

  useEffect(() => { api.get('/posts/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    setData(null);
    const qs = new URLSearchParams({ page: String(page), pageSize: '6', sort });
    if (category) qs.set('category', category);
    if (keyword) qs.set('keyword', keyword);
    api.get(`/posts?${qs}`).then(setData).catch(() => {});
  }, [page, category, sort, keyword]);

  const patch = (next: Record<string, string>) => {
    const merged: Record<string, string> = {
      page: '1', sort, ...(category ? { category } : {}), ...(keyword ? { keyword } : {}), ...next,
    };
    Object.keys(merged).forEach((k) => { if (!merged[k]) delete merged[k]; });
    setParams(merged);
  };

  return (
    <div className="page theme-notes">
      <div className="wrap">
        <ModuleMarks
          index="01"
          en="NOTES"
          title="山间手记"
          desc={`${data?.total ?? '—'} 篇长文 · 关于手艺、产品，和把日子过成作品`}
        />

        <div className="toolbar">
          <button className={`chip ${!category ? 'on' : ''}`} onClick={() => patch({ category: '' })}>全部</button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${category === c.slug ? 'on' : ''}`}
              onClick={() => patch({ category: c.slug })}
            >
              {c.name} <span style={{ opacity: .6 }}>{c.post_count}</span>
            </button>
          ))}
          <span className="spacer" />
          <div className="search-box">
            <span className="icon">⌕</span>
            <input
              placeholder="搜索标题、正文、标签"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') patch({ keyword }); }}
            />
          </div>
          <button
            className={`chip ${sort === 'hot' ? 'on' : ''}`}
            onClick={() => { const s = sort === 'hot' ? 'latest' : 'hot'; setSort(s); patch({ sort: s }); }}
          >
            {sort === 'hot' ? '按热度' : '按时间'}
          </button>
          <Link to="/write" className="btn btn-sm">写手记</Link>
        </div>

        <div className="list-layout">
          <div>
            {!data ? <Loading /> : data.list.length === 0 ? (
              <Empty glyph="无" text="没有找到相符的手记，换个关键词试试" />
            ) : (
              <>
                <div className="post-grid">
                  {data.list.map((p: any) => (
                    <article className="post-card" key={p.id}>
                      <Link to={`/notes/${p.id}`}>
                        <Cover src={p.cover_url} glyph={p.title.slice(0, 1)} tag={p.category_name || '手记'} />
                      </Link>
                      <div className="meta" style={{ marginBottom: 8 }}>
                        <span style={{ color: 'var(--accent)' }}>{p.category_name || '未分类'}</span>
                        <span className="dot" />
                        <span>{p.read_minutes} 分钟</span>
                      </div>
                      <h3><Link to={`/notes/${p.id}`}>{p.title}</Link></h3>
                      <p>{p.summary}</p>
                      <div className="meta">
                        <Avatar name={p.username} hue={p.avatar_hue} />
                        <span>{p.username}</span>
                        <span className="dot" />
                        <span>{fromNow(p.created_at)}</span>
                        <span className="dot" />
                        <span>{p.views} 阅读</span>
                        <span className="dot" />
                        <span>♥ {p.likes}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <Pager page={page} totalPages={data.totalPages} onChange={(p) => patch({ page: String(p) })} />
              </>
            )}
          </div>

          <aside className="sidebar">
            <div className="side-card">
              <h4>分类</h4>
              <ul className="side-list">
                {categories.map((c) => (
                  <li key={c.id}>
                    <a onClick={() => patch({ category: c.slug })} style={{ cursor: 'pointer' }}>
                      <span>{c.name}</span><span className="count">{c.post_count}</span>
                    </a>
                    <div style={{ fontSize: 11, color: 'var(--muted)', paddingBottom: 6 }}>{c.description}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="side-card">
              <h4>标签</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['手作', '独立开发', '读书', '咖啡', '山居', '定价', '数据库', '全栈', '木工', '设计'].map((t) => (
                  <button key={t} className="chip" onClick={() => { setKeyword(t); patch({ keyword: t }); }}># {t}</button>
                ))}
              </div>
            </div>
            <div className="side-card">
              <h4>关于这个栏目</h4>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.95, margin: 0 }}>
                手记不追求结论，只记录过程。每篇 3-8 分钟读完，
                支持 Markdown、分类和标签，方便日后翻回来。
              </p>
            </div>
            <Link to="/write" className="btn btn-block">写一篇手记</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
