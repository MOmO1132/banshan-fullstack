// 逐页截图（Edge 无头）。截图前先滚一遍整页，保证懒加载图片全部渲染。
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://localhost:3001';
const OUT = path.resolve(import.meta.dirname, '../screenshots');
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function setValue(page, selector, value) {
  await page.$eval(selector, (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('  [页面报错]', m.text().slice(0, 140)); });

/** 滚动整页触发懒加载，再回顶部 */
async function settle() {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await wait(900);
}

async function shot(name, { full = true } = {}) {
  await settle();
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log('  截图 →', name + '.png');
}

const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'networkidle2' }); await wait(600); };

// ---------- 未登录 ----------
await go('/');
await shot('01-首页');

await go('/notes');
await shot('02-手记列表');

await go('/notes/2');
await shot('03-手记详情');

await go('/qa');
await shot('04-问答列表');

await go('/qa/1');
await shot('05-问题详情');

await go('/shop');
await shot('06-市集');

await go('/shop/1');
await shot('07-商品详情');

await go('/login');
await shot('08-登录', { full: false });

await go('/register');
await shot('09-注册', { full: false });

// ---------- 登录 ----------
await go('/login');
await page.type('input[autocomplete="username"]', 'demo');
await page.type('input[type="password"]', 'demo123456');
await page.click('button[type="submit"]');
await wait(1800);
await shot('10-登录后首页', { full: false });

// 写作页
await go('/write');
await setValue(page, '.writer-title', '秋分之后，我把工作台搬到了窗边');
await setValue(page, 'input[placeholder="手作 山居 记录"]', '手作 光线 记录');
await setValue(page, '.md-input', `## 起因

拉坯的时候总觉得泥"发闷"，师傅来看了一眼说：不是泥的问题，是光。

## 过程

- 把工作台从背光的墙角挪到朝东的窗边；
- 上午八点到十一点不再开灯，只借自然光看坯体的厚薄；
- 记录每天同一只杯子在不同光线下的手感。

> 泥不会说话，但它会告诉你哪里薄了。

## 结果

一周后，同一批泥拉出来的杯子，壁厚差从 1.8mm 收到了 0.6mm。

| 日期 | 壁厚极差 |
| --- | --- |
| 挪桌前 | 1.8mm |
| 第三天 | 1.1mm |
| 第七天 | 0.6mm |

## 一点想法

工具没变、泥没变，变的只是**你怎么看它**。`);
await page.setViewport({ width: 1440, height: 1180, deviceScaleFactor: 2 });
await shot('11-写作编辑器');
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

// 加购两件
await go('/shop/1');
await page.evaluate(() => [...document.querySelectorAll('button.btn-accent')].pop()?.click());
await wait(1000);
await go('/shop/21');
await page.evaluate(() => {
  for (let i = 0; i < 2; i++) [...document.querySelectorAll('button.btn-accent')].pop()?.click();
});
await wait(1400);

await go('/cart');
await shot('12-购物车', { full: false });

await go('/checkout');
await shot('13-确认订单');

await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('提交订单'))?.click());
await wait(2200);
await shot('14-我的订单');

await go('/profile');
await shot('15-个人中心', { full: false });

await go('/qa/3');
await page.evaluate(() => document.querySelectorAll('.vote-btn')[0]?.click());
await wait(1500);
await shot('16-点赞交互', { full: false });

await browser.close();
console.log('\n全部截图完成 →', OUT);
