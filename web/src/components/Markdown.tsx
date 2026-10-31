import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Markdown 渲染：统一走 prose 样式，不启用原始 HTML，避免 XSS */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
