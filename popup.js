// При открытии окна загружаем ранее сохраненные данные
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['keywords', 'minSalary', 'letter'], (result) => {
    if (result.keywords) document.getElementById('keywords').value = result.keywords;
    if (result.minSalary) document.getElementById('minSalary').value = result.minSalary;
    if (result.letter) document.getElementById('coverLetter').value = result.letter;
  });
});

// Сохраняем данные при нажатии на кнопку
document.getElementById('saveBtn').onclick = () => {
  const keywords = document.getElementById('keywords').value;
  const minSalary = document.getElementById('minSalary').value;
  const letter = document.getElementById('coverLetter').value;

  chrome.storage.local.set({
    keywords: keywords,
    minSalary: minSalary,
    letter: letter
  }, () => {
    const status = document.getElementById('statusMsg');
    status.innerText = "Настройки сохранены! Обновите страницу HH.";
    status.style.color = "green";
    
    // Закрываем окно через 1.5 секунды
    setTimeout(() => window.close(), 1500);
  });
};