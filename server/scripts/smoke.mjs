// 后端接口冒烟测试：覆盖认证 / 文章 / 问答 / 商城主链路
const BASE = process.env.BASE || 'http://localhost:3001';
let token = '';
let pass = 0, fail = 0;

async function call(method, path, body, auth = true) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}

const run = async () => {
  let r = await call('GET', '/api/stats', null, false);
  check('站点统计', r.json.code === 0 && r.json.data.posts > 0, JSON.stringify(r.json).slice(0, 120));

  r = await call('POST', '/api/auth/login', { username: 'demo', password: 'demo123456' }, false);
  check('登录返回 token', !!r.json.data?.token);
  token = r.json.data.token;

  r = await call('GET', '/api/auth/me');
  check('获取当前用户', r.json.data?.username === 'demo');

  r = await call('POST', '/api/auth/register', { username: '测', email: 'bad', password: '1' }, false);
  check('注册参数校验（400）', r.status === 400, `status=${r.status}`);

  r = await call('GET', '/api/posts?pageSize=3&keyword=陶');
  check('文章搜索', r.json.data.list.length > 0);

  r = await call('POST', '/api/posts', { title: '接口自测文章', content: '这是一篇用于自动化测试的文章正文内容。', tags: ['测试'], category_id: 2 });
  check('创建文章（201）', r.status === 201);
  const postId = r.json.data?.id;

  r = await call('PUT', `/api/posts/${postId}`, { title: '接口自测文章（已改）', content: '这是一篇用于自动化测试的文章正文内容，已更新。' });
  check('更新文章', r.json.data?.title.includes('已改'));

  r = await call('DELETE', `/api/posts/${postId}`);
  check('删除文章', r.json.code === 0);

  r = await call('GET', '/api/questions?sort=hot');
  check('问题列表（热门排序）', r.json.data.list.length > 0);
  const q = r.json.data.list[0];

  r = await call('GET', `/api/questions/${q.id}`);
  check('问题详情含回答', Array.isArray(r.json.data.answers));

  r = await call('POST', '/api/votes', { target_type: 'question', target_id: q.id });
  const firstVote = r.json.data?.voted;
  r = await call('POST', '/api/votes', { target_type: 'question', target_id: q.id });
  check('点赞可切换（防重复）', firstVote !== r.json.data?.voted);

  r = await call('POST', '/api/questions', { title: '自动化测试提问标题', content: '这是用于测试的问题描述内容，需要足够的长度。', tags: ['测试'] });
  check('提问（扣积分）', r.status === 201, JSON.stringify(r.json).slice(0, 100));
  const newQ = r.json.data?.id;

  r = await call('POST', `/api/questions/${newQ}/answers`, { content: '这是自动化测试提交的回答内容。' });
  check('回答（加分）', r.status === 201);
  const ansId = r.json.data?.id;

  r = await call('POST', `/api/questions/${newQ}/accept`, { answer_id: ansId });
  check('采纳答案', r.json.code === 0);

  r = await call('GET', '/api/products?pageSize=4');
  check('商品列表', r.json.data.list.length === 4);
  const product = r.json.data.list[0];

  r = await call('POST', '/api/cart', { product_id: product.id, quantity: 2 });
  check('加入购物车', r.json.data?.totalCount >= 2);

  r = await call('POST', '/api/cart', { product_id: product.id, quantity: 999 });
  check('超库存拦截（400）', r.status === 400);

  r = await call('GET', '/api/cart');
  const cartTotal = r.json.data.totalPrice;
  const cartId = r.json.data.list[0].id;

  r = await call('PUT', `/api/cart/${cartId}`, { quantity: 1 });
  check('修改购物车数量', r.json.data.list[0].quantity === 1);

  r = await call('GET', '/api/addresses');
  check('地址列表', r.json.data.length > 0);
  const addrId = r.json.data[0].id;

  r = await call('POST', '/api/orders', { address_id: addrId });
  check('创建订单（事务）', r.status === 201 && r.json.data.items.length > 0);
  const orderId = r.json.data?.id;

  r = await call('GET', '/api/cart');
  check('下单后购物车已清空', r.json.data.list.length === 0, `count=${r.json.data.list.length}`);

  r = await call('PUT', `/api/orders/${orderId}/pay`);
  check('模拟支付', r.json.data?.status === 'paid');

  r = await call('PUT', `/api/orders/${orderId}/cancel`);
  check('已支付订单不可取消（400）', r.status === 400);

  r = await call('GET', '/api/orders');
  check('订单列表', r.json.data.length > 0);

  r = await call('GET', '/api/orders/999999');
  check('不存在订单（404）', r.status === 404);

  r = await call('GET', '/api/posts', null, false);
  const noAuth = r.status;
  r = await call('POST', '/api/posts', { title: 'x', content: 'y' }, false);
  check('未登录写文章（401）', r.status === 401, `list=${noAuth} post=${r.status}`);

  console.log(`\n结果：通过 ${pass} 项，失败 ${fail} 项`);
  process.exit(fail ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
