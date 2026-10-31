import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { firstChar } from '../lib/utils';

type CoverProps = {
  src?: string;
  hue?: number;
  glyph?: string;
  tag?: string;
  ratio?: 'wide' | 'square' | 'tall' | 'hero' | 'thumb';
  className?: string;
};

/** 封面：有图用图（统一做暖调与裁切），无图回退到色相渐变 + 印章 */
export function Cover({ src, hue = 24, glyph, tag, ratio = 'wide', className = '' }: CoverProps) {
  const hasImg = Boolean(src);
  return (
    <div
      className={`cover cover-${ratio} ${hasImg ? 'cover-img' : ''} ${className}`}
      style={{ ['--hue' as any]: hue }}
    >
      {hasImg && <img src={src} alt={glyph || ''} loading="lazy" />}
      {tag && <span className="cover-tag">{tag}</span>}
      {!hasImg && <span className="cover-glyph">{glyph || '山'}</span>}
      {hasImg && <span className="cover-shade" />}
    </div>
  );
}

export function Avatar({ name, hue, size = 'sm' }: { name: string; hue: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`avatar ${size}`} style={{ ['--hue' as any]: hue }}>{firstChar(name)}</span>
  );
}

export function Stars({ value = 5, size = 12 }: { value?: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} 星`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'on' : ''}>★</span>
      ))}
    </span>
  );
}

export function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );
  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>←</button>
      {pages.map((p, i) => (
        <span key={p} style={{ display: 'contents' }}>
          {i > 0 && p - pages[i - 1] > 1 && <span style={{ color: 'var(--muted)', fontSize: 12 }}>…</span>}
          <button className={p === page ? 'on' : ''} onClick={() => onChange(p)}>{p}</button>
        </span>
      ))}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>→</button>
    </div>
  );
}

export function Empty({ glyph = '空', text, action }: { glyph?: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="glyph">{glyph}</span>
      <p>{text}</p>
      {action}
    </div>
  );
}

export const Loading = ({ text = '载入中' }: { text?: string }) => <div className="loading">{text}</div>;

export function SectionHead({ title, desc, more, to }: { title: string; desc?: string; more?: string; to?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {desc && <span className="section-desc">{desc}</span>}
      {more && to && <Link className="section-more" to={to}>{more} →</Link>}
    </div>
  );
}

/** 模块标识：色块 + 序号 + 名称，用于页面顶部强化「你在哪一块」 */
export function ModuleMarks({ index, en, title, desc }: { index: string; en: string; title: string; desc: string }) {
  return (
    <header className="module-head">
      <span className="module-index">{index}</span>
      <div>
        <span className="module-en">{en}</span>
        <h1 className="module-title">{title}</h1>
        <p className="module-desc">{desc}</p>
      </div>
    </header>
  );
}
