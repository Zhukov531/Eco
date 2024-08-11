document.addEventListener('DOMContentLoaded', function () {
    // Объявление переменных внутри обработчика
    let timerElement = document.getElementById('timer');
    let seedButton = document.getElementById('seedButton'); 
    let waterButton = document.getElementById('waterButton');
    let transferButton = document.getElementById('transferButton');
    let mainImage = document.getElementById('mainImage');
    let drops = document.querySelectorAll('.drop');
    let currentDrop = 0;
    let currentStage = 0;
    let timer = null;

    // Массив изображений для различных стадий дерева
    const treeStages = [
        '/static/img/2.svg',
        '/static/img/3.svg',
        '/static/img/4.svg',
        '/static/img/5.svg',
        '/static/img/6.svg',
        '/static/img/7.svg'
    ];

    // Показать всплывающее окно при загрузке страницы
    document.getElementById('languagePopup').style.display = 'flex';

    // Обработчик клика для закрытия попапа
    document.getElementById('closeLanguagePopup').addEventListener('click', function () {
        document.getElementById('languagePopup').style.display = 'none';
    });

    // Обработчики кликов для выбора языка
    document.getElementById('langRu').addEventListener('click', function () {
        document.getElementById('languagePopup').style.display = 'none';
        // Добавьте логику для русского языка
    });

    document.getElementById('langEn').addEventListener('click', function () {
        document.getElementById('languagePopup').style.display = 'none';
        // Добавьте логику для английского языка
    });

    // Получение данных от сервера
    let tg = Telegram.WebApp.initDataUnsafe || 0;

    $.ajax({
        url: '/user',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            user_id: tg.user.id,
        }),
        success: function(response) {
            if (response) {
                currentDrop = response.drop;
                currentStage = response.tree;

                console.log('Данные о состоянии успешно получены', currentDrop, currentStage);
                
                // Применяем текущие значения
                updateTreeState();
            } else {
                console.log('Ошибка при получении данных о состоянии');
            }
        },
        error: function() {
            console.log('Ошибка при отправке данных на сервер');
        }
    });

    function updateTreeState() {
        if (currentStage < treeStages.length) {
            mainImage.src = treeStages[currentStage];
        }
    }

    // Обработчик клика по кнопке семечка
    seedButton.addEventListener('click', function () {
        if (!timer && currentStage < treeStages.length) {
            mainImage.src = treeStages[currentStage]; // Меняем основное изображение на следующее
            currentStage++;
            seedButton.style.display = 'none'; // Скрыть кнопку семечка
            waterButton.style.display = 'block'; // Показать кнопку воды
            document.querySelector('.manag-text p').textContent = 'Полейте ваше дерево';
            startTimer();
        }
    });

    // Обработчик клика по кнопке капли
    waterButton.addEventListener('click', function () {
        if (!timer && currentStage < treeStages.length) {
            mainImage.src = treeStages[currentStage]; // Обновляем изображение дерева
            drops[currentDrop].src = '/static/img/bluedrop.svg';
            currentDrop++;
            currentStage++;
            if (currentStage >= treeStages.length) {
                waterButton.style.display = 'none'; // Скрыть кнопку капли
                transferButton.style.display = 'block'; // Показать кнопку передачи
                document.querySelector('.manag-text p').textContent = 'Отправьте дерево в заповедник';
                timerElement.textContent = 'Дерево выросло'; // Обновляем текст таймера
            } else {
                document.querySelector('.manag-text p').textContent = 'До следующего полива';
                startTimer();
            }
        }
    });

    // Обработчик клика по кнопке recycle
    transferButton.addEventListener('click', function () {
        currentDrop = 0;
        currentStage = 0;
        mainImage.src = '/static/img/1.svg'; // Возвращаем основное изображение на первую стадию
        seedButton.style.display = 'block'; // Показываем кнопку семечка
        waterButton.style.display = 'none'; // Скрываем кнопку воды
        transferButton.style.display = 'none'; // Скрываем кнопку recycle
        drops.forEach(drop => drop.src = '/static/img/whitedrop.svg');
        document.querySelector('.manag-text p').textContent = 'Посадите дерево';
        timerElement.textContent = '00:00:00'; // Сбрасываем текст таймера

        $.ajax({
            url: '/add-eco',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: tg.user.id,  // Подставляем user_id пользователя
                amount: 1000  // Указываем количество эконов для пополнения
            }),
            success: function(response) {
                if (response.success) {
                    // Обновляем баланс эконов на странице
                    document.getElementById('ecoAmount').textContent = response.new_balance;
                    console.log('Баланс успешно обновлён');
                } else {
                    console.log('Ошибка при пополнении эконов');
                }
            },
            error: function() {
                console.log('Ошибка при отправке запроса на сервер');
            }
        });

        // Добавление токенов eco
        let ecoElement = document.getElementById('eco'); // Получаем элемент с количеством токенов ECO
        let currentEco = parseInt(ecoElement.textContent); // Получаем текущее количество токенов ECO
        let newEco = currentEco + 1000; // Добавляем 1000 токенов ECO
        ecoElement.textContent = newEco; // Обновляем текст с количеством токенов ECO
    });

    // Функция запуска таймера
    function startTimer() {
        let timeLeft = 3; // Установить таймер на 3 секунды
        disableButtons(); // Заблокировать кнопки
        timer = setInterval(function () {
            if (timeLeft <= 0) {
                clearInterval(timer);
                timer = null;
                enableButtons(); // Разблокировать кнопки
                timerElement.textContent = '00:00:00';
            } else {
                let seconds = timeLeft % 60;
                timerElement.textContent = `00:00:${seconds < 10 ? '0' + seconds : seconds}`;
                timeLeft--;
            }
        }, 1000);
    }

    // Функция блокировки кнопок
    function disableButtons() {
        seedButton.disabled = true;
        waterButton.disabled = true;
        seedButton.classList.add('disabled');
        waterButton.classList.add('disabled');
    }

    // Функция разблокировки кнопок
    function enableButtons() {
        seedButton.disabled = false;
        waterButton.disabled = false;
        seedButton.classList.remove('disabled');
        waterButton.classList.remove('disabled');

        if (currentDrop >= drops.length) {
            document.querySelector('.manag-text p').textContent = 'Отправьте дерево в заповедник';
        } else {
            document.querySelector('.manag-text p').textContent = 'Полейте ваше дерево';
        }
    }

    // Функция для отображения следующего слайда
    function showNextSlide(slideNumber) {
        // Скрыть все слайды
        const slides = document.querySelectorAll('.guide-slide');
        slides.forEach(slide => {
            slide.style.display = 'none';
        });

        // Показать слайд с указанным номером
        const currentSlide = document.getElementById('slide' + slideNumber);
        currentSlide.style.display = 'block';
    }

    // Функция для закрытия гида
    function closeGuide() {
        const overlay = document.getElementById('overlayGuide');
        overlay.style.display = 'none';
    }

    // Инициализация первого слайда
    showNextSlide(1);

    document.querySelector('.info_head').addEventListener('click', function() {
        document.getElementById('infoOverlay').style.display = 'flex';
    });

    document.getElementById('infoCloseBtn').addEventListener('click', function() {
        document.getElementById('infoOverlay').style.display = 'none';
    });

    document.getElementById('infoOverlay').addEventListener('click', function(event) {
        if (event.target === this) {
            document.getElementById('infoOverlay').style.display = 'none';
        }
    });

    document.querySelector('.rait-top').addEventListener('click', function(event) {
        event.preventDefault(); // Предотвращаем переход по ссылке
        document.getElementById('stataOverlay').style.display = 'flex';
    });

    document.querySelector('.stata').addEventListener('click', function(event) {
        if (event.target === this) {
            document.getElementById('stataOverlay').style.display = 'none';
        }
    });

    document.querySelector('.stata__close').addEventListener('click', function() {
        document.getElementById('stataOverlay').style.display = 'none';
    });
});


