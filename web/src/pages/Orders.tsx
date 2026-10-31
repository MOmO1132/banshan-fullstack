import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Cover, Empty, Loading } from '../components/ui';
import { useToast } from '../components/Toast';
import { STATUS_TEXT, fromNow, yuan } from '../lib/utils';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'cancelled', label: '已取消' },
];

export default function Orders() {
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [orders, setOrders] = useState<any[] | null>(null);

  const load = (s = status) => {
    setOrders(null);
    api.get(`/orders?status=${s}`).then(setOrders).catch(() => setOrders([]));
  };
  useEffect(() => { load(status); }, [status]);

  const act = async (order: any, action: 'pay' | 'cancel') => {
    if (action === 'cancel' && !window.confirm('取消后库存会退回，确定取消这笔订单吗？')) return;
    try {
      await api.put(`/orders/${order.id}/${action}`);
      toast(action === 'pay' ? '支付成功（模拟）' : '订单已取消');
      load(status);
    } catch (e: any) { toast(e.message); }
  };

  return (
    <div className="page theme-shop">
      <div className="wrap" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 22 }}>
          <span className="mono-label">ORDERS</span>
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 32, margin: '8px 0 0' }}>我的订单</h1>
        </div>

        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={status === f.key ? 'on' : ''} onClick={() => setStatus(f.key)}>{f.label}</button>
          ))}
        </div>

        {!orders ? <Loading /> : orders.length === 0 ? (
          <Empty glyph="单" text="还没有订单" action={<Link to="/shop" className="btn btn-sm">去市集看看</Link>} />
        ) : orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-head">
              <span>{o.order_no}</span>
              <span>{fromNow(o.created_at)}</span>
              <span className={`order-status ${o.status}`}>{STATUS_TEXT[o.status]}</span>
            </div>
            <div className="order-body">
              <div className="order-item-thumb">
                {o.items.slice(0, 4).map((it: any) => (
                  <Cover key={it.id} src={it.image} hue={it.cover_hue} glyph={(it.name || '').slice(0, 1)} />
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5 }}>
                  {o.items[0].name}
                  {o.items.length > 1 ? ` 等 ${o.items.length} 件商品` : ''}
                  <span style={{ color: 'var(--muted)', marginLeft: 10 }}>× {o.items.reduce((s: number, i: any) => s + i.quantity, 0)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>{o.receiver} · {o.address_text}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--accent)' }}>{yuan(o.total_price)}</div>
              </div>
            </div>
            <div className="order-foot">
              {o.status === 'pending' && (
                <>
                  <button className="btn-text" onClick={() => act(o, 'cancel')}>取消订单</button>
                  <button className="btn btn-sm btn-accent" onClick={() => act(o, 'pay')}>模拟支付</button>
                </>
              )}
              {o.status === 'paid' && <span style={{ fontSize: 12, color: 'var(--muted)' }}>已支付，等待发货（练习项目不含物流）</span>}
              {o.status === 'cancelled' && <span style={{ fontSize: 12, color: 'var(--muted)' }}>库存已退回</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
