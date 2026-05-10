export function renderNav({ navContainer, bookSections, sectionKeys, currentIndex, onSelect }) {
  navContainer.innerHTML = '';

  sectionKeys.forEach((key, index) => {
    const isActive = index === currentIndex;

    const btn = document.createElement('button');
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    btn.className = 'nav-btn' + (isActive ? ' nav-btn--active' : '');

    const label = document.createElement('span');
    label.textContent = bookSections[key].title;
    btn.appendChild(label);

    if (isActive) {
      const dot = document.createElement('div');
      dot.className = 'nav-btn__dot';
      btn.appendChild(dot);
    }

    btn.addEventListener('click', () => onSelect(index));
    navContainer.appendChild(btn);
  });
}
