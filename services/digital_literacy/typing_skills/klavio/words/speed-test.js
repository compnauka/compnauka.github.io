(function (root) {
  "use strict";

  const DURATION = 60000;
  const passages = {
    uk: [
      "У суботу ми зустрілися біля школи й пішли до парку. Після дощу стежки ще блищали, а з гілок падали великі краплі. Біля мосту ми зупинилися, щоб роздивитися качок на воді. Далі стежка вела до галявини, де діти пускали паперового змія. Вітер то піднімав його над деревами, то раптом стихав. Ми дочекалися нового пориву й побачили, як змій знову злетів у небо. На зворотному шляху ми купили хліб і зайшли до бабусі. За теплим чаєм кожен розповів, що запам'яталося найбільше.",
      "У неділю ми зайшли до бібліотеки, щоб вибрати книжки на канікули. Біля вікна стояв великий стіл із новими виданнями, а на полиці лежали карти. Марко знайшов книжку про море, а Оленка вибрала збірку казок. Потім бібліотекарка показала нам, де шукати книжки про птахів. Ми довго гортали атлас і звіряли малюнки з назвами. Перед виходом кожен записав назву улюбленої книжки на маленькому аркуші. Тепер ми можемо обмінятися списками й повернутися за новими історіями наступного тижня.",
      "У понеділок наш клас вирішив посадити квіти біля школи. Спочатку ми прибрали сухе листя, а потім розпушили землю біля огорожі. Данило приніс насіння, а Софія позначила паличками місце для кожного рядка. Коли всі закінчили роботу, ми обережно полили землю з маленької лійки. Тепер щоранку двоє учнів перевіряють, чи не пересохла грядка. За тиждень ми помітили перші зелені паростки. Уже можна було розрізнити, де ростуть чорнобривці, а де згодом розквітнуть айстри."
    ],
    en: [
      "On Saturday we met near the school and walked to the park. The paths still shone after the rain, and drops fell from the trees. We stopped by the bridge to watch ducks glide across the water. Farther along the path, some children were flying a paper kite. The wind lifted it above the trees and then fell quiet. We waited for another gust and watched the kite climb into the sky again. On the way home we bought bread and stopped to see our grandmother. Over a cup of tea, we shared our favorite moments from the walk.",
      "On Sunday we went to the library to find books for the holiday. A large table near the window held the new books, and some maps lay on a shelf. Mark picked a book about the sea, while Helen chose a collection of stories. The librarian showed us where to find books about birds. We turned the pages of an atlas and matched the pictures with their names. Before we left, everyone wrote down the title of a favorite book. Now we can trade our lists and come back for different stories next week.",
      "On Monday our class decided to plant flowers near the school. First we gathered the dry leaves, and then we loosened the soil by the fence. Daniel brought the seeds, and Sophie used sticks to mark each row. When the work was done, we watered the soil with a small watering can. Now two students check the flower bed every morning to see if it needs water. A week later we spotted the first green shoots. We could already tell where the marigolds were growing and where the asters would bloom."
    ]
  };

  function create(language, passageIndex) {
    const variants = passages[language];
    const ordered = variants.map(function (_, index) { return variants[(passageIndex + index) % variants.length]; });
    return {
      language,
      passage: ordered.join(" ") + " ",
      deadline: null,
      entries: [],
      previousCorrect: 0,
      correct: 0,
      correctAttempts: 0,
      errors: 0,
      errorCounts: {}
    };
  }

  function timeLeft(test, now) {
    return test.deadline === null ? DURATION : Math.max(0, test.deadline - now);
  }

  function enter(test, correct, now) {
    if (!timeLeft(test, now)) return false;
    if (test.deadline === null) test.deadline = now + DURATION;

    const expected = test.passage[test.entries.length];
    test.entries.push(correct);
    if (correct) {
      test.correct += 1;
      test.correctAttempts += 1;
    } else {
      test.errors += 1;
      test.errorCounts[expected] = (test.errorCounts[expected] || 0) + 1;
    }
    return true;
  }

  function backspace(test) {
    if (test.entries.pop()) test.correct -= 1;
  }

  function nextBlock(test) {
    test.previousCorrect += test.correct;
    test.correct = 0;
    test.entries.length = 0;
  }

  function result(test, now) {
    const attempts = test.correctAttempts + test.errors;
    const elapsed = DURATION - timeLeft(test, now);
    return {
      accuracy: attempts > 0 ? Math.round(100 * test.correctAttempts / attempts) : 100,
      cpm: elapsed > 0 ? Math.round((test.previousCorrect + test.correct) * DURATION / elapsed) : 0,
      errors: test.errors
    };
  }

  function layoutMismatch(language, key) {
    return /\p{Letter}/u.test(key) && !(language === "en" ? /[a-z]/i : /[а-щьюяєіїґ]/i).test(key);
  }

  const api = { DURATION, variants: passages.uk.length, create, timeLeft, enter, backspace, nextBlock, result, layoutMismatch };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioSpeedTest = api;
})(typeof window !== "undefined" ? window : globalThis);
