# 半山 BANSHAN

一个把「个人博客 + 问答社区 + 在线商城」合成一体的全栈练习项目：
14 篇长文、11 个提问 / 24 条回答、25 件商品 / 99 条买家评价，全部带真实图片。
前端 React + TypeScript + Vite，后端 Node.js + Express，数据库 SQLite（Node 22 内置 `node:sqlite`），
认证用 JWT，密码 bcrypt 加密。

> 三个业务域共用一套账号、积分与设计语言：写手记 → 提问回答 → 逛市集，构成一个完整闭环。

---

## 一、快速开始

```bash
# 1. 后端（首次会自动建表；再跑一次 seed 写入演示数据）
cd server
npm install
npm run seed        # 需要重置数据时：FORCE=1 npm run seed
npm start           # http://localhost:3001

# 2. 前端（开发模式，带热更新，代理到 3001）
cd web
npm install
npm run dev         # http://localhost:5173

# 3. 生产模式（构建后由 Express 直接托管，单端口 3001）
cd web && npm run build
```

演示账号：**demo / demo123456**（另有 林深 / 周愚 / 沈白 / 阿禾 / 小满 / 老陈 / 阿吉，共 8 个账号，密码相同）

环境变量见 `server/.env.example`：

```
PORT=3001
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d
```

> 说明：课程文档用 MySQL 演示。本项目改用 SQLite，是因为零安装、单文件、本地即跑，
> 而事务、外键、索引、条件更新这些**关键知识点完全一致**；
> 换回 MySQL 只需替换 `src/lib/db.js` 里的连接与 `?` 占位符访问层。

---

## 二、目录结构

```
fullstack-app/
├── server/                 后端
│   ├── src/
│   │   ├── index.js        Express 入口：中间件、路由挂载、静态托管、错误处理
│   │   ├── schema.sql      12 张表的建表语句 + 索引
│   │   ├── seed.js         建库脚本（生成用户、手记、问答、商品、评价）
│   │   ├── data/           内容库：catalog.js（25 件商品）/ writing.js（14 篇）/ qa.js（11 个问题）
│   │   ├── lib/
│   │   │   ├── db.js       node:sqlite 封装：get / all / run / tx
│   │   │   └── http.js     统一响应、ApiError、参数校验
│   │   ├── middleware/auth.js   JWT 签发、必选/可选鉴权
│   │   └── routes/
│   │       ├── auth.js     注册、登录、个人资料
│   │       ├── posts.js    手记 CRUD、分类、点赞
│   │       ├── questions.js 提问、回答、点赞、采纳、积分
│   │       └── shop.js     商品、购物车、地址、订单
│   ├── scripts/smoke.mjs   接口冒烟测试（26 项断言）
│   └── data/banshan.db     SQLite 数据文件（运行后生成）
├── web/                    前端
│   └── src/
│       ├── styles.css      设计系统（宣纸底 / 墨色字 / 朱砂点缀）
│       ├── lib/            api.ts（拦截器）、auth.tsx（登录态）、utils.ts
│       ├── components/     Layout、ui（封面/头像/分页）、Markdown、Toast
│       └── pages/          16 个页面
├── docs/
│   ├── PRD.md              需求文档
│   ├── database.md         数据库设计
│   └── 截图说明.md          每张截图对应的功能点
├── web/public/images/      39 张配图（商品图 + 场景图，本地化，离线可跑）
├── screenshots/            16 张运行截图
└── scripts/shots.mjs       Puppeteer 自动截图脚本（用本机 Edge）
```

---

## 三、实现了什么

**账号**：注册（参数校验 / 唯一性 / bcrypt）、登录（用户名或邮箱）、JWT 7 天、个人中心、
受保护路由、401 自动登出。

**手记**：Markdown 写作 + 实时预览、分类与标签、封面主色、分页、关键词搜索、
按时间/热度排序、浏览量、点赞、仅作者可编辑删除。

**问山**：四种排序（最新/热门/待解决/零回答）、标签筛选、点赞（防重复、可取消）、
采纳（仅提问者、仅一次）、积分系统（提问 -5 / 回答 +10 / 采纳 +30 / 被赞 +5、+10）。

**市集**：25 件商品 / 5 个分类、商品详情（多图相册、规格表、评分分布、买家评价）、
购物车（累加、库存上限）、地址管理（默认位互斥）、下单事务（校验库存 → 条件扣减 → 写快照 → 清购物车）、
订单状态流转、取消退库存。

**工程**：统一响应格式与错误中间件、集中式参数校验、事务封装、26 项接口冒烟测试、
一键自动截图。

---

## 四、几个值得说的实现细节

### 1. 防超卖用「条件更新」而不是「先查后改」

```js
const dec = run(
  'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ? AND stock >= ?',
  [qty, qty, productId, qty]
);
if (!dec.changes) throw badRequest('刚被抢光了');   // 影响行数为 0 → 回滚
```

`WHERE stock >= ?` 把「判断」和「扣减」压成一条原子语句，两个人同时下单也不会超卖。

### 2. 订单保存快照

`order_items` 存下单时的 `name / price / cover_hue`，`orders` 存 `receiver / address_text`。
商品改价、地址删除都不会让历史订单「变样」。

### 3. 点赞的计数一致性

`votes` 表记明细（唯一索引防重复），`questions.votes` / `answers.votes` 存计数。
写入与计数在同一事务里完成，取消点赞时也同步回收作者积分（用 `MAX(points - ?, 0)` 兜底）。

### 4. 图片本地化 + 无图兜底

所有配图下载到 `web/public/images/`，页面上统一做 `object-fit: cover` + 轻微暖调滤镜，
让来源不同的照片看起来像同一套素材。数据库里图片存相对路径，取不到时回退到
`cover_hue` 生成的 CSS 渐变封面，保证任何情况下不出现破图。

### 5. 三个模块的识别度

每个模块一个主色（朱砂 / 松绿 / 赭石），通过 `.theme-notes / .theme-qa / .theme-shop`
在页面根节点覆盖 `--accent`；导航高亮、筛选按钮、分页、模块标题线、按钮全部跟着变。
除了颜色，版式密度也不同：手记松（大图三列）、问答紧（列表 + 双栏计数）、市集更密（四列网格）。

### 6. 前端 API 层拦截 401

`lib/api.ts` 统一注入 `Authorization`，遇到 401 清 token 并广播 `banshan:logout`，
`AuthProvider` 监听后清空用户态，`Protected` 组件随即跳转登录页 —— 无需每个页面单独处理。

---

## 五、接口自测

```bash
cd server
npm start                    # 另开一个终端
node scripts/smoke.mjs
```

覆盖：统计、登录、注册校验、文章增删改查与搜索、点赞切换、提问扣分、回答加分、采纳、
商品列表、加购、超库存拦截、改数量、下单、购物车清空、模拟支付、状态校验、401 拦截。
当前结果：**26 项全部通过**（脚本中的数据会写入演示库，跑完可 `FORCE=1 npm run seed` 复位）。

## 六、重新生成截图

```bash
npm install                  # 根目录，已含 puppeteer-core
node scripts/shots.mjs       # 用本机 Edge 无头模式，输出到 screenshots/
```
