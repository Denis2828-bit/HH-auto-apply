// Функция для задержки (чтобы не забанили)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Функция очистки строки зарплаты и превращения её в число
function parseSalary(salaryStr) {
    if (!salaryStr) return 0;
    // Оставляем только цифры
    const numeric = salaryStr.replace(/\s/g, '').match(/\d+/);
    return numeric ? parseInt(numeric[0]) : 0;
}

async function startApplying() {
    // 1. Берем настройки из памяти браузера
    const settings = await chrome.storage.local.get(['keywords', 'minSalary', 'letter']);
    if (!settings.keywords || !settings.letter) {
        console.log("Бот: Настройки не заполнены.");
        return;
    }

    const keywords = settings.keywords.toLowerCase().split(',').map(k => k.trim());
    const minSalary = parseInt(settings.minSalary) || 0;

    // 2. Ищем все карточки вакансий на странице
    const vacancies = document.querySelectorAll('[data-qa="vacancy-serp__vacancy"]');
    console.log(`Бот: Найдено вакансий на странице: ${vacancies.length}`);

    for (let vacancy of vacancies) {
        // Извлекаем данные из карточки
        const titleElement = vacancy.querySelector('[data-qa="serp-item__title"]');
        const snippetElement = vacancy.querySelector('[data-qa="vacancy-serp__vacancy_snippet_responsibility"]');
        const salaryElement = vacancy.querySelector('[data-qa="vacancy-serp__vacancy-compensation"]');
        const applyBtn = vacancy.querySelector('[data-qa="vacancy-serp__vacancy-reply"]');

        if (!applyBtn || !titleElement) continue;

        const title = titleElement.innerText.toLowerCase();
        const snippet = snippetElement ? snippetElement.innerText.toLowerCase() : "";
        const salaryText = salaryElement ? salaryElement.innerText : "";
        const currentSalary = parseSalary(salaryText);

        // 3. ПРОВЕРКА ВАЛИДНОСТИ
        // Проверяем ключевые слова в заголовке И в коротком описании
        const hasKeyword = keywords.some(word => title.includes(word) || snippet.includes(word));
        
        // Проверяем зарплату (если указана и меньше минимума - пропускаем)
        const isSalaryOk = currentSalary === 0 || currentSalary >= minSalary;

        if (hasKeyword && isSalaryOk) {
            console.log(`✅ Подходит: ${title}. Зарплата: ${salaryText}. Откликаюсь...`);
            
            // Кликаем "Откликнуться"
            applyBtn.click();

            // Ждем появления модального окна
            await sleep(1500);

            // Ищем поле для сопроводительного письма
            const letterArea = document.querySelector('[data-qa="vacancy-response-letter-form"]');
            if (letterArea) {
                letterArea.value = settings.letter;
                letterArea.dispatchEvent(new Event('input', { bubbles: true }));
                
                await sleep(500);
                
                // Ищем кнопку отправить
                const submitBtn = document.querySelector('[data-qa="vacancy-response-submit-popup"]');
                if (submitBtn) {
                    // submitBtn.click(); // РАСКОММЕНТИРОВАТЬ ДЛЯ РЕАЛЬНОЙ РАБОТЫ
                    console.log("Письмо вставлено, кнопка нажата (эмуляция)");
                    
                    // Закрываем окно, если оно не закрылось само (бывает кнопка "Закрыть")
                    const closeBtn = document.querySelector('[data-qa="vacancy-response-close-popup"]');
                    if (closeBtn) closeBtn.click();
                }
            }
            
            // Рандомная пауза между откликами 3-7 секунд
            await sleep(Math.floor(Math.random() * 4000) + 3000);
        } else {
            console.log(`❌ Пропуск: ${title}. Причина: не подходит по ключам или з/п.`);
        }
    }
    console.log("Бот: Страница обработана.");
}

// Запуск скрипта
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplying);
} else {
    startApplying();
}