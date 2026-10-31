# 半山 BANSHAN · 数据库设计

> 练习项目要求先设计表结构再写代码。本项目把文档里的 Blog / 问答 / 商城 三个示例
> 合并进同一套数据库，共用 `users` 作为账号体系，金额统一以「分」为整数存储。

## 一、设计原则

1. **先想清楚关系，再想字段**：一个用户对多篇文章、多个提问；一个问题对多个回答；一个订单对多个订单明细。
2. **金额不用浮点**：`price` / `total_price` 全部是整数（单位：分），避免 `0.1 + 0.2` 的精度问题。
3. **订单保存快照**：下单时把商品名、单价、收货地址复制进订单表，商品改价或地址被删都不影响历史订单。
4. **能用唯一索引兜住的不靠代码**：点赞记录用 `UNIQUE(user_id, target_type, target_id)` 防重复，购物车用 `UNIQUE(user_id, product_id)` 防同一商品两行。
5. **多表联动必须走事务**：下单、点赞计数、采纳答案、地址默认位切换，全部包在 `BEGIN / COMMIT / ROLLBACK` 里。

## 二、表清单（11 张）

| # | 表名 | 作用 | 关键约束 |
| --- | --- | --- | --- |
| 1 | `users` | 账号、积分、头像色相 | `username` / `email` 唯一 |
| 2 | `categories` | 手记分类 | `slug` 唯一 |
| 3 | `posts` | 手记（Markdown 长文） | 外键 `author_id`、`category_id` |
| 4 | `questions` | 提问 | `is_solved`、`answers_count` 冗余计数 |
| 5 | `answers` | 回答 | 外键 `question_id` |
| 6 | `votes` | 点赞明细 | `UNIQUE(user_id,target_type,target_id)` |
| 7 | `products` | 商品 | `stock` 非负、`is_active` 软删除 |
| 8 | `cart_items` | 购物车 | `UNIQUE(user_id,product_id)` |
| 9 | `addresses` | 收货地址 | `is_default` 单默认 |
| 10 | `orders` | 订单 | `order_no` 唯一、`status` CHECK 约束 |
| 11 | `order_items` | 订单明细（含快照） | 外键 `order_id` |

## 三、核心表字段

### users
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INTEGER PK | 自增 |
| username | TEXT | 3-20 字符，唯一 |
| email | TEXT | 唯一，登录可用邮箱 |
| password | TEXT | **bcrypt 哈希**，不存明文 |
| bio | TEXT | 个人简介，≤120 字 |
| avatar_hue | INTEGER | 0-360，前端据此生成渐变头像，省掉图片上传 |
| points | INTEGER | 积分：新人 100，提问 -5，回答 +10，被采纳 +30 |
| created_at | TEXT | `datetime('now','localtime')` |

### posts
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id / title / summary | | 标题 2-80 字，摘要留空则自动从正文截取 |
| content | TEXT | Markdown 源码，10-40000 字 |
| cover_hue | INTEGER | 封面色相，前端用 CSS 渐变生成封面（不依赖图片文件） |
| category_id | INTEGER FK | 可为空（未分类） |
| tags | TEXT | JSON 数组字符串，如 `["手作","山居"]` |
| author_id | INTEGER FK | 关联 users，删除用户级联删除文章 |
| views / likes | INTEGER | 阅读量、喜欢数 |

> **标签为什么用 JSON 而不是关联表？** 本项目数据量在千级，按标签检索用
> `tags LIKE '%"手作"%'`（带引号避免 `手` 误匹配 `手工`）足够；真需要标签重命名、
> 合并或统计时再拆 `tags` + `post_tags` 两张表。这是文档里提到的取舍。

### questions / answers
| 字段 | 说明 |
| --- | --- |
| questions.votes | 点赞数，与 `votes` 表同步维护 |
| questions.answers_count | 回答数冗余字段，避免列表页每行 COUNT 子查询 |
| questions.is_solved | 是否已采纳答案，0/1 |
| answers.is_accepted | 是否被采纳，一题最多一条 |

### products / cart_items
| 字段 | 说明 |
| --- | --- |
| products.price | 单位**分**，如 16800 = ¥168 |
| products.stock | 库存，下单时用条件更新防超卖 |
| cart_items.quantity | 1-99，且不得超过库存 |

### orders / order_items
| 字段 | 说明 |
| --- | --- |
| order_no | `BS` + 年月日时分秒 + 4 位随机数，唯一 |
| status | `pending` / `paid` / `shipped` / `completed` / `cancelled`，CHECK 约束 |
| receiver / address_text | **下单时的地址快照** |
| order_items.name / price / cover_hue | **下单时的商品快照** |

## 四、关键 SQL

### 1. 防超卖：条件更新 + 检查影响行数
```sql
UPDATE products SET stock = stock - ?, sales = sales + ?
WHERE id = ? AND stock >= ?;
-- changes === 0 → 说明被抢光了，抛错回滚整个订单
```
不用 `SELECT stock` 再 `UPDATE stock = 值`，因为两次查询之间可能被别的请求改掉。

### 2. 点赞去重
```sql
SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?;
-- 有 → DELETE + votes-1；无 → INSERT + votes+1，两步在同一事务
```

### 3. 按标签聚合（需要时）
```sql
SELECT value AS tag, COUNT(*) AS n
FROM posts, json_each(posts.tags)
GROUP BY value ORDER BY n DESC;
```

### 4. 列表分页
```sql
SELECT ... FROM posts ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?;
-- 同时用 COUNT(*) 取总数，前端据此渲染页码
```

## 五、索引

```sql
idx_posts_created      (posts.created_at DESC)      -- 首页/列表默认排序
idx_posts_category     (posts.category_id)          -- 分类筛选
idx_questions_created  (questions.created_at DESC)
idx_answers_question   (answers.question_id)        -- 详情页取回答
idx_orders_user        (orders.user_id, created_at DESC)
idx_order_items_order  (order_items.order_id)
```

---

## 六、内容扩充后的变更（v2）

为了把「半成品」补成可演示的产品，在原有 11 张表基础上做了这些调整：

### 新增：`reviews`（商品评价）

| 字段 | 说明 |
| --- | --- |
| product_id | 外键，删除商品级联删除评价 |
| author / avatar_hue | 评价人昵称与头像色相（演示数据不强制关联账号） |
| rating | 1-5 星，参与商品平均分 |
| content | 评价正文 |

商品表上冗余 `rating` 与 `review_count`，列表页不必每行聚合：

```sql
SELECT round(avg(rating), 1), COUNT(*) FROM reviews WHERE product_id = ?;
```

### 字段扩充

| 表 | 新增字段 | 用途 |
| --- | --- | --- |
| `posts` | `cover_url` | 文章封面图（`/images/xxx.jpg`） |
| `posts` | `read_minutes` | 预计阅读时长，列表页展示 |
| `products` | `subtitle` | 一句话卖点 |
| `products` | `images` | JSON 数组，详情页相册 |
| `products` | `material` / `spec` / `origin` / `maker` | 规格表 |
| `products` | `rating` / `review_count` | 冗余评分，避免列表 N+1 |
| `order_items` | `image` | 下单时的商品图快照 |

### 为什么订单项也要存图片

和 `name` / `price` 一样，商品图属于**下单瞬间的事实**。商品下架或换图之后，
历史订单仍应显示当时的那个东西，否则用户会以为买错了。

图片全部是本地相对路径（`/images/prod-mug-orange.jpg`），前端取不到时回退到
`cover_hue` 生成的渐变封面，所以即使素材缺失也不会出现破图。
