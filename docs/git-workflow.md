# 版本管理与协作约定

项目从「一个能跑的本地工程」变成「可协作的仓库」，靠的不是记住几条命令，而是几条说清楚了的约定。

## 一、分支模型

| 分支 | 用途 | 生命周期 |
| --- | --- | --- |
| `main` | 随时可运行的主线，只有合并进来的提交 | 长期 |
| `feature/<主题>` | 单个功能或文档改动，例：`feature/git-workflow` | 合并后保留 |
| `fix/<主题>` | 缺陷修复 | 合并后删除 |
| `release/<版本>` | 发版前的收尾（版本号、变更记录） | 打 tag 后删除 |

原则只有一条：**`main` 上永远是可运行的状态**。所有改动先落到分支，跑过 `npm run build` 与 `smoke.mjs` 再合回来。

## 二、提交信息

采用 Conventional Commits，前缀决定这次改动在 log 里的分组：

| 前缀 | 含义 | 本项目示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat(server): Express + SQLite 接口层` |
| `fix` | 修缺陷 | `fix(web): 修正问答列表 0 值被渲染成文本` |
| `docs` | 文档 | `docs: 补充版本管理与协作约定` |
| `chore` | 杂务（依赖、忽略规则、换行符） | `chore: 统一换行符策略` |
| `build` | 构建与脚本 | `build: 加入接口自测与截图脚本` |

标题一行说清「做了什么」，正文再写「为什么」。反面教材是 `update`、`fix bug`——一周后自己也看不懂。

## 三、一条完整的改动路径

```bash
git pull --rebase origin main      # 1. 先同步，避免把自己的提交建在旧地基上
git switch -c feature/order-filter # 2. 开分支
#   ... 改代码 ...
git add server/src/routes/shop.js  # 3. 暂存（只加这次改动涉及的文件）
git commit -m "feat(shop): 订单列表支持按状态筛选"
git push -u origin feature/order-filter   # 4. 首次推送建立跟踪关系
#    ... 合并到 main ...
git switch main && git pull --rebase
git merge --no-ff feature/order-filter
git push
```

`--no-ff` 是有意为之：即使能快进也保留一个合并节点，让「这个功能是从哪条分支、哪几个提交合进来的」在 `git log --graph` 里看得见。

## 四、冲突不是事故

冲突意味着两个人改了同一处，git 不敢替你做决定。处理顺序：

1. `git status` 看清哪些文件处于 `both modified`；
2. 打开文件，在 `<<<<<<<` / `=======` / `>>>>>>>` 之间留下正确的那一版（IDE 的冲突视图可以直接点「采用当前/传入的更改」）；
3. `git add <文件>` 标记已解决；
4. merge 用 `git commit` 收尾，rebase 用 `git rebase --continue`。

**先跑一遍构建再提交**——冲突解错通常不报语法错，但会悄悄丢掉别人的改动。

## 五、Pull 还是 Pull --Rebase

| | `git pull`（merge） | `git pull --rebase` |
| --- | --- | --- |
| 历史形态 | 每同步一次多一个合并节点 | 一条直线 |
| 适用 | 公共分支合并、需要保留分叉证据 | 个人分支追主线、提交还没推给别人 |
| 风险 | 历史线容易缠成一团 | 会改写本地提交哈希，**别对已推送的公共分支用** |

本项目的默认选择是 `--rebase`：本地提交还没推出去，改写没有成本，历史更干净。

## 六、什么东西不该进仓库

`.gitignore` 里排除的是「能从仓库里的东西重新生成」的产物：

- `node_modules/`、`web/dist/`——`npm install`、`npm run build` 就有；
- `server/data/*.db`——`npm run seed` 生成，提交数据库等于每次跑测试都产生假 diff；
- `.env`——里面有 `JWT_SECRET`，密钥不进版本库是底线；
- `screenshots/`——由 `scripts/shots.mjs` 一键重拍，32 MB 的 PNG 放进 git 只会拖慢每一次 clone。

判断标准很朴素：**删掉它，别人能不能一条命令重新得到？** 能，就别提交。
