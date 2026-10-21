// Explain storage availability only in the adult section.
(() => {const status=document.getElementById('storageStatus');if(status)status.textContent=ProgressStore.isPersistent?'Збереження у цьому браузері доступне.':'Браузер заборонив збереження. Прогрес і роботи тимчасові й можуть зникнути після перезавантаження.';})();
