# 耦合红线

本项目因高耦合导致过一次重构。以下是不可逾越的红线，适用于所有开发会话。

## 四条红线

### 1. render/ 不引入逻辑模块

```
允许：render/*.js → import { el, h, formatTime } from './common.js'
禁止：render/*.js → import { state } from '../state.js'
禁止：render/*.js → import { addCoins } from '../storage.js'
```

render/ 只能通过 `setActions()` 接收回调，通过参数接收数据。不允许直接 import 任何 `js/` 根目录下的逻辑模块。

### 2. 数据变更只走 state setter

```
允许：state.coins += n; saveState();
禁止：localStorage.setItem('library_state', JSON.stringify({...}))
禁止：直接在逻辑模块中修改 state 对象的嵌套属性后不调 saveState()
```

state.js 是唯一数据源。任何持久化数据的读写必须通过 state.js 暴露的函数。

### 3. 新功能 = 新文件

```
允许：新增 js/some_feature.js，在 app.js 中 import 并接入
禁止：在已有文件中追加超过 80 行的新逻辑
禁止：在 state.js 中追加超过 30 行的新字段定义
```

每个系统独立一个文件。如果某个文件超过 300 行，应该拆成两个。

### 4. 逻辑模块间不互相依赖

```
允许：app.js → import { tickVisitors } from './visitors.js'
                   import { refreshShop } from './shop.js'
禁止：visitors.js → import { addCoins } from './shop.js'
禁止：quests.js  → import { getVisitor } from './visitors.js'
```

逻辑模块之间不应互相 import。如果模块 A 需要模块 B 的数据，通过 app.js 编排传递，或通过 state.js 共享。

## 新模块检查清单

开工前问自己：
- 这个新逻辑是不是独立一个文件？
- render 层是不是只通过 setActions 拿到回调？
- 数据变更是不是走 state → saveState？
- 有没有 import 其他逻辑模块？如果有，改成通过 app.js 编排

## 备注

这些规则不追求完美覆盖，只覆盖最容易滑向高耦合的四个口子。
在每轮开发会话中，这四条规则优先级高于功能实现。
