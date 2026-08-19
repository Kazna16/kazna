let transactions = JSON.parse(localStorage.getItem('kazna_transactions')) || [];
let goals = JSON.parse(localStorage.getItem('kazna_goals')) || [];
let shifts = JSON.parse(localStorage.getItem('kazna_shifts')) || [];
let envelopes = JSON.parse(localStorage.getItem('kazna_envelopes')) || [];
let subscriptions = JSON.parse(localStorage.getItem('kazna_subscriptions')) || [];
let debts = JSON.parse(localStorage.getItem('kazna_debts')) || [];
let events = JSON.parse(localStorage.getItem('kazna_events')) || [];
let wishlist = JSON.parse(localStorage.getItem('kazna_wishlist')) || [];
let investments = JSON.parse(localStorage.getItem('kazna_investments')) || [];
let currentType = 'income';
let currentGoalId = null;
let editingTransactionId = null;
let notificationsEnabled = JSON.parse(localStorage.getItem('kazna_notifications')) || false;
let currentDebtType = 'to-me';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let shiftMonth = new Date().getMonth();
let shiftYear = new Date().getFullYear();

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const chartColors = [
  '#f5c518', '#4caf50', '#f44336', '#2196f3', '#ff9800',
  '#9c27b0', '#00bcd4', '#ff5722', '#8bc34a', '#e91e63'
];

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionList = document.getElementById('transaction-list');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');
const commentInput = document.getElementById('comment');
const dateInput = document.getElementById('transaction-date');

function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(`screen-${screenName}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`nav-${screenName}`).classList.add('active');
  if (screenName === 'goals') renderGoals();
  if (screenName === 'shifts') {
    renderShifts();
    renderCalendar();
  }
  if (screenName === 'stats') {
    updateMonthDisplay();
    renderStats();
  }
  if (screenName === 'settings') {
    updateNotificationButton();
  }
  if (screenName === 'envelopes') renderEnvelopes();
  if (screenName === 'subscriptions') renderSubscriptions();
  if (screenName === 'debts') renderDebts();
  if (screenName === 'events') renderEvents();
  if (screenName === 'wishlist') renderWishlist();
  if (screenName === 'investments') renderInvestments();
}

function openForm(type) {
  currentType = type;
  editingTransactionId = null;
  modalTitle.textContent = type === 'income' ? 'Добавить доход' : 'Добавить расход';
  amountInput.value = '';
  noteInput.value = '';
  commentInput.value = '';
  categoryInput.value = type === 'income' ? 'Зарплата' : 'Еда';
  dateInput.value = new Date().toISOString().split('T')[0];
  modal.classList.add('active');
}

function closeForm() {
  modal.classList.remove('active');
  editingTransactionId = null;
}

function addTransaction() {
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value || category;
  const comment = commentInput.value;
  const date = dateInput.value;
  if (!amount || amount <= 0) {
    alert('Введи сумму!');
    return;
  }
  const transactionDate = date ? new Date(date) : new Date();
  if (editingTransactionId) {
    const index = transactions.findIndex(t => t.id === editingTransactionId);
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        amount: amount,
        type: currentType,
        category: category,
        note: note,
        comment: comment,
        month: transactionDate.getMonth(),
        year: transactionDate.getFullYear(),
        date: transactionDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
      };
    }
  } else {
    const transaction = {
      id: Date.now(),
      amount: amount,
      type: currentType,
      category: category,
      note: note,
      comment: comment,
      month: transactionDate.getMonth(),
      year: transactionDate.getFullYear(),
      date: transactionDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    };
    transactions.unshift(transaction);
  }
  saveTransactions();
  updateUI();
  closeForm();
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;
  editingTransactionId = id;
  currentType = transaction.type;
  modalTitle.textContent = transaction.type === 'income' ? 'Редактировать доход' : 'Редактировать расход';
  amountInput.value = transaction.amount;
  categoryInput.value = transaction.category;
  noteInput.value = transaction.note;
  commentInput.value = transaction.comment || '';
  const dateObj = new Date(transaction.year, transaction.month, 1);
  dateInput.value = dateObj.toISOString().split('T')[0];
  modal.classList.add('active');
}

function deleteTransaction(id) {
  if (confirm('Удалить операцию?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
  }
}

function openGoalForm() {
  document.getElementById('goal-modal').classList.add('active');
  document.getElementById('goal-name').value = '';
  document.getElementById('goal-target').value = '';
  document.getElementById('goal-deadline').value = '';
}

function closeGoalForm() {
  document.getElementById('goal-modal').classList.remove('active');
}

function addGoal() {
  const name = document.getElementById('goal-name').value;
  const target = parseFloat(document.getElementById('goal-target').value);
  const deadline = document.getElementById('goal-deadline').value;
  if (!name || !target || target <= 0) {
    alert('Введи название и сумму цели!');
    return;
  }
  const goal = {
    id: Date.now(),
    name: name,
    target: target,
    current: 0,
    deadline: deadline || null
  };
  goals.unshift(goal);
  saveGoals();
  renderGoals();
  closeGoalForm();
}

function openGoalAddForm(id) {
  currentGoalId = id;
  const goal = goals.find(g => g.id === id);
  document.getElementById('goal-add-title').textContent = goal.name;
  document.getElementById('goal-add-amount').value = '';
  document.getElementById('goal-add-modal').classList.add('active');
}

function closeGoalAddForm() {
  document.getElementById('goal-add-modal').classList.remove('active');
  currentGoalId = null;
}

function addToGoal() {
  const amount = parseFloat(document.getElementById('goal-add-amount').value);
  const goal = goals.find(g => g.id === currentGoalId);
  if (!amount || amount <= 0) {
    alert('Введи сумму!');
    return;
  }
  goal.current += amount;
  saveGoals();
  renderGoals();
  closeGoalAddForm();
}

function deleteGoal(id) {
  if (confirm('Удалить цель?')) {
    goals = goals.filter(g => g.id !== id);
    saveGoals();
    renderGoals();
  }
}

function renderGoals() {
  const goalsList = document.getElementById('goals-list');
  if (goals.length === 0) {
    goalsList.innerHTML = '<div class="empty-message">Пока нет целей. Создай первую!</div>';
    return;
  }
  goalsList.innerHTML = '';
  goals.forEach(goal => {
    const percent = Math.min(100, (goal.current / goal.target) * 100);
    const remaining = goal.target - goal.current;
    const card = document.createElement('div');
    card.className = 'goal-card';
    card.innerHTML = `
      <div class="goal-card-header">
        <span class="goal-card-title">${goal.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="goal-card-amount">${goal.current.toLocaleString('ru-RU')} / ${goal.target.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteGoal(${goal.id})">✕</button>
        </div>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="goal-card-footer">
        <span class="goal-percent">${percent.toFixed(0)}% • осталось ${remaining.toLocaleString('ru-RU')} ₽${goal.deadline ? ' • до ' + new Date(goal.deadline).toLocaleDateString('ru-RU') : ''}</span>
        <button class="btn-add-to-goal" onclick="openGoalAddForm(${goal.id})">+</button>
      </div>
    `;
    goalsList.appendChild(card);
  });
}
function changeShiftMonth(delta) {
  shiftMonth += delta;
  if (shiftMonth > 11) {
    shiftMonth = 0;
    shiftYear++;
  }
  if (shiftMonth < 0) {
    shiftMonth = 11;
    shiftYear--;
  }
  renderCalendar();
}

function renderCalendar() {
  document.getElementById('shift-month-display').textContent = `${monthNames[shiftMonth]} ${shiftYear}`;
  const daysContainer = document.getElementById('calendar-days');
  daysContainer.innerHTML = '';
  const firstDay = new Date(shiftYear, shiftMonth, 1);
  const lastDay = new Date(shiftYear, shiftMonth + 1, 0);
  let firstWeekday = firstDay.getDay();
  firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;
  for (let i = 0; i < firstWeekday; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    daysContainer.appendChild(emptyDay);
  }
  const today = new Date();
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    const dateStr = `${shiftYear}-${String(shiftMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasShift = shifts.some(s => s.date === dateStr);
    if (hasShift) {
      dayEl.classList.add('has-shift');
      const dot = document.createElement('span');
      dot.className = 'shift-dot';
      dayEl.appendChild(dot);
    }
    if (today.getDate() === day && today.getMonth() === shiftMonth && today.getFullYear() === shiftYear) {
      dayEl.classList.add('today');
    }
    dayEl.onclick = function() {
      openShiftFormForDate(dateStr);
    };
    daysContainer.appendChild(dayEl);
  }
}

function openShiftFormForDate(dateStr) {
  document.getElementById('shift-modal').classList.add('active');
  document.getElementById('shift-date').value = dateStr;
  document.getElementById('shift-start').value = '';
  document.getElementById('shift-end').value = '';
  document.getElementById('shift-rate').value = '';
}

function openShiftForm() {
  document.getElementById('shift-modal').classList.add('active');
  document.getElementById('shift-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('shift-start').value = '';
  document.getElementById('shift-end').value = '';
  document.getElementById('shift-rate').value = '';
}

function closeShiftForm() {
  document.getElementById('shift-modal').classList.remove('active');
}

function addShift() {
  const date = document.getElementById('shift-date').value;
  const start = document.getElementById('shift-start').value;
  const end = document.getElementById('shift-end').value;
  const rate = parseFloat(document.getElementById('shift-rate').value);
  if (!date || !start || !end || !rate || rate <= 0) {
    alert('Заполни все поля!');
    return;
  }
  const startDate = new Date(`${date}T${start}`);
  const endDate = new Date(`${date}T${end}`);
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  const hours = (endDate - startDate) / (1000 * 60 * 60);
  if (hours <= 0) {
    alert('Некорректное время!');
    return;
  }
  const money = hours * rate;
  const shift = {
    id: Date.now(),
    date: date,
    start: start,
    end: end,
    rate: rate,
    hours: hours,
    money: money
  };
  shifts.unshift(shift);
  saveShifts();
  renderShifts();
  renderCalendar();
  closeShiftForm();
}

function deleteShift(id) {
  if (confirm('Удалить смену?')) {
    shifts = shifts.filter(s => s.id !== id);
    saveShifts();
    renderShifts();
    renderCalendar();
  }
}

function renderShifts() {
  const shiftsList = document.getElementById('shifts-list');
  if (shifts.length === 0) {
    shiftsList.innerHTML = '<div class="empty-message">Пока нет смен. Добавь первую!</div>';
    document.getElementById('total-hours').textContent = '0 ч';
    document.getElementById('total-shift-money').textContent = '0 ₽';
    return;
  }
  let totalHours = 0;
  let totalMoney = 0;
  shifts.forEach(s => {
    totalHours += s.hours;
    totalMoney += s.money;
  });
  document.getElementById('total-hours').textContent = `${totalHours.toFixed(1)} ч`;
  document.getElementById('total-shift-money').textContent = `${totalMoney.toLocaleString('ru-RU')} ₽`;
  shiftsList.innerHTML = '';
  shifts.slice(0, 10).forEach(s => {
    const card = document.createElement('div');
    card.className = 'shift-card';
    const formattedDate = new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
    card.innerHTML = `
      <div class="shift-card-header">
        <span class="shift-date">${formattedDate}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="shift-money">+${s.money.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteShift(${s.id})">✕</button>
        </div>
      </div>
      <div class="shift-info">${s.start} - ${s.end} • Ставка: ${s.rate} ₽/час</div>
      <span class="shift-hours">${s.hours.toFixed(1)} ч</span>
    `;
    shiftsList.appendChild(card);
  });
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateMonthDisplay();
  renderStats();
}

function updateMonthDisplay() {
  document.getElementById('month-display').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function renderStats() {
  const expenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.month !== undefined && t.year !== undefined) {
      return t.month === currentMonth && t.year === currentYear;
    }
    return (t.date || '').includes(monthNames[currentMonth]) && (t.date || '').includes(String(currentYear));
  });
  const incomes = transactions.filter(t => {
    if (t.type !== 'income') return false;
    if (t.month !== undefined && t.year !== undefined) {
      return t.month === currentMonth && t.year === currentYear;
    }
    return (t.date || '').includes(monthNames[currentMonth]) && (t.date || '').includes(String(currentYear));
  });
  let totalExpense = 0;
  let totalIncome = 0;
  expenses.forEach(e => totalExpense += e.amount);
  incomes.forEach(i => totalIncome += i.amount);
  const canvas = document.getElementById('expense-chart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (expenses.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Нет расходов', canvas.width / 2, canvas.height / 2);
    document.getElementById('stats-summary').innerHTML = `
      <h3>${monthNames[currentMonth]} ${currentYear}</h3>
      <div class="summary-item"><span class="summary-category">Доходы</span><span class="summary-amount" style="color:#4caf50;">${totalIncome.toLocaleString('ru-RU')} ₽</span></div>
      <div class="summary-item"><span class="summary-category">Расходы</span><span class="summary-amount" style="color:#f44336;">0 ₽</span></div>
      <div class="empty-message">Добавь расход в этом месяце</div>
    `;
    document.getElementById('stats-legend').innerHTML = '';
    return;
  }
  const categories = {};
  expenses.forEach(e => {
    if (!categories[e.category]) categories[e.category] = 0;
    categories[e.category] += e.amount;
  });
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  let startAngle = -Math.PI / 2;
  sortedCategories.forEach(([category, amount], index) => {
    const sliceAngle = (amount / totalExpense) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = chartColors[index % chartColors.length];
    ctx.fill();
    startAngle = endAngle;
  });
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = '#2a2a2a';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${totalExpense.toLocaleString('ru-RU')} ₽`, centerX, centerY - 8);
  ctx.fillStyle = '#888';
  ctx.font = '11px Arial';
  ctx.fillText('расходы', centerX, centerY + 12);
  const summaryHtml = `
    <h3>${monthNames[currentMonth]} ${currentYear}</h3>
    <div class="summary-item"><span class="summary-category">Доходы</span><span class="summary-amount" style="color:#4caf50;">${totalIncome.toLocaleString('ru-RU')} ₽</span></div>
    <div class="summary-item"><span class="summary-category">Расходы</span><span class="summary-amount" style="color:#f44336;">${totalExpense.toLocaleString('ru-RU')} ₽</span></div>
    ${sortedCategories.map(([category, amount]) => `
      <div class="summary-item"><span class="summary-category">${category}</span><span class="summary-amount">${amount.toLocaleString('ru-RU')} ₽</span></div>
    `).join('')}
  `;
  document.getElementById('stats-summary').innerHTML = summaryHtml;
  const legendHtml = sortedCategories.map(([category, amount], index) => `
    <div class="legend-item">
      <span class="legend-color" style="background:${chartColors[index % chartColors.length]}"></span>
      <span class="legend-label">${category}</span>
      <span class="legend-percent">${((amount / totalExpense) * 100).toFixed(1)}%</span>
    </div>
  `).join('');
  document.getElementById('stats-legend').innerHTML = legendHtml;
}
// ===== КОПИЛКИ =====
function openEnvelopeForm() {
  document.getElementById('envelope-modal').classList.add('active');
  document.getElementById('envelope-name').value = '';
  document.getElementById('envelope-budget').value = '';
}

function closeEnvelopeForm() {
  document.getElementById('envelope-modal').classList.remove('active');
}

function addEnvelope() {
  const name = document.getElementById('envelope-name').value;
  const budget = parseFloat(document.getElementById('envelope-budget').value);
  if (!name || !budget || budget <= 0) {
    alert('Введи название и бюджет!');
    return;
  }
  const envelope = {
    id: Date.now(),
    name: name,
    budget: budget,
    spent: 0
  };
  envelopes.unshift(envelope);
  saveEnvelopes();
  renderEnvelopes();
  closeEnvelopeForm();
}

function deleteEnvelope(id) {
  if (confirm('Удалить копилку?')) {
    envelopes = envelopes.filter(e => e.id !== id);
    saveEnvelopes();
    renderEnvelopes();
  }
}

function spendEnvelope(id) {
  const envelope = envelopes.find(e => e.id === id);
  const amount = prompt(`Сколько потратил из "${envelope.name}"?`);
  if (amount && parseFloat(amount) > 0) {
    envelope.spent += parseFloat(amount);
    saveEnvelopes();
    renderEnvelopes();
  }
}

function renderEnvelopes() {
  const list = document.getElementById('envelopes-list');
  if (envelopes.length === 0) {
    list.innerHTML = '<div class="empty-message">Нет копилок. Создай первую!</div>';
    return;
  }
  list.innerHTML = '';
  envelopes.forEach(e => {
    const remaining = e.budget - e.spent;
    const percent = Math.min(100, (e.spent / e.budget) * 100);
    const card = document.createElement('div');
    card.className = 'envelope-card';
    card.innerHTML = `
      <div class="envelope-card-header">
        <span class="envelope-card-title">${e.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="envelope-card-amount">${remaining.toLocaleString('ru-RU')} / ${e.budget.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteEnvelope(${e.id})">✕</button>
        </div>
      </div>
      <div class="envelope-progress-bar">
        <div class="envelope-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="envelope-card-footer">
        <span class="envelope-percent">Потрачено: ${e.spent.toLocaleString('ru-RU')} ₽ (${percent.toFixed(0)}%)</span>
        <button class="btn-add-to-goal" onclick="spendEnvelope(${e.id})">−</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== ПОДПИСКИ =====
function openSubscriptionForm() {
  document.getElementById('subscription-modal').classList.add('active');
  document.getElementById('subscription-name').value = '';
  document.getElementById('subscription-amount').value = '';
  document.getElementById('subscription-date').value = '';
}

function closeSubscriptionForm() {
  document.getElementById('subscription-modal').classList.remove('active');
}

function addSubscription() {
  const name = document.getElementById('subscription-name').value;
  const amount = parseFloat(document.getElementById('subscription-amount').value);
  const date = document.getElementById('subscription-date').value;
  if (!name || !amount || amount <= 0 || !date) {
    alert('Заполни все поля!');
    return;
  }
  const subscription = {
    id: Date.now(),
    name: name,
    amount: amount,
    date: date
  };
  subscriptions.unshift(subscription);
  saveSubscriptions();
  renderSubscriptions();
  closeSubscriptionForm();
}

function deleteSubscription(id) {
  if (confirm('Удалить подписку?')) {
    subscriptions = subscriptions.filter(s => s.id !== id);
    saveSubscriptions();
    renderSubscriptions();
  }
}

function renderSubscriptions() {
  const list = document.getElementById('subscriptions-list');
  if (subscriptions.length === 0) {
    list.innerHTML = '<div class="empty-message">Нет подписок. Добавь первую!</div>';
    return;
  }
  list.innerHTML = '';
  subscriptions.forEach(s => {
    const formattedDate = new Date(s.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const card = document.createElement('div');
    card.className = 'subscription-card';
    card.innerHTML = `
      <div class="subscription-card-header">
        <span class="subscription-card-title">${s.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="subscription-card-amount">${s.amount.toLocaleString('ru-RU')} ₽/мес</span>
          <button class="btn-delete" onclick="deleteSubscription(${s.id})">✕</button>
        </div>
      </div>
      <div style="font-size:13px;color:#888;">Списание: ${formattedDate}</div>
    `;
    list.appendChild(card);
  });
}

// ===== ДОЛГИ =====
function openDebtForm(type) {
  currentDebtType = type;
  document.getElementById('debt-modal-title').textContent = type === 'to-me' ? 'Мне должны' : 'Я должен';
  document.getElementById('debt-modal').classList.add('active');
  document.getElementById('debt-name').value = '';
  document.getElementById('debt-amount').value = '';
  document.getElementById('debt-note').value = '';
}

function closeDebtForm() {
  document.getElementById('debt-modal').classList.remove('active');
}

function addDebt() {
  const name = document.getElementById('debt-name').value;
  const amount = parseFloat(document.getElementById('debt-amount').value);
  const note = document.getElementById('debt-note').value;
  if (!name || !amount || amount <= 0) {
    alert('Введи имя и сумму!');
    return;
  }
  const debt = {
    id: Date.now(),
    name: name,
    amount: amount,
    note: note,
    type: currentDebtType
  };
  debts.unshift(debt);
  saveDebts();
  renderDebts();
  closeDebtForm();
}

function deleteDebt(id) {
  if (confirm('Удалить долг?')) {
    debts = debts.filter(d => d.id !== id);
    saveDebts();
    renderDebts();
  }
}

function renderDebts() {
  const list = document.getElementById('debts-list');
  if (debts.length === 0) {
    list.innerHTML = '<div class="empty-message">Нет долгов. Всё чисто!</div>';
    return;
  }
  list.innerHTML = '';
  debts.forEach(d => {
    const isToMe = d.type === 'to-me';
    const card = document.createElement('div');
    card.className = 'debt-card';
    card.innerHTML = `
      <div class="debt-card-header">
        <span class="debt-card-title">${isToMe ? '🟢' : '🔴'} ${d.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="debt-card-amount" style="color:${isToMe ? '#4caf50' : '#f44336'}">${isToMe ? '+' : '-'}${d.amount.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteDebt(${d.id})">✕</button>
        </div>
      </div>
      ${d.note ? `<div style="font-size:13px;color:#888;">${d.note}</div>` : ''}
    `;
    list.appendChild(card);
  });
}
// ===== СОБЫТИЯ =====
function openEventForm() {
  document.getElementById('event-modal').classList.add('active');
  document.getElementById('event-name').value = '';
  document.getElementById('event-category').value = 'День рождения';
  document.getElementById('event-date').value = '';
  document.getElementById('event-note').value = '';
}

function closeEventForm() {
  document.getElementById('event-modal').classList.remove('active');
}

function addEvent() {
  const name = document.getElementById('event-name').value;
  const category = document.getElementById('event-category').value;
  const date = document.getElementById('event-date').value;
  const note = document.getElementById('event-note').value;
  if (!name || !date) {
    alert('Введи название и дату!');
    return;
  }
  const event = {
    id: Date.now(),
    name: name,
    category: category,
    date: date,
    note: note
  };
  events.unshift(event);
  saveEvents();
  renderEvents();
  closeEventForm();
}

function deleteEvent(id) {
  if (confirm('Удалить событие?')) {
    events = events.filter(e => e.id !== id);
    saveEvents();
    renderEvents();
  }
}

function renderEvents() {
  const list = document.getElementById('events-list');
  if (events.length === 0) {
    list.innerHTML = '<div class="empty-message">Нет событий. Добавь первое!</div>';
    return;
  }
  list.innerHTML = '';
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  events.forEach(e => {
    const formattedDate = new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const daysLeft = Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24));
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-card-header">
        <span class="event-card-title">${e.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="event-card-amount">${formattedDate}</span>
          <button class="btn-delete" onclick="deleteEvent(${e.id})">✕</button>
        </div>
      </div>
      <div style="font-size:13px;color:#888;">${e.category}${e.note ? ' • ' + e.note : ''}</div>
      ${daysLeft >= 0 ? `<div style="font-size:12px;color:#2196f3;margin-top:8px;">Через ${daysLeft} дн.</div>` : ''}
    `;
    list.appendChild(card);
  });
}

// ===== СПИСОК ЖЕЛАНИЙ =====
function openWishForm() {
  document.getElementById('wish-modal').classList.add('active');
  document.getElementById('wish-name').value = '';
  document.getElementById('wish-price').value = '';
}

function closeWishForm() {
  document.getElementById('wish-modal').classList.remove('active');
}

function addWish() {
  const name = document.getElementById('wish-name').value;
  const price = parseFloat(document.getElementById('wish-price').value);
  if (!name || !price || price <= 0) {
    alert('Введи название и цену!');
    return;
  }
  const wish = {
    id: Date.now(),
    name: name,
    price: price
  };
  wishlist.unshift(wish);
  saveWishlist();
  renderWishlist();
  closeWishForm();
}

function deleteWish(id) {
  if (confirm('Удалить желание?')) {
    wishlist = wishlist.filter(w => w.id !== id);
    saveWishlist();
    renderWishlist();
  }
}

function renderWishlist() {
  const list = document.getElementById('wishlist-list');
  if (wishlist.length === 0) {
    list.innerHTML = '<div class="empty-message">Список пуст. Добавь желание!</div>';
    return;
  }
  list.innerHTML = '';
  wishlist.forEach(w => {
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = `
      <div class="wish-card-header">
        <span class="wish-card-title">${w.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="wish-card-amount">${w.price.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteWish(${w.id})">✕</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== ИНВЕСТИЦИИ =====
function openInvestmentForm() {
  document.getElementById('investment-modal').classList.add('active');
  document.getElementById('investment-name').value = '';
  document.getElementById('investment-amount').value = '';
}

function closeInvestmentForm() {
  document.getElementById('investment-modal').classList.remove('active');
}

function addInvestment() {
  const name = document.getElementById('investment-name').value;
  const amount = parseFloat(document.getElementById('investment-amount').value);
  if (!name || !amount || amount <= 0) {
    alert('Введи название и сумму!');
    return;
  }
  const investment = {
    id: Date.now(),
    name: name,
    amount: amount
  };
  investments.unshift(investment);
  saveInvestments();
  renderInvestments();
  closeInvestmentForm();
}

function deleteInvestment(id) {
  if (confirm('Удалить инвестицию?')) {
    investments = investments.filter(i => i.id !== id);
    saveInvestments();
    renderInvestments();
  }
}

function renderInvestments() {
  const list = document.getElementById('investments-list');
  if (investments.length === 0) {
    list.innerHTML = '<div class="empty-message">Нет инвестиций. Добавь первую!</div>';
    return;
  }
  list.innerHTML = '';
  let totalInvested = 0;
  investments.forEach(i => totalInvested += i.amount);
  investments.forEach(i => {
    const card = document.createElement('div');
    card.className = 'investment-card';
    card.innerHTML = `
      <div class="investment-card-header">
        <span class="investment-card-title">${i.name}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="investment-card-amount">${i.amount.toLocaleString('ru-RU')} ₽</span>
          <button class="btn-delete" onclick="deleteInvestment(${i.id})">✕</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  const totalCard = document.createElement('div');
  totalCard.className = 'investment-card';
  totalCard.style.borderColor = '#2196f3';
  totalCard.innerHTML = `
    <div class="investment-card-header">
      <span class="investment-card-title">Всего вложено</span>
      <span class="investment-card-amount">${totalInvested.toLocaleString('ru-RU')} ₽</span>
    </div>
  `;
  list.appendChild(totalCard);
}
// ===== НАПОМИНАНИЯ =====
function saveNotificationTimes() {
  const times = {
    morning: document.getElementById('morning-time').value,
    shift: document.getElementById('shift-time').value,
    evening: document.getElementById('evening-time').value
  };
  localStorage.setItem('kazna_notification_times', JSON.stringify(times));
}

function getNotificationTimes() {
  const saved = JSON.parse(localStorage.getItem('kazna_notification_times'));
  if (saved) {
    return saved;
  }
  return {
    morning: '09:00',
    shift: '13:00',
    evening: '21:00'
  };
}

function toggleNotifications() {
  if (!notificationsEnabled) {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          notificationsEnabled = true;
          localStorage.setItem('kazna_notifications', JSON.stringify(true));
          scheduleNotifications();
          alert('Напоминания включены!');
          updateNotificationButton();
        } else {
          alert('Нужно разрешить уведомления!');
        }
      });
    } else {
      alert('Уведомления не поддерживаются');
    }
  } else {
    notificationsEnabled = false;
    localStorage.setItem('kazna_notifications', JSON.stringify(false));
    alert('Напоминания выключены');
    updateNotificationButton();
  }
}

function updateNotificationButton() {
  const btn = document.getElementById('notif-btn');
  if (btn) {
    if (notificationsEnabled) {
      btn.textContent = 'Выключить напоминания';
      btn.className = 'btn btn-cancel';
    } else {
      btn.textContent = 'Включить напоминания';
      btn.className = 'btn btn-save';
    }
  }
}

function scheduleNotifications() {
  if (!notificationsEnabled) return;
  setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const times = getNotificationTimes();
    if (currentTime === times.morning) {
      sendMorningNotification();
    }
    if (currentTime === times.shift) {
      sendShiftNotification();
    }
    if (currentTime === times.evening) {
      sendEveningNotification();
    }
  }, 30000);
}

function sendMorningNotification() {
  if (!goals || goals.length === 0) return;
  const goal = goals[0];
  const remaining = goal.target - goal.current;
  if (remaining > 0 && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Казна', {
        body: `${goal.name}: осталось ${remaining.toLocaleString('ru-RU')} ₽. Ты ближе, чем вчера!`,
        icon: 'icon-512.png'
      });
    });
  }
}

function sendShiftNotification() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const tomorrowShift = shifts.find(s => s.date === tomorrowStr);
  if (tomorrowShift && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Казна', {
        body: `Завтра смена в ${tomorrowShift.start}!`,
        icon: 'icon-512.png'
      });
    });
  }
}

function sendEveningNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Казна', {
        body: 'Не забудь записать доходы и расходы за день!',
        icon: 'icon-512.png'
      });
    });
  }
}

// ===== ЭКСПОРТ / ИМПОРТ =====
function exportData() {
  const data = {
    transactions: transactions,
    goals: goals,
    shifts: shifts,
    envelopes: envelopes,
    subscriptions: subscriptions,
    debts: debts,
    events: events,
    wishlist: wishlist,
    investments: investments,
    exportedAt: new Date().toISOString()
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kazna_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.transactions) { transactions = data.transactions; saveTransactions(); }
      if (data.goals) { goals = data.goals; saveGoals(); }
      if (data.shifts) { shifts = data.shifts; saveShifts(); }
      if (data.envelopes) { envelopes = data.envelopes; saveEnvelopes(); }
      if (data.subscriptions) { subscriptions = data.subscriptions; saveSubscriptions(); }
      if (data.debts) { debts = data.debts; saveDebts(); }
      if (data.events) { events = data.events; saveEvents(); }
      if (data.wishlist) { wishlist = data.wishlist; saveWishlist(); }
      if (data.investments) { investments = data.investments; saveInvestments(); }
      updateUI();
      renderGoals();
      renderShifts();
      renderCalendar();
      renderEnvelopes();
      renderSubscriptions();
      renderDebts();
      renderEvents();
      renderWishlist();
      renderInvestments();
      alert('Данные успешно импортированы!');
    } catch (err) {
      alert('Ошибка импорта! Неверный файл.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ===== СОХРАНЕНИЕ =====
function saveTransactions() { localStorage.setItem('kazna_transactions', JSON.stringify(transactions)); }
function saveGoals() { localStorage.setItem('kazna_goals', JSON.stringify(goals)); }
function saveShifts() { localStorage.setItem('kazna_shifts', JSON.stringify(shifts)); }
function saveEnvelopes() { localStorage.setItem('kazna_envelopes', JSON.stringify(envelopes)); }
function saveSubscriptions() { localStorage.setItem('kazna_subscriptions', JSON.stringify(subscriptions)); }
function saveDebts() { localStorage.setItem('kazna_debts', JSON.stringify(debts)); }
function saveEvents() { localStorage.setItem('kazna_events', JSON.stringify(events)); }
function saveWishlist() { localStorage.setItem('kazna_wishlist', JSON.stringify(wishlist)); }
function saveInvestments() { localStorage.setItem('kazna_investments', JSON.stringify(investments)); }

// ===== ПОДСЧЁТ БАЛАНСА =====
function calculateBalance() {
  let income = 0;
  let expense = 0;
  transactions.forEach(t => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });
  return { income, expense, balance: income - expense };
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateUI() {
  const { income, expense, balance } = calculateBalance();
  balanceEl.textContent = `${balance.toLocaleString('ru-RU')} ₽`;
  incomeEl.textContent = `Доход: ${income.toLocaleString('ru-RU')} ₽`;
  expenseEl.textContent = `Расход: ${expense.toLocaleString('ru-RU')} ₽`;
  renderTransactions();
}

function renderTransactions() {
  if (transactions.length === 0) {
    transactionList.innerHTML = '<div class="empty-message">Пока пусто</div>';
    return;
  }
  transactionList.innerHTML = '';
  transactions.slice(0, 10).forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    const sign = t.type === 'income' ? '+' : '-';
    const amountClass = t.type === 'income' ? 'transaction-amount-income' : 'transaction-amount-expense';
    li.innerHTML = `
      <div class="info" onclick="editTransaction(${t.id})">
        <span class="note">${t.note}</span>
        <span class="category">${t.category} • ${t.date}</span>
        ${t.comment ? `<span class="comment">${t.comment}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="${amountClass}">${sign}${t.amount.toLocaleString('ru-RU')} ₽</span>
        <button class="btn-delete" onclick="deleteTransaction(${t.id})">✕</button>
      </div>
    `;
    transactionList.appendChild(li);
  });
}

// ===== ЗАПУСК =====
updateUI();
updateNotificationButton();

if (notificationsEnabled) {
  scheduleNotifications();
}

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', function(e) {
    if (e.target === m) {
      m.classList.remove('active');
    }
  });
});

amountInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addTransaction();
  }
});