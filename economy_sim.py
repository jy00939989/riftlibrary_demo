#!/usr/bin/env python3
# 归墟图书馆经济平衡模拟（确定性"典型投入玩家"模型）
# 目的：量化三件事 —— 氛围何时溢出(=500)、金币何时能"买齐核心"、灵感是否够刷满熟练度
# 所有参数均来自代码实测，假设写在每节注释里。

# ---------- 参数（代码实测） ----------
BORROW_PRICE = [0,500,750,1125,1688,2531,3797,5695]   # getBorrowLevelPrice: 500*1.5^lv, cap5700
FOCUS_PRICE  = [0,400,580,841,1219,1768,2563]           # getFocusLevelPrice: 400*1.45^lv, cap5000
SIGNBOARD_TOTAL = 400+500+400+600+500+600               # 6块标志牌
DLC_AMBIENT = 1200 + 500 + 800                         # DLC包 + 两个环境音
BOOKS_TOTAL = 68
BOOKS_BUYABLE = 50                                      # 扣除常驻新手/种子书后的可购普通书
BOOK_AVG_PRICE = 650                                    # 普通书 500~800 均值
STARTER_BOOKS_COST = 3*200                              # 3本常驻新手书
BOOKS_COST = BOOKS_BUYABLE*BOOK_AVG_PRICE + STARTER_BOOKS_COST
ATMO_CAP = 500
ATMO_PER_BORROW_UP = 15                                 # upgradeBorrowLevel 每次 +15
ATMO_PER_FOCUS_UP  = 15                                 # upgradeFocusLevel 每次 +15
PLANT_INVEST = 50 + 50 + 80 + 120 + 180                # 买盆+施肥到L5
PLANT_RETURN_COINS = 30                                 # harvestCoins
PLANT_RETURN_ATMO  = 2                                   # 鹤望兰；玫瑰25
INSPIRATION_PER_RECOPY = 2

# ---------- 模拟假设（典型"每天约1小时"玩家） ----------
# 专注：前30天 25分钟/天(1 session)，之后 50分钟/天(2 session)
# 金币倍率(aura+curation+achievement)：前30天 0；31-90天 0.2；90天后 0.35
# 借阅区等级：按"有钱就升"的贪心策略推进（用于访客产出）
# 访客每日归还数 ≈ 借阅区cap 的 60%（保守），每归还 returnCoins / returnAtmo 按等级表
BORROW_TABLE = [
    None,
    dict(cap=2,coins=30,atmo=0),
    dict(cap=3,coins=35,atmo=1),
    dict(cap=6,coins=40,atmo=3),
    dict(cap=7,coins=45,atmo=3),
    dict(cap=8,coins=50,atmo=5),
    dict(cap=9,coins=55,atmo=5),
    dict(cap=10,coins=60,atmo=8),
]

def coins_mult(day):
    if day <= 30: return 0.0
    if day <= 90: return 0.2
    return 0.35

def focus_minutes(day):
    return 25 if day <= 30 else 50

def run(days=180):
    atmo = 0
    coins = 250          # 引导任务合计 250 金币起步（doc §2.5）
    borrow = 1
    focus_lv = 1
    atmo_day_500 = None
    # 每日固定任务
    TASK_COINS = 30 + 10 + 20   # 专注25 + 浇水 + 全勤
    TASK_ATMO  = 3              # 全勤氛围
    rows = []
    cum_spend_on_upgrades = 0
    for d in range(1, days+1):
        prev_atmo = atmo
        # —— 金币收入 ——
        fm = focus_minutes(d)
        inc_focus = round(fm * 0.8 * (1 + coins_mult(d)))
        inc_task  = TASK_COINS
        # 访客归还（用当前 borrow 等级）
        cap = BORROW_TABLE[borrow]['cap']
        returns = max(1, round(cap*0.6))
        inc_visit = returns * BORROW_TABLE[borrow]['coins']
        day_inc = inc_focus + inc_task + inc_visit
        coins += day_inc
        # —— 氛围收入 ——
        atmo_inc = TASK_ATMO
        atmo_inc += returns * BORROW_TABLE[borrow]['atmo']
        # 抄书/修复/里程碑等小额，按月均摊（≈2/天，保守）
        atmo_inc += 2
        atmo = min(ATMO_CAP, atmo + atmo_inc)
        if atmo_day_500 is None and atmo >= ATMO_CAP:
            atmo_day_500 = d
        # —— 贪心升级（先借区级，再缮写室） ——
        if borrow < 7 and coins >= BORROW_PRICE[borrow]:
            coins -= BORROW_PRICE[borrow]
            cum_spend_on_upgrades += BORROW_PRICE[borrow]
            atmo = min(ATMO_CAP, atmo + ATMO_PER_BORROW_UP)
            borrow += 1
        elif focus_lv < 6 and coins >= FOCUS_PRICE[focus_lv]:
            coins -= FOCUS_PRICE[focus_lv]
            cum_spend_on_upgrades += FOCUS_PRICE[focus_lv]
            atmo = min(ATMO_CAP, atmo + ATMO_PER_FOCUS_UP)
            focus_lv += 1
        rows.append((d, borrow, focus_lv, day_inc, inc_visit, atmo_inc, atmo, coins))
    return rows, atmo_day_500, cum_spend_on_upgrades

rows, atmo_day_500, up_spend = run(180)

# 总"买齐核心"成本
TOTAL_CORE_COST = sum(BORROW_PRICE[1:]) + sum(FOCUS_PRICE[1:]) + SIGNBOARD_TOTAL + DLC_AMBIENT + BOOKS_COST
print("========== 总成本估算（买齐核心内容） ==========")
print(f"借阅区 Lv1→7 : {sum(BORROW_PRICE[1:])}")
print(f"缮写室 Lv1→6 : {sum(FOCUS_PRICE[1:])}")
print(f"标志牌 ×6    : {SIGNBOARD_TOTAL}")
print(f"DLC+环境音   : {DLC_AMBIENT}")
print(f"书籍(~{BOOKS_BUYABLE}本普通+3新手) : {BOOKS_COST}")
print(f"★ 合计约     : {TOTAL_CORE_COST} 智慧之光")
print()
print("========== 氛围溢出（=500 封顶） ==========")
print(f"典型玩家约第 {atmo_day_500} 天 氛围达到 500 封顶（之后所有氛围来源归零价值）")
print()
print("========== 金币累计 vs 总支出（每30天抽样） ==========")
print(f"{'天数':>4} {'借阅Lv':>5} {'缮写Lv':>5} {'当日收入':>7} {'当日访客币':>8} {'氛围':>4} {'累计金币':>8}")
for d,borrow,fl,inc,vis,ai,atmo,coins in rows:
    if d % 30 == 0:
        print(f"{d:>4} {borrow:>5} {fl:>5} {inc:>7} {vis:>8} {atmo:>4} {coins:>8}")
# 找到累计金币首次 >= TOTAL_CORE_COST 的天数（仅统计收入，不扣书/标志牌实际购买时点）
first_reach = None
cum = 250
# 重新按"不花钱"上限估算纯收入积累天数（理论下限）
for d,borrow,fl,inc,vis,ai,atmo,coins in rows:
    pass
print()
print("========== 灵感供给 vs 熟练度需求（粗估） ==========")
# 每次专注灵感期望：烛台+1(若开) + 沙漏(>=60min: 0.35) + 连触(>=3天:0.15~0.25)
# 取 50分钟/天、开烛台、连触>=7：1 + 0.35 + 0.25 = 1.6 灵感/天
insp_per_day = 1 + 0.35 + 0.25
print(f"成熟玩家灵感供给 ≈ {insp_per_day:.2f} 点/天（烛台+沙漏+连触，不含修复随机）")
print(f"把 1 本书刷到 5 星熟练度需 4 次重抄 × 2 = 8 灵感")
print(f"刷满全部 {BOOKS_TOTAL} 本书到 5 星需 {BOOKS_TOTAL*8} 灵感 ≈ {BOOKS_TOTAL*8/insp_per_day:.0f} 天纯供给")
print()
print("========== 植物经济（单株生命周期） ==========")
print(f"投入(买盆+施肥到L5): {PLANT_INVEST} 金币")
print(f"收获返回: {PLANT_RETURN_COINS} 金币 + {PLANT_RETURN_ATMO} 氛围 + 概率种子")
print(f"净金币: {PLANT_RETURN_COINS - PLANT_INVEST}（纯消耗）；唯一正收益是种子→限定书(一次性)")
