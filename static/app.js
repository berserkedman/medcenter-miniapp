// ============================================
// МЕДЦЕНТР - JAVASCRIPT (БЕЗ ПЛАТЕЖЕЙ ПОКА)
// Telegram Mini App Logic
// ============================================

const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Данные пользователя
const user = tg.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Тест',
    username: 'testuser'
};

// Услуги
const SERVICES = [
    {
        id: 1,
        name: 'Первичная консультация',
        description: 'Осмотр и диагностика состояния',
        duration: 60,
        price: 2000
    },
    {
        id: 2,
        name: 'Мануальная терапия',
        description: 'Коррекция позвоночника и суставов',
        duration: 45,
        price: 3000
    },
    {
        id: 3,
        name: 'Массаж лечебный',
        description: 'Лечебный массаж проблемных зон',
        duration: 60,
        price: 2500
    },
    {
        id: 4,
        name: 'Комплексная процедура',
        description: 'Диагностика + мануальная терапия',
        duration: 90,
        price: 4500
    }
];

// Данные записи
let bookingData = {
    serviceId: null,
    date: null,
    time: null
};

// Симуляция базы данных (LocalStorage)
function saveBooking(booking) {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    booking.id = Date.now();
    booking.userId = user.id;
    booking.status = 'pending';
    booking.createdAt = new Date().toISOString();
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return booking.id;
}

function getMyBookings() {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    return bookings.filter(b => b.userId === user.id);
}

function getAllBookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
}

// ============================================
// ГЛАВНАЯ СТРАНИЦА
// ============================================

function contactDoctor() {
    tg.close();
}

// ============================================
// СТРАНИЦА УСЛУГ
// ============================================

function loadServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;

    container.innerHTML = SERVICES.map(service => `
        <div class="service-card">
            <div class="service-header">
                <div class="service-name">${service.name}</div>
                <div class="service-price">${service.price} ₽</div>
            </div>
            <div class="service-description">${service.description}</div>
            <div class="service-duration">⏱️ ${service.duration} минут</div>
        </div>
    `).join('');
}

// ============================================
// СТРАНИЦА ЗАПИСИ
// ============================================

function loadServicesForBooking() {
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    container.innerHTML = SERVICES.map(service => `
        <div class="service-option" data-service-id="${service.id}" onclick="selectService(${service.id})">
            <div class="service-header">
                <div class="service-name">${service.name}</div>
                <div class="service-price">${service.price} ₽</div>
            </div>
            <div class="service-duration">⏱️ ${service.duration} мин</div>
        </div>
    `).join('');
}

function selectService(serviceId) {
    bookingData.serviceId = serviceId;
    
    document.querySelectorAll('.service-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    document.querySelector(`[data-service-id="${serviceId}"]`).classList.add('selected');
}

function setMinDate() {
    const dateInput = document.getElementById('bookingDate');
    if (!dateInput) return;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const minDate = tomorrow.toISOString().split('T')[0];
    dateInput.min = minDate;
    dateInput.value = minDate;
    bookingData.date = minDate;
}

function loadTimeSlots() {
    const dateInput = document.getElementById('bookingDate');
    if (!dateInput || !dateInput.value) {
        alert('Выберите дату');
        return;
    }
    
    bookingData.date = dateInput.value;
    
    const container = document.getElementById('timeSlots');
    if (!container) return;
    
    // Генерируем слоты с 9:00 до 20:00
    const slots = [];
    for (let hour = 9; hour < 20; hour++) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
        if (hour < 19) {
            slots.push(`${String(hour).padStart(2, '0')}:30`);
        }
    }
    
    container.innerHTML = slots.map(time => `
        <div class="time-slot" onclick="selectTime('${time}')">
            ${time}
        </div>
    `).join('');
    
    nextStep(3);
}

function selectTime(time) {
    bookingData.time = time;
    
    document.querySelectorAll('.time-slot').forEach(el => {
        el.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
}

function nextStep(stepNum) {
    if (stepNum === 2 && !bookingData.serviceId) {
        alert('Выберите услугу');
        return;
    }
    
    if (stepNum === 3 && !bookingData.date) {
        alert('Выберите дату');
        return;
    }
    
    if (stepNum === 4 && !bookingData.time) {
        alert('Выберите время');
        return;
    }
    
    if (stepNum === 4) {
        showBookingSummary();
    }
    
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNum}`).classList.add('active');
}

function prevStep(stepNum) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${stepNum}`).classList.add('active');
}

function showBookingSummary() {
    const container = document.getElementById('bookingSummary');
    if (!container) return;
    
    const service = SERVICES.find(s => s.id === bookingData.serviceId);
    if (!service) return;
    
    const dateObj = new Date(bookingData.date);
    const dateStr = dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    container.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Услуга:</span>
            <span class="summary-value">${service.name}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Дата:</span>
            <span class="summary-value">${dateStr}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Время:</span>
            <span class="summary-value">${bookingData.time}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Длительность:</span>
            <span class="summary-value">${service.duration} минут</span>
        </div>
        <div class="summary-row summary-total">
            <span class="summary-label">Стоимость:</span>
            <span class="summary-value">${service.price} ₽</span>
        </div>
        <div style="margin-top: 16px; padding: 12px; background: #FFF3E0; border-radius: 8px; font-size: 13px; color: #F57C00;">
            💡 Оплата наличными на месте
        </div>
    `;
}

// Отправка формы
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const service = SERVICES.find(s => s.id === bookingData.serviceId);
    
    // Сохраняем запись
    const booking = {
        serviceId: bookingData.serviceId,
        serviceName: service.name,
        date: bookingData.date,
        time: bookingData.time,
        price: service.price,
        userName: user.first_name,
        userUsername: user.username
    };
    
    const bookingId = saveBooking(booking);
    
    // Уведомление
    tg.showAlert(`✅ Запись создана!\n\nУслуга: ${service.name}\nДата: ${bookingData.date}\nВремя: ${bookingData.time}\n\n💰 Оплата: ${service.price} ₽ наличными на месте\n\nНомер записи: #${bookingId}`);
    
    // Отправляем уведомление боту (если подключён)
    tg.sendData(JSON.stringify({
        action: 'new_booking',
        booking: booking
    }));
    
    setTimeout(() => {
        window.location.href = 'my-bookings.html';
    }, 1000);
});

// ============================================
// МОИ ЗАПИСИ
// ============================================

function loadMyBookings() {
    const container = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    
    const bookings = getMyBookings();
    
    if (bookings.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.innerHTML = bookings.reverse().map(booking => `
        <div class="booking-card">
            <span class="booking-status status-${booking.status}">
                ${booking.status === 'pending' ? '⏳ Ожидает' : '✅ Подтверждена'}
            </span>
            <div class="booking-info">
                <div class="booking-info-row">
                    <span>Услуга:</span>
                    <strong>${booking.serviceName}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Дата:</span>
                    <strong>${new Date(booking.date).toLocaleDateString('ru-RU')}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Время:</span>
                    <strong>${booking.time}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Стоимость:</span>
                    <strong>${booking.price} ₽</strong>
                </div>
                <div class="booking-info-row">
                    <span>Оплата:</span>
                    <strong>💵 Наличными</strong>
                </div>
            </div>
            <div class="booking-actions">
                <button class="btn btn-secondary" onclick="cancelBooking(${booking.id})">
                    Отменить
                </button>
            </div>
        </div>
    `).join('');
    
    emptyState.style.display = 'none';
}

function cancelBooking(bookingId) {
    if (!confirm('Отменить запись?')) return;
    
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    tg.showAlert('Запись отменена');
    loadMyBookings();
}

// ============================================
// АДМИН-ПАНЕЛЬ
// ============================================

function checkAdminAccess() {
    // Проверка прав (пока все могут)
    console.log('Admin access granted');
}

function loadAdminData() {
    const bookings = getAllBookings();
    
    // Статистика
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.date === today);
    
    document.getElementById('todayBookings').textContent = todayBookings.length;
    document.getElementById('weekBookings').textContent = bookings.length;
    
    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString() + ' ₽';
    
    // Список записей
    const container = document.getElementById('adminBookings');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Пока нет записей</p></div>';
        return;
    }
    
    container.innerHTML = bookings.reverse().map(booking => `
        <div class="booking-card">
            <span class="booking-status status-${booking.status}">
                ${booking.status === 'pending' ? '⏳ Ожидает' : '✅ Подтверждена'}
            </span>
            <div class="booking-info">
                <div class="booking-info-row">
                    <span>Пациент:</span>
                    <strong>${booking.userName} (@${booking.userUsername})</strong>
                </div>
                <div class="booking-info-row">
                    <span>Услуга:</span>
                    <strong>${booking.serviceName}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Дата:</span>
                    <strong>${new Date(booking.date).toLocaleDateString('ru-RU')}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Время:</span>
                    <strong>${booking.time}</strong>
                </div>
                <div class="booking-info-row">
                    <span>Сумма:</span>
                    <strong>${booking.price} ₽</strong>
                </div>
            </div>
        </div>
    `).join('');
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
    });
    event.target.classList.add('active');
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

tg.setHeaderColor('bg_color');
tg.setBackgroundColor('bg_color');

tg.BackButton.onClick(() => {
    window.history.back();
});

if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
    tg.BackButton.show();
}

console.log('✅ Медцентр Mini App загружен');
console.log('👤 Пользователь:', user);

