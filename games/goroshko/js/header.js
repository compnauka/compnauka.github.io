/**
 * Універсальний модуль для керування хедером та профілем користувача
 */

import { authManager } from './auth.js';

function selectHeaderElements() {
  const accountLink = document.getElementById('accountLink');
  return {
    userProfile: document.getElementById('userProfile'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    accountLink,
    accountLinkHideForGuests: accountLink ? accountLink.classList.contains('hidden') : false
  };
}

function renderUser(elements, user) {
  if (!elements.userProfile) return;
  const hideAccountForGuests = Boolean(elements.accountLinkHideForGuests);

  if (user) {
    if (elements.userAvatar) {
      elements.userAvatar.textContent = user.photoURL ? '🛡️' : '👾';
    }

    if (elements.userName) {
      elements.userName.textContent = authManager.getUserDisplayName();
    }

    elements.userProfile.classList.remove('hidden');

    if (elements.loginBtn) {
      elements.loginBtn.classList.add('hidden');
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.classList.remove('hidden');
    }

    if (elements.accountLink) {
      elements.accountLink.classList.remove('hidden');
    }
  } else {
    if (elements.userProfile) {
      elements.userProfile.classList.add('hidden');
    }

    if (elements.loginBtn) {
      elements.loginBtn.classList.remove('hidden');
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.classList.add('hidden');
    }

    if (elements.accountLink && hideAccountForGuests) {
      elements.accountLink.classList.add('hidden');
    }
  }
}

export function initHeader() {
  const elements = selectHeaderElements();

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', () => {
      window.location.href = 'auth.html';
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async () => {
      const result = await authManager.logout();
      if (result.success) {
        window.location.reload();
      }
    });
  }

  authManager.onAuthChange((user) => renderUser(elements, user));
  if (typeof authManager.getCurrentUser === 'function') {
    renderUser(elements, authManager.getCurrentUser());
  }

  return { elements };
}
