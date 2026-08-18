const fs = require('fs');
const path = require('path');

// povod.json создастся в этой же папке (holidays/povod.json)
const FILE_PATH = path.join(__dirname, 'povod.json');
// ALERT.txt создастся уровнем выше — в корне репозитория
const ALERT_PATH = path.join(__dirname, '..', 'ALERT.txt');
const UPDATE_INTERVAL_DAYS = 25;

function formatDate(date) {
    return String(date.getDate()).padStart(2, '0') + '.' +
           String(date.getMonth() + 1).padStart(2, '0') + '.' +
           date.getFullYear();
}

async function run() {
    // 1. Проверяем свежесть данных
    if (fs.existsSync(FILE_PATH)) {
        const stats = fs.statSync(FILE_PATH);
        const daysSinceUpdate = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate < UPDATE_INTERVAL_DAYS && !fs.existsSync(ALERT_PATH)) {
            console.log(`Данные свежие (${daysSinceUpdate.toFixed(1)} дн. назад). Запрос отменен.`);
            return;
        }
    }

    // 2. Даты (вчера -> +6 месяцев)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const future = new Date(now);
    future.setMonth(now.getMonth() + 6);

    const url = `https://htmlweb.ru/json/calendar/daytype?d_from=${formatDate(yesterday)}&d_to=${formatDate(future)}`;
    console.log(`Запрашиваем данные по URL: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        // 3. Ошибка API
        if (data.error) {
            console.error("Ошибка API:", data.error);
            fs.writeFileSync(ALERT_PATH, JSON.stringify(data, null, 2));
            return;
        }

        // 4. Очистка праздников
        const holidaysDict = {};
        if (data.days) {
            data.days.forEach(day => {
                if (day.holidays && day.holidays.length > 0) {
                    let cleanHolidays = [...new Set(day.holidays.filter(h => 
                        !h.includes("Выходной") && !h.includes("каникулы")
                    ))];
                    
                    if (cleanHolidays.length > 0) {
                        const shortDate = day.date.substring(0, 5);
                        holidaysDict[shortDate] = cleanHolidays;
                    }
                }
            });
        }

        // 5. Успех
        fs.writeFileSync(FILE_PATH, JSON.stringify(holidaysDict, null, 2));
        if (fs.existsSync(ALERT_PATH)) {
            fs.unlinkSync(ALERT_PATH);
        }
        console.log("Праздники успешно обновлены в povod.json!");

    } catch (err) {
        console.error("Ошибка:", err);
        fs.writeFileSync(ALERT_PATH, `Network/System Error: ${err.message}`);
    }
}

run();
