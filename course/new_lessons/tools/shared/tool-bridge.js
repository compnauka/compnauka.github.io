const params = new URLSearchParams(window.location.search);

export function createEmbeddedToolBridge(source) {
  return function notifyLessonCompleted() {
    const activityId = params.get("activityId") || "";
    const payload = {
      type: "embedded-tool-finished",
      activityId,
      source
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, window.location.origin);
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
    }
  };
}

export function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
