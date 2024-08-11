document.addEventListener('DOMContentLoaded', function () {
    let timerElement = document.getElementById('timer');
    let seedButton = document.getElementById('seedButton');
    let waterButton = document.getElementById('waterButton');
    let transferButton = document.getElementById('transferButton');
    let mainImage = document.getElementById('mainImage');

    let drops = document.querySelectorAll('.drop');
    let currentDrop = 0;
    let currentStage = 0;
    let timer = null;

    const treeStages = [
        '/static/img/2.svg',
        '/static/img/3.svg',
        '/static/img/4.svg',
        '/static/img/5.svg',
        '/static/img/6.svg',
        '/static/img/7.svg'
    ];

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
                user_id: tg.user.id,
                amount: 1000  // Указываем количество эконов для пополнения
            }),
            success: function(response) {
                if (response.success) {
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
    });

    function startTimer() {
        let timeLeft = 3;
        disableButtons();
        timer = setInterval(function () {
            if (timeLeft <= 0) {
                clearInterval(timer);
                timer = null;
                enableButtons();
                timerElement.textContent = '00:00:00';
            } else {
                timerElement.textContent = `00:00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
                timeLeft--;
            }
        }, 1000);
    }

    function disableButtons() {
        seedButton.disabled = true;
        waterButton.disabled = true;
        seedButton.classList.add('disabled');
        waterButton.classList.add('disabled');
    }

    function enableButtons() {
        seedButton.disabled = false;
        waterButton.disabled = false;
        seedButton.classList.remove('disabled');
        waterButton.classList.remove('disabled');
    }
});
