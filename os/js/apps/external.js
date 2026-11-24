/* Віконце — програми сайту itnauka.org, що відкриваються у вікні (iframe, той самий домен). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const R = '../'; // корінь сайту відносно /os/

  const EXTERNAL = [
    // Творчість
    { id: 'drukaryk', name: 'Друкарик', icon: 'type', color: '#7950f2', category: 'write', url: 'tools/drukaryk/', desc: tr('Веселий текстовий редактор') },
    { id: 'penslyk', name: 'Пензлик', icon: 'brush', color: '#fa5252', category: 'draw', url: 'tools/penslyk/', desc: tr('Яскравий графічний редактор') },
    { id: 'penslyk_plus', name: 'Пензлик Плюс', icon: 'palette', color: '#e64980', category: 'draw', url: 'tools/penslyk_plus/', desc: tr('Графічний редактор з більшими можливостями') },
    { id: 'pixel', name: 'Піксель', icon: 'pixels', color: '#40c057', category: 'draw', url: 'tools/pixel/', desc: tr('Піксельний графічний редактор') },
    { id: 'drupenslyk', name: 'Друпензлик', icon: 'layout', color: '#fd7e14', category: 'write', url: 'tools/drupenslyk/', desc: tr('Текстово-графічний редактор') },
    { id: 'komirnyk', name: 'Комірник', icon: 'table', color: '#2f9e44', category: 'think', url: 'tools/komirnyk/', desc: tr('Простий табличний редактор') },
    // Тренажери
    { id: 'mouse_click', name: 'Мишачі перегони', icon: 'mouse', color: '#228be6', category: 'mouse', url: 'services/digital_literacy/mouse_skills/click/', desc: tr('Тренажер мишки: клацання') },
    { id: 'mouse103', name: 'Швидка мишача допомога', icon: 'first-aid', color: '#e03131', category: 'mouse', url: 'services/digital_literacy/mouse_skills/mouse103/', desc: tr('Тренажер кнопок мишки') },
    { id: 'fireflies', name: 'Спіймай світлячка', icon: 'sparkles', color: '#f59f00', category: 'mouse', url: 'services/digital_literacy/mouse_skills/fireflies/', desc: tr('Тренажер мишки: перетягування') },
    { id: 'mouse_keys', name: 'Права чи ліва?', icon: 'mouse-buttons', color: '#1c7ed6', category: 'mouse', url: 'services/digital_literacy/mouse_skills/mouse_keys/', desc: tr('Права й ліва кнопки мишки') },
    { id: 'maze', name: 'Чарівний лабіринт', icon: 'maze', color: '#9c36b5', category: 'mouse', url: 'services/digital_literacy/mouse_skills/maze/', desc: tr('Тренажер перетягування') },
    { id: 'svitlo', name: 'Рятівники Світла', icon: 'bulb', color: '#fab005', category: 'mouse', url: 'services/digital_literacy/mouse_skills/svitlo/', desc: tr('Наведення й натискання мишкою') },
    { id: 'windows_trainer', name: 'Швидкісні вікна', icon: 'window', color: '#15aabf', category: 'mouse', url: 'services/digital_literacy/mouse_skills/windows/', desc: tr('Тренажер роботи з вікнами') },
    { id: 'tyts', name: 'Тиць! Перші клавіші', icon: 'keyboard', color: '#5c7cfa', category: 'typing', url: 'services/digital_literacy/typing_skills/tyts/', desc: tr('Перші кроки з клавіатурою') },
    { id: 'key_puzzle', name: 'Клавіатурний пазл', icon: 'puzzle', color: '#0ca678', category: 'typing', url: 'services/digital_literacy/typing_skills/key_puzzle/', desc: tr('Вивчаємо розташування клавіш') },
    { id: 'first_letters', name: 'Перші букви', icon: 'letters', color: '#f76707', category: 'typing', url: 'services/digital_literacy/typing_skills/first_letters/', desc: tr('Складаємо перші слова') },
    { id: 'klavio', name: 'Клавіо', icon: 'keyboard', color: '#4263eb', category: 'typing', url: 'services/digital_literacy/typing_skills/klavio/', desc: tr('Уроки друку на клавіатурі') },
    // Ігри
    { id: 'tangram', name: 'Танграм', icon: 'triangles', color: '#1098ad', category: 'games', url: 'games/tangram/', desc: tr('Логічна головоломка з фігур') },
    { id: 'magic_square', name: 'Магічний квадрат', icon: 'magic', color: '#ae3ec9', category: 'games', url: 'games/magic_square/', desc: tr('Математична головоломка') },
    { id: 'math_quiz', name: 'Математичні головоломки', icon: 'math', color: '#f08c00', category: 'games', url: 'games/math_quiz/', desc: tr('Задачі на кмітливість') },
    { id: 'kids_games', name: 'Логічні ігри', icon: 'gamepad', color: '#fcc419', category: 'games', url: 'kids/', desc: tr('Колекція логічних ігор для малечі') },
  ];

  EXTERNAL.forEach((a) => VOS.apps.register({ ...a, url: R + a.url, external: true }));
})();
