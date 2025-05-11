function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
}

function clearLocalStorage() {
    localStorage.clear();
}

function saveTransaction(transaction) {
    const transactions = getFromLocalStorage('transactions') || [];
    transactions.push(transaction);
    saveToLocalStorage('transactions', transactions);
}

function getTransactions() {
    return getFromLocalStorage('transactions') || [];
}

function saveUserData(userData) {
    saveToLocalStorage('user', userData);
}

function getUserData() {
    return getFromLocalStorage('user');
}

function clearUserData() {
    removeFromLocalStorage('user');
}