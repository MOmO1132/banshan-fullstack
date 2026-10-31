import { Router } from 'express';
import { all, get, run, tx } from '../lib/db.js';
import {
  asyncHandler, ok, requireFields, checkString, checkInt,
  badRequest, forbidden, notFound,
} from '../lib/http.js';
import { auth, maybeAuth } from '../middleware/auth.js';
import { safeJson } from '../lib/http.js';

const router = Router();

const shapeProduct = (p) => p && { ...p, images: safeJson(p.images) };

/* ---------------- 商品 ---------------- */

router.get('/products', asyncHandler(async (req, res) => {
  const page = Math.max(1, checkInt(req.query.page ?? 1, '页码', { min: 1 }));
  const pageSize = Math.min(24, checkInt(req.query.pageSize ?? 8, '每页条数', { min: 1, max: 24 }));
  const { category, keyword, sort = 'latest' } = req.query;

  const where = ['p.is_active = 1'];
  const params = [];
  if (category && category !== 'all') { where.push('p.category = ?'); params.push(category); }
  if (keyword) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderMap = {
    latest: 'ORDER BY p.created_at DESC',
    priceAsc: 'ORDER BY p.price ASC',
    priceDesc: 'ORDER BY p.price DESC',
    sales: 'ORDER BY p.sales DESC',
  };

  const total = get(`SELECT COUNT(*) AS n FROM products p ${whereSql}`, params).n;
  const list = all(`SELECT p.* FROM products p ${whereSql} ${orderMap[sort] || orderMap.latest} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]).map(shapeProduct);
  const categories = all('SELECT category AS name, COUNT(*) AS count FROM products WHERE is_active = 1 GROUP BY category ORDER BY count DESC');
  ok(res, { list, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), categories });
}));

router.get('/products/:id', asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '商品 ID', { min: 1 });
  const product = get('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
  if (!product) throw notFound('商品已下架');
  // 同类推荐：同分类优先，不足 3 件时用热销商品补齐，避免推荐区太空
  let related = all('SELECT * FROM products WHERE category = ? AND id <> ? AND is_active = 1 ORDER BY sales DESC LIMIT 3', [product.category, id]);
  if (related.length < 3) {
    const exclude = [id, ...related.map((r) => r.id)];
    related = related.concat(all(
      `SELECT * FROM products WHERE id NOT IN (${exclude.map(() => '?').join(',')}) AND is_active = 1
       ORDER BY sales DESC LIMIT ?`,
      [...exclude, 3 - related.length]
    ));
  }
  const reviews = all('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 8', [id]);
  const dist = all('SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating', [id]);
  ok(res, { ...shapeProduct(product), reviews, rating_dist: dist, related: related.map(shapeProduct) });
}));

/* ---------------- 购物车 ---------------- */

const CART_SELECT = `
  SELECT c.id, c.quantity, c.created_at,
         p.id AS product_id, p.name, p.price, p.stock, p.cover_hue, p.category, p.images
  FROM cart_items c JOIN products p ON p.id = c.product_id
  WHERE c.user_id = ?
  ORDER BY c.id DESC
`;
const cartPayload = (uid) => {
  const list = all(CART_SELECT, [uid]).map((i) => ({ ...i, images: safeJson(i.images) }));
  const totalPrice = list.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCount = list.reduce((s, i) => s + i.quantity, 0);
  return { list, totalPrice, totalCount };
};

router.get('/cart', auth, (req, res) => ok(res, cartPayload(req.user.id)));

// 加入购物车：同商品累加；校验库存上限
router.post('/cart', auth, asyncHandler(async (req, res) => {
  const product_id = checkInt(req.body.product_id, '商品 ID', { min: 1 });
  const quantity = checkInt(req.body.quantity ?? 1, '数量', { min: 1, max: 99 });
  const product = get('SELECT * FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!product) throw notFound('商品不存在或已下架');

  const existing = get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
  const next = (existing?.quantity || 0) + quantity;
  if (next > product.stock) throw badRequest(`库存只剩 ${product.stock} 件`);

  if (existing) run('UPDATE cart_items SET quantity = ? WHERE id = ?', [next, existing.id]);
  else run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity]);

  ok(res, cartPayload(req.user.id), '已加入购物车');
}));

router.put('/cart/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '购物车项 ID', { min: 1 });
  const quantity = checkInt(req.body.quantity, '数量', { min: 1, max: 99 });
  const item = get('SELECT c.*, p.stock FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.id = ? AND c.user_id = ?', [id, req.user.id]);
  if (!item) throw notFound('购物车里没有这件商品');
  if (quantity > item.stock) throw badRequest(`库存只剩 ${item.stock} 件`);
  run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
  ok(res, cartPayload(req.user.id), '数量已更新');
}));

router.delete('/cart/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '购物车项 ID', { min: 1 });
  const info = run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!info.changes) throw notFound('购物车里没有这件商品');
  ok(res, cartPayload(req.user.id), '已移出购物车');
}));

/* ---------------- 地址 ---------------- */

function readAddress(body) {
  requireFields(body, ['name', 'phone', 'province', 'city', 'district', 'detail']);
  const name = checkString(body.name, '收货人', { min: 2, max: 20 });
  const phone = checkString(String(body.phone), '手机号', { min: 6, max: 20 });
  if (!/^[\d\-+ ]{6,20}$/.test(phone)) throw badRequest('手机号格式不正确');
  return {
    name, phone,
    province: checkString(body.province, '省份', { min: 1, max: 20 }),
    city: checkString(body.city, '城市', { min: 1, max: 20 }),
    district: checkString(body.district, '区县', { min: 1, max: 20 }),
    detail: checkString(body.detail, '详细地址', { min: 3, max: 100 }),
    is_default: body.is_default ? 1 : 0,
  };
}

router.get('/addresses', auth, (req, res) => {
  ok(res, all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]));
});

router.post('/addresses', auth, asyncHandler(async (req, res) => {
  const a = readAddress(req.body);
  const id = tx(() => {
    const count = get('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?', [req.user.id]).n;
    const isDefault = a.is_default || count === 0 ? 1 : 0; // 第一条地址自动设为默认
    if (isDefault) run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    const info = run(
      `INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, a.name, a.phone, a.province, a.city, a.district, a.detail, isDefault]
    );
    return Number(info.lastInsertRowid);
  });
  ok(res, get('SELECT * FROM addresses WHERE id = ?', [id]), '地址已保存', 201);
}));

router.put('/addresses/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '地址 ID', { min: 1 });
  if (!get('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id])) throw notFound('地址不存在');
  const a = readAddress(req.body);
  tx(() => {
    if (a.is_default) run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    run(`UPDATE addresses SET name=?, phone=?, province=?, city=?, district=?, detail=?, is_default=? WHERE id=?`,
      [a.name, a.phone, a.province, a.city, a.district, a.detail, a.is_default, id]);
  });
  ok(res, get('SELECT * FROM addresses WHERE id = ?', [id]), '地址已更新');
}));

router.delete('/addresses/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '地址 ID', { min: 1 });
  const addr = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!addr) throw notFound('地址不存在');
  tx(() => {
    run('DELETE FROM addresses WHERE id = ?', [id]);
    if (addr.is_default) {
      const first = get('SELECT id FROM addresses WHERE user_id = ? ORDER BY id ASC LIMIT 1', [req.user.id]);
      if (first) run('UPDATE addresses SET is_default = 1 WHERE id = ?', [first.id]);
    }
  });
  ok(res, { id }, '地址已删除');
}));

/* ---------------- 订单 ---------------- */

const ORDER_NO = () => {
  const d = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `BS${stamp}${Math.floor(Math.random() * 9000 + 1000)}`;
};

const orderWithItems = (order) => ({
  ...order,
  items: all('SELECT * FROM order_items WHERE order_id = ?', [order.id]),
});

// 创建订单：事务内校验库存 → 扣库存（条件更新防超卖）→ 写订单与明细 → 清购物车
router.post('/orders', auth, asyncHandler(async (req, res) => {
  const address_id = checkInt(req.body.address_id, '收货地址', { min: 1 });
  const address = get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [address_id, req.user.id]);
  if (!address) throw badRequest('请选择有效的收货地址');

  let cartIds = req.body.cart_item_ids;
  if (cartIds && !Array.isArray(cartIds)) throw badRequest('cart_item_ids 必须是数组');

  const uid = req.user.id;
  const orderId = tx(() => {
    const cart = cartIds && cartIds.length
      ? all(`SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.cover_hue, p.images
             FROM cart_items c JOIN products p ON p.id = c.product_id
             WHERE c.user_id = ? AND c.id IN (${cartIds.map(() => '?').join(',')})`, [uid, ...cartIds.map(Number)])
      : all(`SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.cover_hue, p.images
             FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.user_id = ?`, [uid]);

    if (!cart.length) throw badRequest('购物车是空的，先去挑几件东西吧');
    for (const item of cart) {
      if (item.quantity > item.stock) throw badRequest(`「${item.name}」库存不足，仅剩 ${item.stock} 件`);
    }

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderNo = ORDER_NO();
    const info = run(
      `INSERT INTO orders (order_no, user_id, address_id, receiver, address_text, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderNo, uid, address_id, `${address.name} ${address.phone}`,
       `${address.province}${address.city}${address.district}${address.detail}`, total]
    );
    const oid = Number(info.lastInsertRowid);

    for (const item of cart) {
      // 条件更新 + 检查影响行数 = 乐观并发控制，杜绝超卖
      const dec = run('UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ? AND stock >= ?',
        [item.quantity, item.quantity, item.product_id, item.quantity]);
      if (!dec.changes) throw badRequest(`「${item.name}」刚被抢光了，请调整数量`);
      run('INSERT INTO order_items (order_id, product_id, name, image, cover_hue, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [oid, item.product_id, item.name, safeJson(item.images)[0] || '', item.cover_hue, item.price, item.quantity]);
      run('DELETE FROM cart_items WHERE id = ?', [item.id]);
    }
    return oid;
  });

  ok(res, orderWithItems(get('SELECT * FROM orders WHERE id = ?', [orderId])), '下单成功', 201);
}));

router.get('/orders', auth, asyncHandler(async (req, res) => {
  const status = req.query.status;
  const params = [req.user.id];
  let sql = 'SELECT * FROM orders WHERE user_id = ?';
  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC, id DESC';
  ok(res, all(sql, params).map(orderWithItems));
}));

router.get('/orders/:id', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '订单 ID', { min: 1 });
  const order = get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw notFound('订单不存在');
  if (order.user_id !== req.user.id) throw forbidden('无权查看他人的订单');
  ok(res, orderWithItems(order));
}));

// 取消订单：仅待支付可取消，恢复库存
router.put('/orders/:id/cancel', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '订单 ID', { min: 1 });
  const order = get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw notFound('订单不存在');
  if (order.user_id !== req.user.id) throw forbidden('无权操作他人订单');
  if (order.status !== 'pending') throw badRequest('只有待支付的订单可以取消');

  tx(() => {
    for (const item of all('SELECT * FROM order_items WHERE order_id = ?', [id])) {
      run('UPDATE products SET stock = stock + ?, sales = MAX(sales - ?, 0) WHERE id = ?', [item.quantity, item.quantity, item.product_id]);
    }
    run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now','localtime') WHERE id = ?", [id]);
  });
  ok(res, orderWithItems(get('SELECT * FROM orders WHERE id = ?', [id])), '订单已取消，库存已退回');
}));

// 模拟支付（课程要求不做真实支付，仅推进状态）
router.put('/orders/:id/pay', auth, asyncHandler(async (req, res) => {
  const id = checkInt(req.params.id, '订单 ID', { min: 1 });
  const order = get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw notFound('订单不存在');
  if (order.user_id !== req.user.id) throw forbidden('无权操作他人订单');
  if (order.status !== 'pending') throw badRequest('该订单当前状态不可支付');
  run("UPDATE orders SET status = 'paid', updated_at = datetime('now','localtime') WHERE id = ?", [id]);
  ok(res, orderWithItems(get('SELECT * FROM orders WHERE id = ?', [id])), '支付成功（模拟）');
}));

export default router;
