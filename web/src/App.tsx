import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import { Loading } from './components/ui';

import Home from './pages/Home';
import Notes from './pages/Notes';
import PostDetail from './pages/PostDetail';
import Write from './pages/Write';
import QaList from './pages/QaList';
import QaDetail from './pages/QaDetail';
import Ask from './pages/Ask';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Auth from './pages/Auth';

/** 需要登录的页面：未登录跳转登录页并记住来源 */
function Protected({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes/:id" element={<PostDetail />} />
              <Route path="/write" element={<Protected><Write /></Protected>} />
              <Route path="/notes/:id/edit" element={<Protected><Write /></Protected>} />
              <Route path="/qa" element={<QaList />} />
              <Route path="/qa/:id" element={<QaDetail />} />
              <Route path="/ask" element={<Protected><Ask /></Protected>} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Protected><Cart /></Protected>} />
              <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
              <Route path="/orders" element={<Protected><Orders /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
