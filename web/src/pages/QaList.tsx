import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Empty, Loading, ModuleMarks, Pager } from '../components/ui';
import { fromNow } from '../lib/utils';

const SORTS = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '热门' },
  { key: 'unsolved', label: '待解决' },
  { key: 'unanswered', label: '零回答' },
];

export default function QaList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [keyword, setKeyword] = useState(params.get('keyword') || '');

  const page = Number(params.get('page') || 1);
  const sort = params.get('sort') || 'latest';
  const tag = params.get('tag') || '';

  useEffect(() => { api.get('/questions/tags').then(setTags).catch(() => {}); }, []);

  useEffect(() => {
    setData(null);
    const qs = new URLSearchParams({ page: String(page), pageSize: '8', sort });
    if (tag) qs.set('tag', tag);
    if (keyword) qs.set('keyword', keyword);
    api.get(`/questions?${qs}`).then(setData).catch(() => {});
  }, [page, sort, tag, keyword]);

  const patch = (next: Record<string, string>) => {
    const merged: Record<string, string> = { page: '1', sort, ...(tag ? { tag } : {}), ...(keyword ? { keyword } : {}), ...next };
    Object.keys(merged).forEach((k) => { if (!merged[k]) delete merged[k]; });
    setParams(merged);
  };

  return (
    <div className="page theme-qa">
      <div className="wrap">
        <ModuleMarks
          index="02"
          en="ASK"
          title="问山"
          desc="提问 -5 积分，回答 +10，被采纳 +30；问题被赞 +5，回答被赞 +10。答得好会有人记住你。"
        />

        <div className="toolbar">
          {SORTS.map((s) => (
            <button key={s.key} className={`chip ${sort === s.key ? 'on' : ''}`} onClick={() => patch({ sort: s.key })}>{s.label}</button>
          ))}
          <span className="spacer" />
          <div className="search-box">
            <span className="icon">⌕</span>
            <input
              placeholder="搜索问题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') patch({ keyword }); }}
            />
          </div>
          <Link to="/ask" className="btn btn-sm">我要提问</Link>
        </div>

        <div className="list-layout">
          <div>
            {!data ? <Loading /> : data.list.length === 0 ? (
              <Empty glyph="问" text="这里还没有问题，做第一个提问的人吧" action={<Link to="/ask" className="btn btn-sm">提问</Link>} />
            ) : (
              <>
                {data.list.map((q: any) => (
                  <div className="q-item" key={q.id}>
                    <div className="q-stats">
                      <div className="q-stat"><b>{q.votes}</b><span>赞同</span></div>
                      <div className={`q-stat ${q.is_solved ? 'accepted' : ''}`}>
                        <b>{q.answers_count}</b><span>回答</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="q-title" style={{ margin: 0 }}>
                        <Link to={`/qa/${q.id}`} className="q-title">{q.title}</Link>
                      </h3>
                      <p className="q-excerpt" style={{ marginTop: 6 }}>{q.content.replace(/[#>`*\-]/g, '').slice(0, 110)}</p>
                      <div className="q-tags">
                        {q.is_solved ? <span className="solved-flag">✓ 已解决</span> : null}
                        {q.tags.map((t: string) => (
                          <button key={t} className="chip" onClick={() => patch({ tag: t })}># {t}</button>
                        ))}
                        <span className="meta" style={{ marginLeft: 'auto' }}>
                          <span>{q.username}</span><span className="dot" />
                          <span>{fromNow(q.created_at)}</span><span className="dot" />
                          <span>{q.views} 浏览</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Pager page={page} totalPages={data.totalPages} onChange={(p) => patch({ page: String(p) })} />
              </>
            )}
          </div>

          <aside className="sidebar">
            <div className="side-card">
              <h4>热门标签</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {tags.slice(0, 12).map((t: any) => (
                  <button key={t.name} className={`chip ${tag === t.name ? 'on' : ''}`} onClick={() => patch({ tag: t.name })}>
                    {t.name} <span style={{ opacity: .6 }}>{t.count}</span>
                  </button>
                ))}
              </div>
              {tag && <button className="btn-text" style={{ marginTop: 12 }} onClick={() => patch({ tag: '' })}>清除筛选</button>}
            </div>
            <div className="side-card">
              <h4>积分规则</h4>
              <ul className="side-list">
                <li><a><span>发布提问</span><span className="count">-5</span></a></li>
                <li><a><span>提交回答</span><span className="count">+10</span></a></li>
                <li><a><span>回答被采纳</span><span className="count">+30</span></a></li>
                <li><a><span>问题被点赞</span><span className="count">+5</span></a></li>
                <li><a><span>回答被点赞</span><span className="count">+10</span></a></li>
              </ul>
            </div>
            <div className="side-card">
              <h4>提问小贴士</h4>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.9, margin: 0 }}>
                说清背景、给出你试过的做法、贴上报错信息。
                问题写得越具体，回答越有用。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
