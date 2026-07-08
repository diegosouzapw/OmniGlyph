# 为 OmniGlyph 做贡献

感谢你的关注!这个项目有两条不容妥协的文化准则——
它们正是 README 中每一个数字都值得信赖的原因。

## 准则一 —— 严格 TDD

所有生产代码都诞生于一个先失败的测试:

1. 编写测试,并**确认它以正确的理由失败**。
2. 编写能让它通过的最小实现。
3. 在保持绿色的前提下重构。

完整的验收标准是:`pnpm run typecheck && pnpm test && pnpm run build`——
三者缺一不可(文档链接检查与品牌重命名守护测试在 `pnpm test` 内部通过
`tests/docs-integrity.test.ts` 运行)。

## 准则二 —— 先测量,后声明

对几何结构、字形图集、计费公式或模型范围的任何改动,若没有测量数字支撑,
一律不予合入。整个仓库都是围绕这一纪律构建的:

- 计费成本 → 用 `benchmarks/billing-sweep/` 来证明(`count_tokens` 是免费的;
  预期残差:零)。
- 可读性 → 用 `benchmarks/density-frontier/` 来证明(每组 n≥30,确定性评分,
  JSONL 凭据提交到 `benchmarks/*/results/`)。
- 更改生产环境默认值的验收标准:内容概要与文本基线一致 **且**
  零静默的精确字符串错误 **且** 净节省为正。

没有数字支撑的假设应写入 `docs/ROADMAP.md` 作为假设——绝不能作为事实写入
README。已有两个"看似显然"的想法被数据证伪(高分辨率页面、抗锯齿字形图集);
这套流程是有效的。

## 环境搭建

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18(CI 测试 20/22/24 三个版本),pnpm 10(由 package.json 中的
`packageManager` 字段锁定)。

## 目录结构

| 目录 | 规则 |
|---|---|
| `src/core/` | 与运行时无关(只使用 Web API——可在 Node 与 Workers 上运行) |
| `src/node.ts` / `src/worker.ts` | 仅负责宿主环境的接线 |
| `benchmarks/` | 可重新运行的测试套件;JSONL 结果是凭据,需提交 |
| `docs/` | benchmarks/(数字)、architecture/(架构图)、ROADMAP(假设)、ops/(OmniRoute) |

## 提交与 PR

- 使用约定式提交(`feat:`、`fix:`、`perf:`、`docs:`、`refactor:`、
  `test:`、`chore:`),正文说明*为什么*这样改,并附上相关数字。
- 保持 PR 小而聚焦;行为变更需附带钉住该行为的测试,以及在适用时,
  证明其合理性的基准测试。
- 不要重写客户端的 `cache_control` 区块,不要在未经讨论的情况下添加运行时依赖
  (核心库刻意保持轻依赖),渲染路径中不要使用 `Math.random`/时间戳
  (确定性是一条硬性不变量,通过字节级一致性测试保证)。
