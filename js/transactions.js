// transactions.js

const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function addTransaction(type, amount) {
    const transaction = {
        id: Date.now(),
        type: type,
        amount: parseFloat(amount),
        date: new Date().toISOString()
    };
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function getTransactions() {
    return transactions;
}

function getBalance() {
    return transactions.reduce((acc, transaction) => {
        return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);
}

function deleteTransaction(id) {
    const index = transactions.findIndex(transaction => transaction.id === id);
    if (index > -1) {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
}

// Example usage
document.getElementById('addTransactionForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = document.getElementById('amount').value;
    addTransaction(type, amount);
    updateUI();
});

function updateUI() {
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';
    const allTransactions = getTransactions();
    allTransactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.textContent = `${transaction.date}: ${transaction.type} - $${transaction.amount.toFixed(2)}`;
        transactionList.appendChild(listItem);
    });
    document.getElementById('balance').textContent = `Balance: $${getBalance().toFixed(2)}`;
}

// Initial UI update
updateUI();