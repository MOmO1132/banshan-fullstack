import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { login, register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');
    if (!isLogin && form.password !== form.confirm) return setError('两次输入的密码不一致');
    if (!isLogin && form.username.trim().length < 3) return setError('用户名至少 3 个字符');
    if (form.password.length < 6) return setError('密码至少 6 位');
    setBusy(true);
    try {
      if (isLogin) await login(form.username, form.password);
      else await register(form.username, form.email, form.password);
      toast(isLogin ? '欢迎回来' : '欢迎加入半山，已赠送 100 积分');
      nav(loc.state?.from || '/', { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="page">
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', minHeight: 460, paddingTop: 20, paddingBottom: 40 }}>
        <div>
          <span className="mono-label">BANSHAN · SINCE 2025</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 46, lineHeight: 1.35, margin: '14px 0 18px' }}>
            一个人写字，<br />一群人<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>问山</em>。
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.95, maxWidth: '26em' }}>
            半山是一个给独立创作者的小社区：写手记、提问题、摆市集。
            注册即送 100 积分，够你问 20 个问题。
          </p>
          <div style={{ marginTop: 30, paddingTop: 22, borderTop: '1px solid var(--rule)', fontSize: 12.5, color: 'var(--muted)', lineHeight: 2 }}>
            <div>演示账号：<b style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>demo</b> / <b style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>demo123456</b></div>
            <div>密码使用 bcrypt 加密存储，登录后签发 7 天有效的 JWT。</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-head">
            <h1>{isLogin ? '登录半山' : '加入半山'}</h1>
            <p>{isLogin ? '用用户名或邮箱登录' : '用户名 3-20 字符，密码至少 6 位'}</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>{isLogin ? '用户名 / 邮箱' : '用户名'}</label>
              <input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder={isLogin ? 'demo' : '给自己起个名字'} autoComplete="username" />
            </div>

            {!isLogin && (
              <div className="field">
                <label>邮箱</label>
                <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" type="email" />
              </div>
            )}

            <div className="field">
              <label>密码</label>
              <input value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="至少 6 位" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </div>

            {!isLogin && (
              <div className="field">
                <label>确认密码</label>
                <input value={form.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="再输一次" type="password" />
              </div>
            )}

            <button className="btn btn-block" type="submit" disabled={busy}>
              {busy ? '处理中…' : isLogin ? '登录' : '注册并登录'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', margin: '18px 0 0' }}>
            {isLogin ? '还没有账号？' : '已经有账号了？'}
            <Link to={isLogin ? '/register' : '/login'} style={{ color: 'var(--accent)', marginLeft: 6 }}>
              {isLogin ? '去注册' : '去登录'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
