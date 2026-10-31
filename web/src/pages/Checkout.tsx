import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Cover, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { yuan } from '../lib/utils';

const EMPTY_ADDR = { name: '', phone: '', province: '', city: '', district: '', detail: '', is_default: 1 };

export default function Checkout() {
  const nav = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_ADDR);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadAddr = async () => {
    const list = await api.get('/addresses');
    setAddresses(list);
    const def = list.find((a: any) => a.is_default) || list[0];
    setSelected(def ? def.id : null);
    if (!list.length) setShowForm(true);
  };

  useEffect(() => {
    api.get('/cart').then(setCart).catch(() => {});
    loadAddr().catch(() => {});
  }, []);

  const saveAddress = async () => {
    setError('');
    try {
      const created = await api.post('/addresses', form);
      await loadAddr();
      setSelected(created.id);
      setForm(EMPTY_ADDR);
      setShowForm(false);
      toast('地址已保存');
    } catch (e: any) { setError(e.message); }
  };

  const submit = async () => {
    setError('');
    if (!selected) return setError('请先选择收货地址');
    setBusy(true);
    try {
      const order = await api.post('/orders', { address_id: selected });
      window.dispatchEvent(new Event('banshan:cart'));
      toast(`下单成功，订单号 ${order.order_no}`);
      nav('/orders');
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (!cart) return <div className="page theme-shop"><Loading /></div>;
  if (cart.list.length === 0) {
    return (
      <div className="page theme-shop"><div className="wrap"><div className="empty">
        <span className="glyph">篮</span><p>购物车是空的，先去挑几件东西</p>
        <Link to="/shop" className="btn btn-sm">去市集</Link>
      </div></div></div>
    );
  }

  return (
    <div className="page theme-shop">
      <div className="wrap">
        <div style={{ marginBottom: 26 }}>
          <span className="mono-label">CHECKOUT</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 32, margin: '8px 0 0' }}>确认订单</h1>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="cart-layout">
          <div>
            {/* 地址 */}
            <div className="section-head" style={{ borderBottomColor: 'var(--rule-strong)' }}>
              <h2 style={{ fontSize: 19 }}>收货地址</h2>
              <button className="section-more btn-text" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(!showForm)}>
                {showForm ? '收起' : '+ 新增地址'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {addresses.map((a: any) => (
                <label
                  key={a.id}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', cursor: 'pointer',
                    border: `1px solid ${selected === a.id ? 'var(--ink)' : 'var(--rule)'}`,
                    background: selected === a.id ? 'var(--paper-2)' : 'transparent',
                  }}
                >
                  <input type="radio" checked={selected === a.id} onChange={() => setSelected(a.id)} style={{ marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5 }}>
                      {a.name} <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{a.phone}</span>
                      {a.is_default ? <span className="chip chip-accent" style={{ marginLeft: 10, height: 20 }}>默认</span> : null}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                      {a.province}{a.city}{a.district}{a.detail}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {showForm && (
              <div style={{ border: '1px solid var(--rule)', background: 'var(--paper-2)', padding: 20, marginBottom: 26 }}>
                <div className="field-row">
                  <div className="field"><label>收货人</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="张三" /></div>
                  <div className="field"><label>手机号</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="13800000000" /></div>
                </div>
                <div className="field-row">
                  <div className="field"><label>省份</label><input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="浙江省" /></div>
                  <div className="field"><label>城市</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="杭州市" /></div>
                </div>
                <div className="field"><label>区县</label><input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="西湖区" /></div>
                <div className="field"><label>详细地址</label><input value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="街道、门牌号、楼层" /></div>
                <button className="btn btn-ghost btn-sm" onClick={saveAddress}>保存这个地址</button>
              </div>
            )}

            {/* 商品清单 */}
            <div className="section-head" style={{ borderBottomColor: 'var(--rule-strong)' }}>
              <h2 style={{ fontSize: 19 }}>商品清单</h2>
              <span className="section-desc">共 {cart.totalCount} 件</span>
            </div>
            <div>
              {cart.list.map((item: any) => (
                <div className="cart-row" key={item.id} style={{ gridTemplateColumns: '84px 1fr auto' }}>
                  <Cover src={item.images?.[0]} hue={item.cover_hue} glyph={(item.name || '').slice(0, 1)} />
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{item.name}</div>
                    <div className="meta" style={{ marginTop: 4 }}><span>{yuan(item.price)} × {item.quantity}</span></div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{yuan(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="summary">
            <div className="mono-label" style={{ marginBottom: 14 }}>PAYMENT</div>
            <div className="summary-row"><span>商品金额</span><span>{yuan(cart.totalPrice)}</span></div>
            <div className="summary-row"><span>运费</span><span>包邮</span></div>
            <div className="summary-row"><span>支付方式</span><span>模拟支付（练习用）</span></div>
            <div className="summary-total">
              <span style={{ fontSize: 12.5, letterSpacing: 1 }}>应付</span>
              <b>{yuan(cart.totalPrice)}</b>
            </div>
            <button className="btn btn-accent btn-block" onClick={submit} disabled={busy}>
              {busy ? '提交中…' : '提交订单'}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '14px 0 0', lineHeight: 1.85 }}>
              提交后会扣减库存并生成「待支付」订单，可在订单页模拟支付或取消。
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
