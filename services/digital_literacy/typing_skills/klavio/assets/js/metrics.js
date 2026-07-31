(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioMetrics = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function create() {
    return {
      correct: 0,
      errors: 0,
      startedAt: 0,
      finishedAt: 0
    };
  }

  function start(metrics, now) {
    metrics.startedAt = Number.isFinite(now) ? now : Date.now();
    metrics.finishedAt = 0;
    return metrics;
  }

  function finish(metrics, now) {
    metrics.finishedAt = Number.isFinite(now) ? now : Date.now();
    return metrics;
  }

  function recordCorrect(metrics, amount) {
    metrics.correct += Number.isFinite(amount) ? Math.max(0, amount) : 1;
    return metrics;
  }

  function recordError(metrics, amount) {
    metrics.errors += Number.isFinite(amount) ? Math.max(0, amount) : 1;
    return metrics;
  }

  function attempts(metrics) {
    return metrics.correct + metrics.errors;
  }

  function accuracy(metrics) {
    const total = attempts(metrics);
    return total > 0 ? Math.round((metrics.correct / total) * 100) : 100;
  }

  function durationMs(metrics, now) {
    if (!metrics.startedAt) return 0;
    const end = metrics.finishedAt || (Number.isFinite(now) ? now : Date.now());
    return Math.max(0, end - metrics.startedAt);
  }

  function cpm(metrics, now) {
    const minutes = durationMs(metrics, now) / 60000;
    return minutes > 0 ? Math.round(metrics.correct / minutes) : 0;
  }

  function wpm(metrics, now) {
    return Math.round(cpm(metrics, now) / 5);
  }

  return {
    create,
    start,
    finish,
    recordCorrect,
    recordError,
    attempts,
    accuracy,
    durationMs,
    cpm,
    wpm
  };
});
