// Функция для задержки (защита от анти-фрод систем)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Очистка строки зарплаты
function parseSalary(salaryStr) {
    if (!salaryStr) return 0;
    const numeric = salaryStr.replace(/\s/g, '').match(/\d+/);
    return numeric ? parseInt(numeric[0]) : 0;
}

async function startApplying() {
    // 1. Берем настройки (теперь включая город)
    const settings = await chrome.storage.local.get(['keywords', 'minSalary', 'letter', 'city']);
    
    // ПРОВЕРКА: Если вообще ничего не заполнено — выходим
    if (!settings.keywords && !settings.minSalary && !settings.city) {
        console.log("Бот: Настройки пусты. Заполните хотя бы одно поле в расширении.");
        return;
    }

    // Подготовка данных (делаем их необязательными)
    const keywords = settings.keywords ? settings.keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k) : [];
    const minSalary = parseInt(settings.minSalary) || 0;
    const targetCities = settings.city ? settings.city.toLowerCase().split(',').map(c => c.trim()).filter(c => c) : [];
    const coverLetter = settings.letter || "";

    // 2. Поиск вакансий
    const vacancies = document.querySelectorAll('[data-qa="vacancy-serp__vacancy"]');
    console.log(`Бот: Найдено вакансий на странице: ${vacancies.length}. Начинаю проверку...`);

    for (let vacancy of vacancies) {
        const titleElement = vacancy.querySelector('[data-qa="serp-item__title"]');
        const snippetElement = vacancy.querySelector('[data-qa="vacancy-serp__vacancy_snippet_responsibility"]');
        const salaryElement = vacancy.querySelector('[data-qa="vacancy-serp__vacancy-compensation"]');
        const cityElement = vacancy.querySelector('[data-qa="vacancy-serp__vacancy-address"]');
        const applyBtn = vacancy.querySelector('[data-qa="vacancy-serp__vacancy-reply"]');

        if (!applyBtn || !titleElement) continue;

        const title = titleElement.innerText.toLowerCase();
        const snippet = snippetElement ? snippetElement.innerText.toLowerCase() : "";
        const salaryText = salaryElement ? salaryElement.innerText : "";
        const currentSalary = parseSalary(salaryText);
        const currentCity = cityElement ? cityElement.innerText.toLowerCase() : "";

        // --- ЛОГИКА ВАЛИДАЦИИ ---

        // Проверка ключевых слов: если поле пустое — подходит любая.
        const hasKeyword = keywords.length === 0 || keywords.some(word => title.includes(word) || snippet.includes(word));
        
        // Проверка зарплаты: если 0 или пустая вакансия — ок. Иначе сверяем с минимумом.
        const isSalaryOk = minSalary === 0 || currentSalary === 0 || currentSalary >= minSalary;

        // Проверка нескольких городов: если список пуст — ок. Иначе ищем совпадение хотя бы одного города.
        const isCityOk = targetCities.length === 0 || targetCities.some(city => currentCity.includes(city));

        if (hasKeyword && isSalaryOk && isCityOk) {
            console.log(`✅ Подходит: "${title}" | Город: ${currentCity} | Зарплата: ${salaryText}`);
            
            // Клик "Откликнуться"
            applyBtn.click();
            await sleep(2000); // Даем окну время открыться

            // Поиск поля для письма
            const letterArea = document.querySelector('[data-qa="vacancy-response-letter-form"]');
            if (letterArea && coverLetter) {
                letterArea.value = coverLetter;
                // Важно: имитируем ввод текста для сайта
                letterArea.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(500);
            }

            // Финальная кнопка отправки
            const submitBtn = document.querySelector('[data-qa="vacancy-response-submit-popup"]');
            if (submitBtn) {
                console.log(`Бот: Сопроводительное письмо вставлено для "${title}".`);
                
                // --- РЕАЛЬНАЯ ОТПРАВКА ---
                // Раскомментируй строку ниже, когда будешь готов слать реальные отклики:
                // submitBtn.click(); 
                
                // Закрываем модалку (имитация завершения процесса)
                const closeBtn = document.querySelector('[data-qa="vacancy-response-close-popup"]');
                if (closeBtn) closeBtn.click();
            }
            
            // Рандомная пауза 3-6 сек, чтобы не поймали
            await sleep(Math.floor(Math.random() * 3000) + 3000);
        } else {
            // Пишем причину пропуска для отладки
            let reason = !hasKeyword ? "ключи" : (!isSalaryOk ? "з/п" : "город");
            console.log(`❌ Пропуск: ${title} (причина: ${reason})`);
        }
    }
    console.log("Бот: Обработка страницы завершена.");
}

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplying);
} else {
    startApplying();
}