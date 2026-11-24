/* Віконце — програми сайту itnauka.org, що відкриваються у вікні (iframe, той самий домен). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const R = '../'; // корінь сайту відносно /os/

  const EXTERNAL = [
    // Творчість
    { id: 'drukaryk', name: 'Друкарик', icon: 'type', color: '#7950f2', category: 'creative', url: 'tools/drukaryk/', desc: 'Веселий текстовий редактор' },
    { id: 'penslyk', name: 'Пензлик', icon: 'brush', color: '#fa5252', category: 'creative', url: 'tools/penslyk/', desc: 'Яскравий графічний редактор' },
    { id: 'penslyk_plus', name: 'Пензлик Плюс', icon: 'palette', color: '#e64980', category: 'creative', url: 'tools/penslyk_plus/', desc: 'Графічний редактор з більшими можливостями' },
    { id: 'pixel', name: 'Піксель', icon: 'pixels', color: '#40c057', category: 'creative', url: 'tools/pixel/', desc: 'Піксельний графічний редактор' },
    { id: 'drupenslyk', name: 'Друпензлик', icon: 'layout', color: '#fd7e14', category: 'creative', url: 'tools/drupenslyk/', desc: 'Текстово-графічний редактор' },
    { id: 'komirnyk', name: 'Комірник', icon: 'table', color: '#2f9e44', category: 'creative', url: 'tools/komirnyk/', desc: 'Простий табличний редактор' },
    // Тренажери
    { id: 'mouse_click', name: 'Мишачі перегони', icon: 'mouse', color: '#228be6', category: 'trainers', url: 'services/digital_literacy/mouse_skills/click/', desc: 'Тренажер мишки: клацання' },
    { id: 'mouse103', name: 'Швидка мишача допомога', icon: 'first-aid', color: '#e03131', category: 'trainers', url: 'services/digital_literacy/mouse_skills/mouse103/', desc: 'Тренажер кнопок мишки' },
    { id: 'fireflies', name: 'Спіймай світлячка', icon: 'sparkles', color: '#f59f00', category: 'trainers', url: 'services/digital_literacy/mouse_skills/fireflies/', desc: 'Тренажер мишки: перетягування' },
    { id: 'mouse_keys', name: 'Права чи ліва?', icon: 'mouse-buttons', color: '#1c7ed6', category: 'trainers', url: 'services/digital_literacy/mouse_skills/mouse_keys/', desc: 'Права й ліва кнопки мишки' },
    { id: 'maze', name: 'Чарівний лабіринт', icon: 'maze', color: '#9c36b5', category: 'trainers', url: 'services/digital_literacy/mouse_skills/maze/', desc: 'Тренажер перетягування' },
    { id: 'svitlo', name: 'Рятівники Світла', icon: 'bulb', color: '#fab005', category: 'trainers', url: 'services/digital_literacy/mouse_skills/svitlo/', desc: 'Наведення й натискання мишкою' },
    { id: 'windows_trainer', name: 'Швидкісні вікна', icon: 'window', color: '#15aabf', category: 'trainers', url: 'services/digital_literacy/mouse_skills/windows/', desc: 'Тренажер роботи з вікнами' },
    { id: 'tyts', name: 'Тиць! Перші клавіші', icon: 'keyboard', color: '#5c7cfa', category: 'trainers', url: 'services/digital_literacy/typing_skills/tyts/', desc: 'Перші кроки з клавіатурою' },
    { id: 'key_puzzle', name: 'Клавіатурний пазл', icon: 'puzzle', color: '#0ca678', category: 'trainers', url: 'services/digital_literacy/typing_skills/key_puzzle/', desc: 'Вивчаємо розташування клавіш' },
    { id: 'first_letters', name: 'Перші букви', icon: 'letters', color: '#f76707', category: 'trainers', url: 'services/digital_literacy/typing_skills/first_letters/', desc: 'Складаємо перші слова' },
    { id: 'klavio', name: 'Клавіо', icon: 'keyboard', color: '#4263eb', category: 'trainers', url: 'services/digital_literacy/typing_skills/klavio/', desc: 'Уроки друку на клавіатурі' },
    // Ігри
    { id: 'tangram', name: 'Танграм', icon: 'triangles', color: '#1098ad', category: 'games', url: 'games/tangram/', desc: 'Логічна головоломка з фігур' },
    { id: 'magic_square', name: 'Магічний квадрат', icon: 'magic', color: '#ae3ec9', category: 'games', url: 'games/magic_square/', desc: 'Математична головоломка' },
    { id: 'math_quiz', name: 'Математичні головоломки', icon: 'math', color: '#f08c00', category: 'games', url: 'games/math_quiz/', desc: 'Задачі на кмітливість' },
    { id: 'kids_games', name: 'Логічні ігри', icon: 'gamepad', color: '#fcc419', category: 'games', url: 'kids/', desc: 'Колекція логічних ігор для малечі' },
  ];

  EXTERNAL.forEach((a) => VOS.apps.register({ ...a, url: R + a.url, external: true }));
})();
