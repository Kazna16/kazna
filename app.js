let transactions = JSON.parse(localStorage.getItem('kazna_transactions')) || [];
let goals = JSON.parse(localStorage.getItem('kazna_goals')) || [];
let shifts = JSON.parse(localStorage.getItem('kazna_shifts')) || [];
let currentType = 'income';
let currentGoalId = null;
let editingTransactionId = null;

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

function exportData() {
  const data = {
    transactions: transactions,
    goals: goals,
    shifts: shifts,
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
      if (data.transactions) {
        transactions = data.transactions;
        saveTransactions();
      }
      if (data.goals) {
        goals = data.goals;
        saveGoals();
      }
      if (data.shifts) {
        shifts = data.shifts;
        saveShifts();
      }
      updateUI();
      renderGoals();
      renderShifts();
      renderCalendar();
      alert('Данные успешно импортированы!');
    } catch (err) {
      alert('Ошибка импорта! Неверный файл.');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function saveTransactions() {
  localStorage.setItem('kazna_transactions', JSON.stringify(transactions));
}

function saveGoals() {
  localStorage.setItem('kazna_goals', JSON.stringify(goals));
}

function saveShifts() {
  localStorage.setItem('kazna_shifts', JSON.stringify(shifts));
}

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

updateUI();

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