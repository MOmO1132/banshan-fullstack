// 商品目录：24 件，5 个分类，每件含参数、产地、作者与评价
export const CATEGORIES = ['器物', '纸品', '香氛', '咖啡', '木作'];

export const PRODUCTS = [
  // ============ 器物 ============
  {
    name: '柴烧粗陶马克杯', subtitle: '手拉坯 · 落灰釉 · 每只都不一样', category: '器物',
    price: 16800, stock: 24, sales: 186, hue: 22,
    images: ['prod-mug-orange.jpg', 'prod-mug-straight.jpg', 'scene-studio-2.jpg'],
    material: '本地红土 + 高岭土', spec: '口径 8.5cm / 高 9cm / 容量 320ml', origin: '景德镇 · 浮梁', maker: '林深',
    desc: '柴窑烧三天三夜，落灰自然形成釉面，杯壁有细微的橘皮纹。装咖啡、装茶、装白开水都合适，握感偏厚，暖手。',
  },
  {
    name: '直筒手捏杯', subtitle: '不修坯，留着手指的痕迹', category: '器物',
    price: 12800, stock: 31, sales: 97, hue: 30,
    images: ['prod-mug-straight.jpg', 'prod-mug-orange.jpg', 'scene-studio-1.jpg'],
    material: '中温陶土', spec: '口径 7.5cm / 高 8.5cm / 容量 240ml', origin: '景德镇 · 浮梁', maker: '林深',
    desc: '不上釉的口沿，喝水时能感觉到泥的粗粝。杯身留有手指按压的浅坑，是手捏成形才会有的痕迹。',
  },
  {
    name: '灰釉斗笠碗', subtitle: '一人食，刚刚好', category: '器物',
    price: 9800, stock: 42, sales: 213, hue: 46,
    images: ['prod-bowl-gray.jpg', 'prod-bowl-dark.jpg', 'scene-studio-3.jpg'],
    material: '高白泥 + 灰釉', spec: '口径 13cm / 高 6cm / 容量 380ml', origin: '景德镇 · 三宝', maker: '沈白',
    desc: '敞口斜壁，散热快，适合盛汤面或酸奶碗。灰釉在高温下流动，碗口会有一圈自然的深色积釉。',
  },
  {
    name: '玄色小钵', subject: '', subtitle: '盛茶点，也盛钥匙', category: '器物',
    price: 7600, stock: 18, sales: 64, hue: 210,
    images: ['prod-bowl-dark.jpg', 'prod-bowl-gray.jpg', 'scene-studio-4.jpg'],
    material: '黑陶土', spec: '口径 11cm / 高 5cm', origin: '景德镇 · 三宝', maker: '沈白',
    desc: '素烧后不再上釉，表面用蜜蜡打磨过，摸起来是温的。放在玄关装钥匙，比任何收纳盒都好看。',
  },
  {
    name: '急须壶 · 深釉', subtitle: '一壶两杯，够两个人喝一下午', category: '器物',
    price: 26800, stock: 11, sales: 38, hue: 24,
    images: ['prod-teapot-dark.jpg', 'prod-teapot-red.jpg', 'scene-studio-2.jpg'],
    material: '紫金土', spec: '容量 220ml / 含两只 40ml 小杯', origin: '宜兴 · 丁蜀', maker: '林深',
    desc: '侧把急须，出水利落不挂水。壶身深釉在光下会泛一点铁锈红，用久了会更润。',
  },
  {
    name: '红泥小壶', subtitle: '泡乌龙正好', category: '器物',
    price: 32000, stock: 7, sales: 21, hue: 8,
    images: ['prod-teapot-red.jpg', 'prod-teapot-dark.jpg', 'scene-studio-1.jpg'],
    material: '红泥', spec: '容量 160ml / 单人份', origin: '宜兴 · 丁蜀', maker: '林深',
    desc: '泥料陈腐三年，壶壁薄，聚香。第一次用之前用茶水煮一遍，之后只泡一种茶，养出来的包浆骗不了人。',
  },
  {
    name: '白瓷小花器', subtitle: '一枝就够', category: '器物',
    price: 8600, stock: 26, sales: 112, hue: 200,
    images: ['prod-vase-white.jpg', 'prod-jar-brown.jpg', 'scene-room.jpg'],
    material: '高白泥 + 透明釉', spec: '高 14cm / 口径 2.5cm', origin: '景德镇 · 浮梁', maker: '沈白',
    desc: '细口，插一枝枯枝或一朵野花都成立。素面不画，靠器形和光影说话。',
  },
  {
    name: '粗陶储物罐', subtitle: '装咖啡豆、装米、装秘密', category: '器物',
    price: 13800, stock: 22, sales: 79, hue: 34,
    images: ['prod-jar-brown.jpg', 'prod-vase-white.jpg', 'scene-studio-3.jpg'],
    material: '粗陶 + 软木盖', spec: '容量 750ml / 高 16cm', origin: '景德镇 · 浮梁', maker: '林深',
    desc: '罐口配软木盖，密封性够存一周的豆子。陶土透气，不会让豆子闷出油耗味。',
  },

  // ============ 纸品 ============
  {
    name: '手工线装笔记本', subtitle: '裸脊线装，可以完全摊平', category: '纸品',
    price: 8800, stock: 60, sales: 341, hue: 268,
    images: ['prod-notebook.jpg', 'prod-paper.jpg', 'scene-desk.jpg'],
    material: '100g 米白纸 + 棉线', spec: 'A5 / 120 页 / 横线', origin: '杭州 · 良渚', maker: '沈白',
    desc: '裸脊线装，写到最后一页也能摊平。纸偏米黄，钢笔写不洇，铅笔画素描也不起毛。',
  },
  {
    name: '节气植物明信片 · 12 张', subtitle: '一年十二个节气，一种植物', category: '纸品',
    price: 4800, stock: 120, sales: 528, hue: 148,
    images: ['prod-cards.jpg', 'prod-poster.jpg', 'scene-press.jpg'],
    material: '300g 棉纸 / riso 双色印刷', spec: '10×15cm / 12 张一套', origin: '杭州 · 良渚', maker: '沈白',
    desc: 'Riso 双色叠印，颜色会有轻微的错位和颗粒，每张都不完全一样。背面留白，够写三行字。',
  },
  {
    name: '活版印刷海报 · 山谷', subtitle: '60×40cm，手工对位', category: '纸品',
    price: 12800, stock: 15, sales: 43, hue: 28,
    images: ['prod-poster.jpg', 'prod-cards.jpg', 'scene-press.jpg'],
    material: '260g 本色纸 / 活版凸印', spec: '60×40cm / 限量 80 版', origin: '杭州 · 良渚', maker: '沈白',
    desc: '铅字排版，机器一张张压出来，纸面能摸到凸起的墨痕。装个细黑框挂在书桌旁刚好。',
  },
  {
    name: '石版压印手作卡', subtitle: '一组 6 张，随手送人', category: '纸品',
    price: 3600, stock: 88, sales: 176, hue: 210,
    images: ['prod-press.jpg', 'prod-poster.jpg', 'scene-press.jpg'],
    material: '220g 手工纸', spec: '9×13cm / 6 张 + 信封 3 个', origin: '杭州 · 良渚', maker: '沈白',
    desc: '石版压印的浅浮雕纹理，侧光下才看得清。适合写一两句就寄出去的那种话。',
  },
  {
    name: '手抄纸信笺 · 40 张', subtitle: '边缘是毛的，像刚从水里捞出来', category: '纸品',
    price: 5600, stock: 44, sales: 132, hue: 40,
    images: ['prod-paper.jpg', 'prod-notebook.jpg', 'scene-desk.jpg'],
    material: '楮皮纸', spec: 'A5 / 40 张 / 附牛皮纸袋', origin: '安徽 · 泾县', maker: '沈白',
    desc: '手工抄纸，厚薄略有差异，边缘带自然毛边。钢笔写上去会有一点点洇，那正是它的脾气。',
  },

  // ============ 香氛 ============
  {
    name: '雪松苔藓线香', subtitle: '20 支，一支烧 25 分钟', category: '香氛',
    price: 9600, stock: 45, sales: 208, hue: 128,
    images: ['prod-incense.jpg', 'prod-incense-holder.jpg', 'scene-studio-4.jpg'],
    material: '雪松木粉 + 苔藓精油', spec: '20 支 / 长约 21cm / 燃烧约 25 分钟', origin: '福建 · 莆田', maker: '阿禾',
    desc: '前调是干燥的雪松，尾调带一点潮湿的苔藓味。烟量小，书房里点一支，两小时后还有余味。',
  },
  {
    name: '艾草香束', subtitle: '端午前后割的，挂着也好看', category: '香氛',
    price: 5800, stock: 33, sales: 84, hue: 96,
    images: ['prod-incense-bundle.jpg', 'prod-incense.jpg', 'scene-nature.jpg'],
    material: '野生艾草 + 菖蒲', spec: '一束约 30g / 长 40cm', origin: '浙江 · 临安', maker: '阿禾',
    desc: '晒足七天，颜色是暗绿而不是枯黄。可以点燃驱蚊，也可以就那么挂着，等它自己慢慢变香。',
  },
  {
    name: '粗陶香插 · 含铜盘', subtitle: '开孔 2mm，适配多数线香', category: '香氛',
    price: 6800, stock: 38, sales: 121, hue: 30,
    images: ['prod-incense-holder.jpg', 'prod-bowl-dark.jpg', 'scene-studio-2.jpg'],
    material: '粗陶 + 黄铜盘', spec: '直径 9cm / 高 3cm', origin: '景德镇 · 浮梁', maker: '林深',
    desc: '铜盘可拆下来倒灰、清洗。陶体厚，香灰落上去不会烫到桌面。',
  },

  // ============ 咖啡 ============
  {
    name: '云南日晒小粒 · 200g', subtitle: '红糖、橘子、坚果尾韵', category: '咖啡',
    price: 7800, stock: 80, sales: 612, hue: 18,
    images: ['prod-beans-dark.jpg', 'prod-beans-bowl.jpg', 'scene-coffee.jpg'],
    material: '阿拉比卡 · 日晒处理', spec: '200g / 中浅烘 / 下单后 48 小时内烘焙', origin: '云南 · 保山', maker: '阿禾',
    desc: '甜感很足，酸度收敛，冷下来会冒出橘子的味道。手冲、爱乐压、法压都稳。',
  },
  {
    name: '耶加雪菲 · 200g', subtitle: '茉莉花香与柠檬酸质', category: '咖啡',
    price: 9800, stock: 56, sales: 438, hue: 44,
    images: ['prod-beans-bowl.jpg', 'prod-beans-dark.jpg', 'scene-coffee.jpg'],
    material: '阿拉比卡 · 水洗处理', spec: '200g / 浅烘 / 建议 92℃ 水温', origin: '埃塞俄比亚 · 科契尔', maker: '阿禾',
    desc: '花香在研磨时就出来了。水温别太高，粉水比 1:15，能喝到很干净的柠檬酸甜。',
  },
  {
    name: '冷萃浓缩液 · 500ml', subtitle: '冰箱常备，兑水兑奶都行', category: '咖啡',
    price: 6600, stock: 40, sales: 297, hue: 26,
    images: ['prod-latte.jpg', 'prod-cups.jpg', 'scene-coffee.jpg'],
    material: '拼配豆 · 冷萃 18 小时', spec: '500ml / 浓缩液 / 冷藏 7 天', origin: '杭州 · 拱墅', maker: '阿禾',
    desc: '一份浓缩兑两份冰水或牛奶。早上来不及做手冲的时候，这是最省事的体面。',
  },
  {
    name: '手冲滤杯套装', subtitle: '陶滤杯 + 滤纸 100 张', category: '咖啡',
    price: 15800, stock: 27, sales: 156, hue: 32,
    images: ['prod-pourover.jpg', 'prod-beans-bowl.jpg', 'scene-maker.jpg'],
    material: '陶 + 无漂白滤纸', spec: '1-2 人份 / 壁厚 6mm', origin: '景德镇 · 浮梁', maker: '林深',
    desc: '壁厚保温好，水温掉得慢，冲浅烘不容易发涩。锥形单孔，流速靠注水控制，新手也容易上手。',
  },
  {
    name: '挂耳咖啡 · 10 包', subtitle: '办公室里的两分钟', category: '咖啡',
    price: 4800, stock: 150, sales: 803, hue: 20,
    images: ['prod-cups.jpg', 'prod-latte.jpg', 'scene-desk.jpg'],
    material: '拼配豆 · 中烘', spec: '10g×10 包 / 充氮保鲜', origin: '杭州 · 拱墅', maker: '阿禾',
    desc: '撕开挂上杯口，分三段注水，两分钟一杯。出差、加班、带去露营都方便。',
  },

  {
    name: '现磨咖啡粉 · 250g', subtitle: '手冲 / 法压两种研磨度可选', category: '咖啡',
    price: 7200, stock: 60, sales: 264, hue: 24,
    images: ['prod-ground.jpg', 'prod-beans-dark.jpg', 'scene-coffee.jpg'],
    material: '阿拉比卡拼配', spec: '250g / 下单后现磨 / 充氮包装', origin: '杭州 · 拱墅', maker: '阿禾',
    desc: '没有磨豆机也能喝手冲。下单时备注研磨度，默认按手冲中细研磨。开袋后建议两周内喝完。',
  },

  // ============ 木作 ============
  {
    name: '老料木钉 · 200 枚', subtitle: '方头，配榫卯用', category: '木作',
    price: 2800, stock: 46, sales: 152, hue: 32,
    images: ['prod-wood-bench.jpg', 'prod-wood-shop.jpg', 'prod-wood-tools.jpg'],
    material: '老铁 · 手工锻打', spec: '长 45mm / 200 枚一盒', origin: '浙江 · 东阳', maker: '周愚',
    desc: '方头方身，钉进木头不会把纤维劈开。做榫卯加固、修旧家具都用得上，锈一点反而更咬木。',
  },
  {
    name: '老料手工刨 · 三件套', subtitle: '刨身是六十年的榉木', category: '木作',
    price: 22800, stock: 12, sales: 34, hue: 26,
    images: ['prod-wood-tools.jpg', 'prod-wood-shop.jpg', 'scene-maker.jpg'],
    material: '老榉木刨身 + 白钢刃', spec: '三把 / 长 24cm、18cm、12cm', origin: '浙江 · 东阳', maker: '周愚',
    desc: '从旧工坊收来的刨身，木性早就稳定了，只换了新刃口。磨一次能用一下午，刨花是一整条。',
  },
  {
    name: '工具箱 · 榫卯', subtitle: '不用一颗螺丝', category: '木作',
    price: 19800, stock: 9, sales: 27, hue: 24,
    images: ['prod-wood-shop.jpg', 'prod-wood-bench.jpg', 'scene-studio-4.jpg'],
    material: '白蜡木 · 燕尾榫', spec: '34×20×15cm', origin: '浙江 · 东阳', maker: '周愚',
    desc: '全部燕尾榫咬合，不用螺丝也不用胶。空箱 1.8kg，装工具、装画笔、装茶叶都行。',
  },
];

/** 评价语料：按分类随机组合，生成 3-5 条像样的评价 */
export const REVIEW_POOL = {
  器物: [
    ['拿在手里比照片更有分量，杯壁的橘皮纹很舒服。', 5],
    ['颜色比图片深一点，但更耐看，日常在用。', 5],
    ['包装很稳，三层瓦楞纸，一点磕碰都没有。', 4],
    ['口径比想象中小，喝美式刚好，喝汤就算了。', 4],
    ['第二次买了，送朋友。作者手写的卡片很加分。', 5],
  ],
  纸品: [
    ['纸很吃墨，钢笔写不洇，比我之前买的贵牌好用。', 5],
    ['riso 的错位感是故意的，收到就明白为什么贵。', 5],
    ['装帧扎实，摊平之后写字很顺手。', 4],
    ['颜色比屏幕上柔和，实物更像旧纸。', 5],
    ['信封有点薄，寄挂号信建议再套一层。', 4],
  ],
  香氛: [
    ['味道很干净，不甜不冲，写稿的时候点一支刚好。', 5],
    ['烟量确实小，房间里不会有呛人的感觉。', 5],
    ['烧完灰是完整的，不会到处飞。', 4],
    ['性价比不错，回购第三次了。', 5],
    ['香味偏冷，喜欢暖调的可能会觉得太清。', 4],
  ],
  咖啡: [
    ['烘焙日期是三天前，养豆期刚好，冲出来很甜。', 5],
    ['橘子味很明显，冷下来更好喝。', 5],
    ['挂耳包里是整豆磨的，不是碎末，这点很难得。', 5],
    ['酸度对我偏高，下次试试中深烘。', 4],
    ['物流很快，隔天就到，包装有单向排气阀。', 5],
  ],
  木作: [
    ['打磨得很细致，边角没有毛刺，手感温润。', 5],
    ['木纹比图片好看，颜色偏暖。', 5],
    ['榫卯咬合很紧，晃不动，做工扎实。', 5],
    ['比想象中轻，出门带着也不累。', 4],
    ['第一次上油的时候颜色变深了，反而更好看。', 5],
  ],
};

export const REVIEWERS = ['陶土与火', '山下的猫', '周末在家', '夜航船', '一颗青柠', '旧书页', '三点水', '雾里有灯'];
