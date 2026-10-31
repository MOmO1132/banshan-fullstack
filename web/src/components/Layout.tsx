import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Avatar } from './ui';

const NAV = [
  { to: '/', label: '首页', exact: true, mod: 'home' },
  { to: '/notes', label: '山间手记', mod: 'notes' },
  { to: '/qa', label: '问山', mod: 'qa' },
  { to: '/shop', label: '市集', mod: 'shop' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const loadCart = () => {
    if (!user) return setCartCount(0);
    api.get<{ totalCount: number }>('/cart').then((d) => setCartCount(d.totalCount)).catch(() => {});
  };

  useEffect(loadCart, [user, loc.pathname]);
  useEffect(() => {
    const h = () => loadCart();
    window.addEventListener('banshan:cart', h);
    return () => window.removeEventListener('banshan:cart', h);
  }, [user]);

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">山</span>
            <span className="brand-text">
              <span className="brand-cn">半山</span>
              <span className="brand-en">BANSHAN</span>
            </span>
          </Link>

          <nav className="nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                data-mod={item.mod}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="cart-link">
              购物车
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <>
                <Link to="/profile" title="个人中心" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={user.username} hue={user.avatar_hue} size="sm" />
                  <span style={{ fontSize: 12.5 }}>{user.username}</span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => { logout(); nav('/'); }}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-text">登录</Link>
                <Link to="/register" className="btn btn-sm">加入半山</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div>
            <div className="footer-brand">半山 BANSHAN</div>
            <p className="footer-note">
              写字、问山、赶集 —— 一个给独立创作者的小社区。<br />
              全栈练习项目 · React + TypeScript + Express + SQLite
            </p>
          </div>
          <div className="footer-links">
            <Link to="/notes">山间手记</Link>
            <Link to="/qa">问山</Link>
            <Link to="/shop">市集</Link>
            <Link to="/orders">我的订单</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
