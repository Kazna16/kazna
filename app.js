let transactions = JSON.parse(localStorage.getItem('kazna_transactions')) || [];
let currentType = 'income';

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionList = document.getElementById('transaction-list');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');

function openForm(type) {
  currentType = type;
  modalTitle.textContent = type === 'income' ? 'Добавить доход' : 'Добавить расход';
  amountInput.value = '';
  noteInput.value = '';
  categoryInput.value = type === 'income' ? 'Зарплата' : 'Еда';
  modal.classList.add('active');
}

function closeForm() {
  modal.classList.remove('active');
}

function addTransaction() {
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value || category;
  
  if (!amount || amount <= 0) {
    alert('Введи сумму!');
    return;
  }
  
  const transaction = {
    id: Date.now(),
    amount: amount,
    type: currentType,
    category: category,
    note: note,
    date: new Date().toLocaleDateString('ru-RU')
  };
  
  transactions.unshift(transaction);
  localStorage.setItem('kazna_transactions', JSON.stringify(transactions));
  updateUI();
  closeForm();
}

function updateUI() {
  let income = 0;
  let expense = 0;
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });
  
  balanceEl.textContent = `${(income - expense).toLocaleString('ru-RU')} ₽`;
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
      <div>
        <div>${t.note}</div>
        <small style="color:#888">${t.category} • ${t.date}</small>
      </div>
      <span class="${amountClass}">${sign}${t.amount.toLocaleString('ru-RU')} ₽</span>
    `;
    
    transactionList.appendChild(li);
  });
}

updateUI();