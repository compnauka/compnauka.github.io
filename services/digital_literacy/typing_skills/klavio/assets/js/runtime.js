(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioRuntime = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  function shuffled(items, random) {
    const result = items.slice();
    const nextRandom = typeof random === "function" ? random : Math.random;

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(nextRandom() * (index + 1));
      const current = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = current;
    }

    return result;
  }

  function buildRound(items, length, random) {
    if (!Array.isArray(items) || items.length === 0 || length <= 0) return [];

    const result = [];
    let pool = [];

    while (result.length < length) {
      if (pool.length === 0) {
        pool = shuffled(items, random);

        if (result.length > 0 && pool.length > 1 && identity(pool[0]) === identity(result[result.length - 1])) {
          const first = pool[0];
          pool[0] = pool[1];
          pool[1] = first;
        }
      }

      result.push(pool.shift());
    }

    return result;
  }

  function identity(item) {
    return item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "id") ? item.id : item;
  }

  function createTonePlayer(isEnabled) {
    let audioContext = null;

    function context() {
      if (audioContext) return audioContext;
      if (!root || !(root.AudioContext || root.webkitAudioContext)) return null;

      try {
        audioContext = new (root.AudioContext || root.webkitAudioContext)();
      } catch (error) {
        audioContext = null;
      }

      return audioContext;
    }

    function tone(frequency, duration, delay, type, gain) {
      if (!isEnabled()) return;

      const audio = context();
      if (!audio) return;
      if (audio.state === "suspended") audio.resume();

      try {
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        const startAt = audio.currentTime + (delay || 0);

        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        volume.gain.setValueAtTime(gain || 0.055, startAt);
        volume.gain.exponentialRampToValueAtTime(0.001, startAt + duration + 0.03);
        oscillator.connect(volume);
        volume.connect(audio.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + 0.04);
      } catch (error) {
        // Звук не є критичним для роботи вправи.
      }
    }

    return {
      correct: function () {
        tone(523, 0.07, 0, "sine", 0.06);
        tone(659, 0.08, 0.07, "sine", 0.055);
      },
      error: function () {
        tone(190, 0.07, 0, "square", 0.035);
      },
      complete: function () {
        [523, 659, 784, 1047].forEach(function (frequency, index) {
          tone(frequency, 0.11, index * 0.09, "sine", 0.06);
        });
      }
    };
  }

  return {
    shuffled,
    buildRound,
    createTonePlayer
  };
});
