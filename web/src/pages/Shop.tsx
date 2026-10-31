import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Cover, Empty, Loading, ModuleMarks, Pager, Stars } from '../components/ui';
import { yuan } from '../lib/utils';

const SORTS = [
  { key: 'latest', label: '最新上架' },
  { key: 'sales', label: '销量优先' },
  { key: 'priceAsc', label: '价格从低到高' },
  { key: 'priceDesc', label: '价格从高到低' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [keyword, setKeyword] = useState(params.get('keyword') || '');

  const page = Number(params.get('page') || 1);
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'latest';

  useEffect(() => {
    setData(null);
    const qs = new URLSearchParams({ page: String(page), pageSize: '8', sort, category });
    if (keyword) qs.set('keyword', keyword);
    api.get(`/products?${qs}`).then(setData).catch(() => {});
  }, [page, category, sort, keyword]);

  const patch = (next: Record<string, string>) => {
    const merged: Record<string, string> = { page: '1', sort, category, ...(keyword ? { keyword } : {}), ...next };
    Object.keys(merged).forEach((k) => { if (!merged[k]) delete merged[k]; });
    setParams(merged);
  };

  return (
    <div className="page theme-shop">
      <div className="wrap">
        <ModuleMarks
          index="03"
          en="MARKET"
          title="市集"
          desc={`${data?.total ?? '—'} 件在售 · 手作器物、纸品、香氛、咖啡与木作，每件都写着作者和产地`}
        />

        <div className="cat-tiles" style={{ marginBottom: 28 }}>
          {(data?.categories || []).map((c: any) => (
            <button
              key={c.name}
              className="cat-tile"
              onClick={() => patch({ category: c.name })}
              style={{ borderColor: category === c.name ? 'var(--accent)' : undefined, cursor: 'pointer', textAlign: 'left' }}
            >
              <b>{c.name}</b>
              <span>{c.count} 件在售</span>
            </button>
          ))}
        </div>

        <div className="toolbar">
          <button className={`chip ${category === 'all' ? 'on' : ''}`} onClick={() => patch({ category: 'all' })}>全部</button>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
            {category === 'all' ? '按分类浏览' : `正在看「${category}」`}
          </span>
          <span className="spacer" />
          <div className="search-box">
            <span className="icon">⌕</span>
            <input
              placeholder="搜索商品"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') patch({ keyword }); }}
            />
          </div>
          <select
            className="chip"
            style={{ height: 36, paddingRight: 8 }}
            value={sort}
            onChange={(e) => patch({ sort: e.target.value })}
          >
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <Link to="/cart" className="btn btn-ghost btn-sm">购物车</Link>
        </div>

        {!data ? <Loading /> : data.list.length === 0 ? (
          <Empty glyph="空" text="这个分类下暂时没有商品" />
        ) : (
          <>
            <div className="product-grid">
              {data.list.map((p: any) => (
                <Link to={`/shop/${p.id}`} className="prod-card" key={p.id}>
                  <Cover src={p.images?.[0]} glyph={p.name.slice(0, 1)} tag={p.category} ratio="square" />
                  <h3 className="name">{p.name}</h3>
                  <p className="sub">{p.subtitle}</p>
                  <div className="meta" style={{ marginBottom: 6 }}>
                    <Stars value={p.rating} />
                    <span>{p.rating} · {p.review_count} 条</span>
                  </div>
                  <div className="row">
                    <span className="price">{yuan(p.price)}</span>
                    <span className="sold">已售 {p.sales} · 库存 {p.stock}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Pager page={page} totalPages={data.totalPages} onChange={(p) => patch({ page: String(p) })} />
          </>
        )}
      </div>
    </div>
  );
}
