// 引导任务触发器 —— 从 app.js 抽出，供 core 模块复用
import { checkGuideQuest, tryCompleteAllDone } from '../guidequests.js';
import { showQuestCompleteToast, renderGuideQuestWidget } from '../render/index.js';

export function triggerQuestCheck(event) {
  const result = checkGuideQuest(event);
  if (result && result.completed) {
    showQuestCompleteToast(result.completed);
  }
  renderGuideQuestWidget();
  // 如果刚完成了第9个任务，检查第10个
  if (result && result.completed && result.completed.id === 'q09') {
    const finalResult = tryCompleteAllDone();
    if (finalResult && finalResult.completed) {
      showQuestCompleteToast(finalResult.completed);
      renderGuideQuestWidget();
    }
  }
}
