(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.KlavioLessonsDataEn = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  // Англійський курс (US ANSI, QWERTY). Порядок класичний: домашній ряд f j → d k → s l → a ;
  // → g h, потім верхній і нижній ряди, великі літери, знаки й тексти. keys — нові клавіші
  // уроку; текст складено лише з уже вивчених клавіш, пробілу й (з уроку 16) великих літер.
  return {
    groups: [
        {
            "id": "home",
            "title": "Домашній ряд",
            "range": [
                1,
                5
            ]
        },
        {
            "id": "top",
            "title": "Верхній ряд",
            "range": [
                6,
                10
            ]
        },
        {
            "id": "bottom",
            "title": "Нижній ряд",
            "range": [
                11,
                15
            ]
        },
        {
            "id": "capitals",
            "title": "Великі літери й знаки",
            "range": [
                16,
                20
            ]
        },
        {
            "id": "texts",
            "title": "Слова й тексти",
            "range": [
                21,
                24
            ]
        }
    ],
    lessons: [
        {
            "id": 1,
            "groupId": "home",
            "focus": "F J",
            "keys": [
                "f",
                "j"
            ],
            "text": "fff jjj fjf jfj ffj jjf fjfj jfjf fjj ffjj jjfj jjj jjff jjjf fjjf fff fff fjf jjjj jjf jfff fff"
        },
        {
            "id": 2,
            "groupId": "home",
            "focus": "D K",
            "keys": [
                "d",
                "k"
            ],
            "text": "ddd kkk dkd kdk ddk kkd dkdk kdkd jdj fjk ddd dddd djjd kkkd kdkf ddk dddk jkdk dkdf dddk kkk dfkk"
        },
        {
            "id": 3,
            "groupId": "home",
            "focus": "S L",
            "keys": [
                "s",
                "l"
            ],
            "text": "sss lll sls lsl ssl lls slsl lsls lkd flsl ssk jsll llss jssj fss lsls ssj lld lsk lfl dsk flls"
        },
        {
            "id": 4,
            "groupId": "home",
            "focus": "A ;",
            "keys": [
                "a",
                ";"
            ],
            "text": "aaa ;;; a;a a;a ;a; a; s; d; ;; asdf jkl; fdsa ;lkj sad dad salad fall add all ask flask"
        },
        {
            "id": 5,
            "groupId": "home",
            "focus": "G H",
            "keys": [
                "g",
                "h"
            ],
            "text": "ggg hhh ghg half has sad glass glad add shall had dad flash halls all flag ask flask fall salad"
        },
        {
            "id": 6,
            "groupId": "top",
            "focus": "E I",
            "keys": [
                "e",
                "i"
            ],
            "text": "eee iii eie see leg ask feel lake flash kiss egg halls fish like glass high side has life kid fall"
        },
        {
            "id": 7,
            "groupId": "top",
            "focus": "R U",
            "keys": [
                "r",
                "u"
            ],
            "text": "rrr uuu rur use jar ask girl hear flag ride rise fall far dress life hair here flash red sugar has"
        },
        {
            "id": 8,
            "groupId": "top",
            "focus": "T Y",
            "keys": [
                "t",
                "y"
            ],
            "text": "ttt yyy tyt skirt key girl dirty tree sad there star shark tiger try jar jet just glass shirt kite"
        },
        {
            "id": 9,
            "groupId": "top",
            "focus": "W O",
            "keys": [
                "w",
                "o"
            ],
            "text": "www ooo wow flower white shall low work dirty good today ride forest hold say world way red dog wide"
        },
        {
            "id": 10,
            "groupId": "top",
            "focus": "Q P",
            "keys": [
                "q",
                "p"
            ],
            "text": "qqq ppp qpq people parrot feel helpful happy throw quite quit wash paper square life keep sleep fire"
        },
        {
            "id": 11,
            "groupId": "bottom",
            "focus": "C ,",
            "keys": [
                "c",
                ","
            ],
            "text": "ccc ,,, c,c cook, clock laptop cool, cookie happy cat, catch red coffee, castle throw cut, juice day"
        },
        {
            "id": 12,
            "groupId": "bottom",
            "focus": "V M",
            "keys": [
                "v",
                "m"
            ],
            "text": "vvv mmm vmv come family frog home very wide market mom soup time every walk mouse tomato red river"
        },
        {
            "id": 13,
            "groupId": "bottom",
            "focus": "X .",
            "keys": [
                "x",
                "."
            ],
            "text": "xxx ... x.x explore. fix juice example. exam hard relax. mix quote tax. expert ride fox. six equal"
        },
        {
            "id": 14,
            "groupId": "bottom",
            "focus": "Z /",
            "keys": [
                "z",
                "/"
            ],
            "text": "zzz /// z/z z/z /z/ zoo zip mom he/she glaze gaze example pizza size his/her loud quiz maze warm"
        },
        {
            "id": 15,
            "groupId": "bottom",
            "focus": "B N",
            "keys": [
                "b",
                "n"
            ],
            "text": "bbb nnn bnb winter box marker cucumber winner loud insect beach cut bottle season tree spoon want"
        },
        {
            "id": 16,
            "groupId": "capitals",
            "focus": "Великі літери: ліва рука",
            "text": "A cat sat. Dad is glad. Rice is good. See the sun. The dog can run. Walk to the zoo. Bring a book."
        },
        {
            "id": 17,
            "groupId": "capitals",
            "focus": "Великі літери: права рука",
            "text": "It is hot. Jump up. Kids can play. Look at the moon. Open the door. Please help me. My home is here. Never give up."
        },
        {
            "id": 18,
            "groupId": "capitals",
            "focus": "Апостроф '",
            "text": "I'm glad. It's a nice day. Don't run. We can't stay. She doesn't know. That's my book. I'll help you. They're here. You're kind.",
            "keys": [
                "'"
            ]
        },
        {
            "id": 19,
            "groupId": "capitals",
            "focus": "Знак ?",
            "text": "What is this? Who is she? Where is the cat? How are you? Is it far? Can you help me? Why is he sad? Do you like it?",
            "keys": [
                "?"
            ]
        },
        {
            "id": 20,
            "groupId": "capitals",
            "focus": "Знак !",
            "text": "Look! Stop! Run fast! Well done! Hello! I can do it! What a nice day! Help me! Hurry up! Good job! Wow!",
            "keys": [
                "!"
            ]
        },
        {
            "id": 21,
            "groupId": "texts",
            "focus": "Корисні слова",
            "text": "apple banana orange pencil window garden friend yellow summer winter animal planet market rabbit monkey"
        },
        {
            "id": 22,
            "groupId": "texts",
            "focus": "Речення",
            "text": "The sun is up. We go to school. My friend has a red bike. I like to read books, and I like to draw."
        },
        {
            "id": 23,
            "groupId": "texts",
            "focus": "Розповідь",
            "text": "I have a little sister. She's six years old. Every morning we walk to school together, and after lessons we play in the yard."
        },
        {
            "id": 24,
            "groupId": "texts",
            "focus": "Підсумковий текст",
            "text": "Typing is a useful skill. Sit straight, keep your wrists relaxed and look at the screen. Don't hurry, it's better to be accurate first. Can you do it? Yes!"
        }
    ],
    intros: {
        "1": {
            "title": "Домашня позиція: вказівні пальці на F та J",
            "lines": [
                "Там маленькі горбики. Великі пальці — над пробілом, решта — поруч."
            ]
        },
        "4": {
            "labels": {
                ";": "крапка з комою (;)"
            },
            "notes": {
                ";": "на домашньому ряду, праворуч від L."
            }
        },
        "11": {
            "labels": {
                ",": "кома (,)"
            },
            "notes": {
                ",": "у нижньому ряду, праворуч від M."
            }
        },
        "13": {
            "labels": {
                ".": "крапка (.)"
            },
            "notes": {
                ".": "у нижньому ряду, праворуч від коми."
            }
        },
        "14": {
            "labels": {
                "/": "скісна риска (/)"
            },
            "notes": {
                "/": "у нижньому ряду, праворуч від крапки."
            }
        },
        "16": {
            "title": "Великі літери: Shift мізинцем іншої руки",
            "lines": [
                "Літеру лівої руки друкуй з правим Shift. Відпусти Shift і друкуй далі."
            ]
        },
        "17": {
            "title": "Великі літери правої руки: лівий Shift",
            "lines": [
                "Літеру правої руки друкуй з лівим Shift. Відпусти Shift і друкуй далі."
            ]
        },
        "18": {
            "char": "'",
            "label": "апостроф (')",
            "note": "На домашньому ряду, праворуч від крапки з комою (;)."
        },
        "19": {
            "char": "?",
            "label": "знак питання (?)",
            "note": "Це клавіша «/» разом із Shift: утримуй {shift} Shift."
        },
        "20": {
            "char": "!",
            "label": "знак оклику (!)",
            "note": "Це клавіша «1» разом із Shift: утримуй {shift} Shift."
        },
        "21": {
            "title": "Короткі слова: друкуй без поспіху",
            "lines": [
                "Усі літери вже знайомі. Стеж за точністю та плавним ритмом."
            ]
        },
        "22": {
            "title": "Речення: велика літера на початку, крапка в кінці",
            "lines": [
                "Нова думка — нова велика літера. Пробіл — великим пальцем."
            ]
        },
        "23": {
            "title": "Розповідь: усе разом",
            "lines": [
                "Літери, великі літери, коми, апострофи й крапки. Друкуй у своєму темпі."
            ]
        },
        "24": {
            "title": "Підсумковий текст: усе разом",
            "lines": [
                "Тут є й питання, і оклик. Не поспішай, стеж за точністю."
            ]
        }
    }
  };
});
