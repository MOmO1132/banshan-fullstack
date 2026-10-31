import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Cover, Empty, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { yuan } from '../lib/utils';

export default function Cart() {
  const nav = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<any>(null);

  const load = () => api.get('/cart').then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const bump = async (item: any, delta: number) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    try {
      const d = await api.put(`/cart/${item.id}`, { quantity: next });
      setData(d);
      window.dispatchEvent(new Event('banshan:cart'));
    } catch (e: any) { toast(e.message); }
  };

  const remove = async (item: any) => {
    try {
      const d = await api.del(`/cart/${item.id}`);
      setData(d);
      window.dispatchEvent(new Event('banshan:cart'));
      toast('已移出购物车');
    } catch (e: any) { toast(e.message); }
  };

  if (!data) return <div className="page theme-shop"><Loading /></div>;

  return (
    <div className="page theme-shop">
      <div className="wrap">
        <div style={{ marginBottom: 26 }}>
          <span className="mono-label">CART</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 32, margin: '8px 0 0' }}>购物车</h1>
        </div>

        {data.list.length === 0 ? (
          <Empty glyph="篮" text="购物车还空着" action={<Link to="/shop" className="btn btn-sm">去市集逛逛</Link>} />
        ) : (
          <div className="cart-layout">
            <div>
              {data.list.map((item: any) => (
                <div className="cart-row" key={item.id}>
                  <Cover src={item.images?.[0]} hue={item.cover_hue} glyph={(item.name || '').slice(0, 1)} />
                  <div>
                    <Link to={`/shop/${item.product_id}`} style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{item.name}</Link>
                    <div className="meta" style={{ marginTop: 6 }}>
                      <span>{item.category}</span><span className="dot" />
                      <span>库存 {item.stock}</span>
                    </div>
                  </div>
                  <div className="qty">
                    <button onClick={() => bump(item, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => bump(item, 1)}>+</button>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 88 }}>
                    <div className="price" style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                      {yuan(item.price * item.quantity)}
                    </div>
                    <button className="btn-text" onClick={() => remove(item)}>移除</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 18 }}>
                <Link to="/shop" className="btn-text">← 继续挑选</Link>
              </div>
            </div>

            <aside className="summary">
              <div className="mono-label" style={{ marginBottom: 14 }}>ORDER SUMMARY</div>
              <div className="summary-row"><span>商品件数</span><span>{data.totalCount} 件</span></div>
              <div className="summary-row"><span>商品金额</span><span>{yuan(data.totalPrice)}</span></div>
              <div className="summary-row"><span>运费</span><span>包邮</span></div>
              <div className="summary-total">
                <span style={{ fontSize: 12.5, letterSpacing: 1 }}>合计</span>
                <b>{yuan(data.totalPrice)}</b>
              </div>
              <button className="btn btn-accent btn-block" onClick={() => nav('/checkout')}>去结算</button>
              <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '14px 0 0', lineHeight: 1.8 }}>
                这是一个练习项目，下单后会停留在「待支付」状态，不会产生真实交易。
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
