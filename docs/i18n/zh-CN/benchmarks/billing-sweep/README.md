# Anthropic 视觉计费扫描测试

🌐 已翻译:[所有语言](../../../README.md)

**存在的原因:** 只有当成本估算**精确**时,盈利性门控才是安全的。
一个哪怕只有微小偏差的公式,也可能转换掉实际上成本更高的内容块。
因此这套扫描测试会在正式上线前,将公式与 API 的真实数字对齐——
做到**零残差**。

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

免费的 `count_tokens` 扫描测试,用于裁定两个悬而未决的几何结构问题:

1. **公式**——API 计费究竟是按 `ceil(w/28) × ceil(h/28)` 分块(当前文档所述),
   还是按已淘汰的 `w·h/750`?探针集设计上会让两者在每一行相差 25–180 个
   token,以便区分。
2. **档位**——`claude-fable-5` 是否享有高分辨率上限(长边 ≤ 2576 px,
   ≤ 4784 个视觉 token)?`page-old-1928x1928` 这一行是决定性的:
   若实测约为 **4761**,意味着高分辨率是所见即所得(旧的大页面每张图像
   承载的字符数约为如今 1568×728 页面的 3.3 倍,而字符/token 比率相同);
   若实测约为 **1521**,则意味着标准档位重采样,1568×728 仍是正确选择。

背景:支撑当前 1568×728 页面的 2026-07-01 扫描测试(可读性审计,
2026-07-01)是在 `claude-sonnet-4-5` 上测得的——这是一个标准档位模型,
而生产环境的目标是 Fable 5,视觉文档将其归入高分辨率档位。那次审计还测得
当前页面耗费 1460 token:更接近分块公式的 1456,而非 /750 公式的 1522,
暗示 API 当时已转向按分块计费。

## 运行方式

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

必须**直接**调用 API——绝不能经过 OmniGlyph 代理,否则请求体会被转换。
`count_tokens` 是免费的;完整的扫描测试大约发出 25 个请求。

## 解读输出结果

对每个模型,每一行探针都展示实测的图像 token 数(带图像的总数减去纯文本
基线),对照全部四种预测(`patch`/`legacy750` × `standard`/`highres`);
汇总部分按平均绝对残差对各假设排名。`--probe-multi` 用于检查单图上限
(2×1092² ≈ 2×1521);`--probe-20plus` 用于检查"超过 20 张图"规则
(边长超过 2000 px 的图像应被拒绝,而非缩放)。各行数据存入
`results/*.jsonl`;预测公式的实现在 `formulas.mjs` 中,并由
`tests/billing-sweep-formulas.test.ts` 钉住。

## 得出结论之后

- 若分块公式得到确认 → 移植 OmniGlyph PR #27(精确的缩放换算),
  并对齐 `src/core/transform.ts` 中的 `ANTHROPIC_PIXELS_PER_TOKEN`
  门控数学。
- 若在 Fable 上确认了高分辨率档位 → 重新引入按档位区分的页面几何结构
  (Fable/Opus 4.8/Sonnet 5 使用 1928×1928 一类的页面,标准档位使用
  1568×728),与 GPT 路径已有的 `GPT_MAX_HEIGHT_PX` 做法保持一致。
