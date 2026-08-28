#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
访客刷新加权 Monte Carlo 模拟器
================================
目的：在落地 visitors.js 的"方案C 刷新加权"前，用模拟标定三个权重参数：
    NEVER_SEEN  (favor===0 时的权重倍率，基线 1)
    K           (软衰减常数)
    FLOOR       (已建立访客的最低权重)
以及验证阈值/cap 设计下的 catch-up 行为。

模型对齐实际代码（已核实）：
- spawnVisitor(visitors.js:519) 在"选谁"层用 pick(charIds) 均匀随机；
  本脚本默认模式即均匀基线，--weighted 开启加权（对齐方案C）。
- 第 527 行 filter：已在馆的访客不参与本轮选取（不能重复进馆）。
  本脚本用 present_until 实现：访客被选中后"占用" visit_duration 个 spawn 事件。
- 好感只增不减（addVisitorFavor 只 +），cap 封顶。
- 单次 visit 累加 per_visit_gain 好感（浏览+借+还的合计，[PLACEHOLDER] 估算 18）。

不依赖任何游戏代码，纯标准库，可直接跑：
    python favor-balance-montecarlo.py --weighted
    python favor-balance-montecarlo.py --weighted --never-seen 8 --k 120 --floor 0.1 --trials 50
"""

import argparse
import random
import statistics


def weighted_pick(ids, weight_fn):
    """对齐方案C 的 weightedPick：total<=0 退回均匀。"""
    weights = [weight_fn(i) for i in ids]
    total = sum(weights)
    if total <= 0:
        return random.choice(ids)
    r = random.random() * total
    for vid, w in zip(ids, weights):
        r -= w
        if r <= 0:
            return vid
    return ids[-1]


def simulate(params, weighted, seed_offset=0):
    """跑一次完整模拟，返回统计字典。"""
    rng = random.Random(params["seed_base"] + seed_offset)
    N = params["n"]
    cap = params["cap"]
    gain = params["per_visit_gain"]
    dur = params["visit_duration"]
    events = params["events"]

    favor = [0] * N
    seen_count = [0] * N             # 各访客被选中次数（均衡度指标，不随 cap 饱和）
    present_until = [0] * N          # 该访客被占用到的事件下标（不含）
    first_seen = [None] * N          # 首次被选中时的事件下标
    selections = []                  # 选取序列，用于连刷统计
    skips = 0

    def weight_fn(vid):
        f = favor[vid]
        if f <= 0:
            return params["never_seen"] if weighted else 1.0
        if not weighted:
            return 1.0
        return max(params["floor"], 1.0 / (1.0 + f / params["k"]))

    for t in range(events):
        eligible = [v for v in range(N) if present_until[v] <= t]
        if not eligible:
            skips += 1
            continue
        chosen = weighted_pick(eligible, weight_fn)
        if first_seen[chosen] is None:
            first_seen[chosen] = t
        seen_count[chosen] += 1
        favor[chosen] = min(cap, favor[chosen] + gain)
        present_until[chosen] = t + dur
        selections.append(chosen)

    # 连刷统计：最长连续同一访客
    max_streak = 0
    cur = 1
    for i in range(1, len(selections)):
        if selections[i] == selections[i - 1]:
            cur += 1
            max_streak = max(max_streak, cur)
        else:
            cur = 1

    unseen = sum(1 for x in first_seen if x is None)
    return {
        "first_seen": first_seen,
        "max_first_seen": max(x for x in first_seen if x is not None),
        "unseen": unseen,
        "seen_count": seen_count,
        "final_favor_min": min(favor),
        "final_favor_max": max(favor),
        "final_favor_mean": statistics.mean(favor),
        "final_favor_var": statistics.pvariance(favor),
        "seen_var": statistics.pvariance(seen_count),
        "max_streak": max_streak,
        "skips": skips,
        "selections": len(selections),
    }


def run(params, weighted, label):
    trials = params["trials"]
    sims = [simulate(params, weighted, seed_offset=tr) for tr in range(trials)]
    max_first = [s["max_first_seen"] for s in sims]
    unseen_counts = [s["unseen"] for s in sims]
    max_streaks = [s["max_streak"] for s in sims]

    print(f"\n=== {label} ===")
    print(f"  参数: N={params['n']} cap={params['cap']} gain/visit={params['per_visit_gain']} "
          f"visit_dur={params['visit_duration']} events={params['events']} trials={trials}")
    if weighted:
        print(f"  权重: NEVER_SEEN={params['never_seen']} K={params['k']} FLOOR={params['floor']}")
    seen_vars = [s["seen_var"] for s in sims]
    final_favors_min = [s["final_favor_min"] for s in sims]
    print(f"  [catch-up] 最惨访客首次被见到所需事件数:")
    print(f"      mean={statistics.mean(max_first):.1f}  median={statistics.median(max_first):.0f}  "
          f"max={max(max_first)}  p95={sorted(max_first)[int(0.95*len(max_first))]:.0f}")
    print(f"  [0 好感残留] 整轮后仍未被见到的访客数 (跨 trial 均值): {statistics.mean(unseen_counts):.2f}  "
          f"(max={max(unseen_counts)})")
    print(f"  [均衡度] 被选中次数方差 (越低越均衡): mean={statistics.mean(seen_vars):.1f}  max={max(seen_vars):.1f}")
    print(f"  [连刷] 最长连续同一访客 (越低越不刷屏): mean={statistics.mean(max_streaks):.1f}  max={max(max_streaks)}")
    print(f"  [终态] favor 最小值均值={statistics.mean(final_favors_min):.1f} "
          f"(加权下应>0，证明'有人0'被消除；基线可能=0)")


def main():
    p = argparse.ArgumentParser(description="访客刷新加权 Monte Carlo 模拟器")
    p.add_argument("--weighted", action="store_true", help="开启方案C 加权（默认均匀基线）")
    p.add_argument("--never-seen", type=float, default=8.0, help="NEVER_SEEN 权重")
    p.add_argument("--k", type=float, default=120.0, help="软衰减常数 K")
    p.add_argument("--floor", type=float, default=0.1, help="FLOOR 最低权重")
    p.add_argument("--cap", type=float, default=600.0, help="好感封顶")
    p.add_argument("--n", type=int, default=10, help="访客总数")
    p.add_argument("--per-visit-gain", type=float, default=18.0, help="单次 visit 好感累加 [PLACEHOLDER]")
    p.add_argument("--visit-duration", type=int, default=3, help="访客占用槽位的事件数")
    p.add_argument("--events", type=int, default=300, help="模拟 spawn 事件数（约 1~数次专注会话）")
    p.add_argument("--trials", type=int, default=30, help="重复 trial 数")
    p.add_argument("--seed-base", type=int, default=20260729, help="随机种子基")
    args = p.parse_args()

    params = dict(
        n=args.n, cap=args.cap, per_visit_gain=args.per_visit_gain,
        visit_duration=args.visit_duration, events=args.events, trials=args.trials,
        seed_base=args.seed_base,
        never_seen=args.never_seen, k=args.k, floor=args.floor,
    )

    # 始终先跑均匀基线，证明问题存在
    run(params, weighted=False, label="基线：均匀随机 pick（现状）")
    if args.weighted:
        run(params, weighted=True, label="方案C：刷新加权")


if __name__ == "__main__":
    main()
