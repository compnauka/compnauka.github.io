import { renderDrawTask, setupDrawTask } from "./task-draw.js";
import { renderClassifyTask, setupClassifyTask } from "./task-classify.js";
import { renderTrueFalseTask, setupTrueFalseTask } from "./task-truefalse.js";
import { renderPickTask, setupPickTask } from "./task-pick.js";
import { renderFillTask, setupFillTask } from "./task-fill.js";
import { renderScenariosTask, setupScenariosTask } from "./task-scenarios.js";
import { renderSequenceTask, setupSequenceTask } from "./task-sequence.js";
import { renderCreativeTask, setupCreativeTask } from "./task-creative.js";
import { renderTransferTask, setupTransferTask } from "./task-transfer.js";
import { renderTableReadTask, setupTableReadTask } from "./task-table-read.js";
import { renderClickTrainerTask, setupClickTrainerTask } from "./task-click-trainer.js";
import { renderTraceContourTask, setupTraceContourTask } from "./task-trace-contour.js";
import { renderKeyTrainerTask, setupKeyTrainerTask } from "./task-key-trainer.js";

export function createActivityRegistry(state, refs, showFeedback) {
  return {
    draw: {
      render: renderDrawTask,
      setup: (activity) => setupDrawTask(activity, state, refs, showFeedback)
    },
    classify: {
      render: renderClassifyTask,
      setup: (activity, rerenderTask) => setupClassifyTask(activity, state, refs, showFeedback, rerenderTask)
    },
    truefalse: {
      render: renderTrueFalseTask,
      setup: (activity, rerenderTask) => setupTrueFalseTask(activity, state, refs, showFeedback, rerenderTask)
    },
    pick: {
      render: renderPickTask,
      setup: (activity, rerenderTask) => setupPickTask(activity, state, refs, showFeedback, rerenderTask)
    },
    fill: {
      render: renderFillTask,
      setup: (activity, rerenderTask) => setupFillTask(activity, state, refs, showFeedback, rerenderTask)
    },
    sequence: {
      render: renderSequenceTask,
      setup: (activity, rerenderTask) => setupSequenceTask(activity, state, refs, showFeedback, rerenderTask)
    },
    creative: {
      render: renderCreativeTask,
      setup: (activity, rerenderTask) => setupCreativeTask(activity, state, refs, showFeedback, rerenderTask)
    },
    scenarios: {
      render: renderScenariosTask,
      setup: (activity, rerenderTask) => setupScenariosTask(activity, state, refs, showFeedback, rerenderTask)
    },
    transfer: {
      render: renderTransferTask,
      setup: (activity, rerenderTask) => setupTransferTask(activity, state, refs, showFeedback, rerenderTask)
    },
    "table-read": {
      render: renderTableReadTask,
      setup: (activity, rerenderTask) => setupTableReadTask(activity, state, refs, showFeedback, rerenderTask)
    },
    "click-trainer": {
      render: renderClickTrainerTask,
      setup: (activity, rerenderTask) => setupClickTrainerTask(activity, state, refs, showFeedback, rerenderTask)
    },
    "trace-contour": {
      render: renderTraceContourTask,
      setup: (activity) => setupTraceContourTask(activity, state, refs, showFeedback)
    },
    "key-trainer": {
      render: renderKeyTrainerTask,
      setup: (activity, rerenderTask) => setupKeyTrainerTask(activity, state, refs, showFeedback, rerenderTask)
    }
  };
}
