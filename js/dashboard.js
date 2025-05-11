// Dashboard.js - Gerenciamento do dashboard financeiro

// Verificar autenticação antes de qualquer operação
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.isLoggedIn) {
        window.location.href = 'login.html?unauthorized=true';
        return false;
    }
    
    // Verificar se a sessão expirou
    if (user.sessionExpires && user.sessionExpires < Date.now()) {
        localStorage.removeItem('user');
        window.location.href = 'login.html?expired=true';
        return false;
    }
    
    return true;
}

// Carregar transações do armazenamento local
function loadTransactions() {
    // Verificar autenticação antes de carregar dados
    if (!checkAuthentication()) return [];
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    return transactions;
}

// Salvar transações no armazenamento local
function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Calcular totais
function calculateTotals(transactions) {
    const totals = {
        income: 0,
        expenses: 0, 
        balance: 0
    };

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totals.income += parseFloat(transaction.amount);
        } else {
            totals.expenses += parseFloat(transaction.amount);
        }
    });

    totals.balance = totals.income - totals.expenses;
    return totals;
}

// Atualizar interface com os totais
function updateTotals() {
    const transactions = loadTransactions();
    const totals = calculateTotals(transactions);
    
    document.getElementById('total-income').textContent = formatCurrency(totals.income);
    document.getElementById('total-expenses').textContent = formatCurrency(totals.expenses);
    document.getElementById('balance').textContent = formatCurrency(totals.balance);
    
    // Alterar a cor do saldo de acordo com o valor
    const balanceElement = document.getElementById('balance');
    if (totals.balance < 0) {
        balanceElement.style.color = 'var(--expense-color, #e74c3c)';
    } else {
        balanceElement.style.color = 'var(--income-color, #2ecc71)';
    }
}

// Formatar valor como moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Adicionar nova transação
function addTransaction(event) {
    event.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    
    if (!description || !amount || !date) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        type,
        date
    };
    
    const transactions = loadTransactions();
    transactions.push(transaction);
    saveTransactions(transactions);
    
    // Limpar formulário
    clearForm();
    
    // Atualizar interface
    updateTransactionsList();
    updateTotals();
}

// Remover transação
function removeTransaction(id) {
    const transactions = loadTransactions();
    const filteredTransactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions(filteredTransactions);
    
    // Atualizar interface
    updateTransactionsList();
    updateTotals();
}

// Função para editar transação
function editTransaction(id) {
    const transactions = loadTransactions();
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction) {
        // Preencher formulário com os dados da transação
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('type').value = transaction.type;
        document.getElementById('date').value = transaction.date;
        
        // Habilitar modo de edição
        enableEdit();
        
        // Armazenar o ID da transação sendo editada
        localStorage.setItem('editingTransactionId', id);
        
        // Alterar botão de adicionar para atualizar
        const submitButton = document.querySelector('#transaction-form button[type="submit"]');
        submitButton.textContent = 'Atualizar';
        
        // Rolar até o formulário
        document.querySelector('.add-transaction').scrollIntoView({ behavior: 'smooth' });
    }
}

// Função para atualizar transação existente
function updateTransaction() {
    const editingId = parseInt(localStorage.getItem('editingTransactionId'));
    if (!editingId) return false;
    
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    
    if (!description || !amount || !date) {
        alert('Por favor, preencha todos os campos.');
        return false;
    }
    
    const transactions = loadTransactions();
    const index = transactions.findIndex(t => t.id === editingId);
    
    if (index !== -1) {
        transactions[index] = {
            ...transactions[index],
            description,
            amount: parseFloat(amount),
            type,
            date
        };
        
        saveTransactions(transactions);
        
        // Limpar formulário e estado de edição
        clearForm();
        cancelEdit();
        
        // Atualizar interface
        updateTransactionsList();
        updateTotals();
        
        // Remover ID da transação em edição
        localStorage.removeItem('editingTransactionId');
        
        // Restaurar texto do botão
        const submitButton = document.querySelector('#transaction-form button[type="submit"]');
        submitButton.textContent = 'Adicionar';
        
        return true;
    }
    
    return false;
}

// Criar elemento HTML para uma transação
function createTransactionElement(transaction) {
    const transactionElement = document.createElement('div');
    transactionElement.className = `transaction ${transaction.type}`;
    
    // HTML interno da transação (informações principais)
    transactionElement.innerHTML = `
        <div class="transaction-info">
            <span class="description">${transaction.description}</span>
            <span class="date">${formatDate(transaction.date)}</span>
        </div>
        <div class="transaction-amount">
            <span class="amount">${formatCurrency(transaction.amount)}</span>
            <div class="transaction-actions">
                <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        
        <!-- Ações de swipe para mobile -->
        <div class="transaction-swipe-actions">
            <div class="transaction-swipe-btn transaction-edit-btn" data-id="${transaction.id}">
                <i class="fas fa-edit"></i>
            </div>
            <div class="transaction-swipe-btn transaction-delete-btn" data-id="${transaction.id}">
                <i class="fas fa-trash"></i>
            </div>
        </div>
    `;
    
    // Adicionar eventos aos botões regulares
    const editButton = transactionElement.querySelector('.edit-btn');
    editButton.addEventListener('click', function() {
        editTransaction(parseInt(this.getAttribute('data-id')));
    });
    
    const deleteButton = transactionElement.querySelector('.delete-btn');
    deleteButton.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            removeTransaction(parseInt(this.getAttribute('data-id')));
        }
    });
    
    // Adicionar eventos aos botões de swipe para mobile
    const swipeEditBtn = transactionElement.querySelector('.transaction-edit-btn');
    swipeEditBtn.addEventListener('click', function() {
        editTransaction(parseInt(this.getAttribute('data-id')));
    });
    
    const swipeDeleteBtn = transactionElement.querySelector('.transaction-delete-btn');
    swipeDeleteBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            removeTransaction(parseInt(this.getAttribute('data-id')));
        }
    });
    
    return transactionElement;
}

// Atualizar lista de transações na interface
function updateTransactionsList() {
    const transactionsList = document.getElementById('transactions-list');
    const transactions = loadTransactions();
    
    // Ordenar transações (mais recentes primeiro)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limpar lista
    transactionsList.innerHTML = '';
    
    // Adicionar transações à lista
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="no-transactions">Nenhuma transação registrada.</p>';
    } else {
        transactions.forEach(transaction => {
            const transactionElement = createTransactionElement(transaction);
            transactionsList.appendChild(transactionElement);
        });
    }
}

// Função para habilitar edição
function enableEdit() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.add('editing');
        const input = group.querySelector('input, select');
        if (input) {
            input.focus();
        }
    });
}

// Função para limpar o formulário
function clearForm() {
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('type').selectedIndex = 0;
    
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Função para cancelar edição
function cancelEdit() {
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.remove('editing');
    });
    
    // Se estava editando uma transação, cancelar a edição
    if (localStorage.getItem('editingTransactionId')) {
        localStorage.removeItem('editingTransactionId');
        clearForm();
        
        // Restaurar texto do botão
        const submitButton = document.querySelector('#transaction-form button[type="submit"]');
        submitButton.textContent = 'Adicionar';
    }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Verificar login
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Atualizar nome de usuário
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username || 'Usuário';
    }
    
    // Adicionar evento ao formulário de transações
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Verificar se estamos editando ou adicionando
            if (localStorage.getItem('editingTransactionId')) {
                updateTransaction();
            } else {
                addTransaction(event);
            }
        });
    }
    
    // Definir data padrão como hoje
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    // Configurar event listeners para os botões de edição
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', enableEdit);
    }
    
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
    
    // Carregar transações e atualizar interface
    updateTransactionsList();
    updateTotals();
    
    // Verificar se estamos em um dispositivo móvel
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        setupMobileNavigation();
        // Configurar swipe actions depois que a lista de transações for atualizada
        setTimeout(setupSwipeActions, 500);
    }
    
    // Reconfigurar swipe actions sempre que a lista de transações for atualizada
    const originalUpdateList = updateTransactionsList;
    updateTransactionsList = function() {
        originalUpdateList();
        if (isMobile) {
            setTimeout(setupSwipeActions, 100);
        }
    };
});

// Mobile Navigation Functionality
function setupMobileNavigation() {
    // Quick Add Button
    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', function() {
            document.querySelector('.add-transaction').scrollIntoView({ behavior: 'smooth' });
            enableEdit();
        });
    }
    
    // Mobile Add Navigation Button
    const mobileAddBtn = document.getElementById('mobileAddBtn');
    if (mobileAddBtn) {
        mobileAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.add-transaction').scrollIntoView({ behavior: 'smooth' });
            enableEdit();
        });
    }
    
    // Mobile Navigation Items
    const navItems = document.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // If not the add button (which is handled separately)
            if (this !== mobileAddBtn) {
                e.preventDefault();
                
                // Navigation logic based on icon
                const icon = this.querySelector('i').className;
                
                if (icon.includes('home')) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (icon.includes('calendar')) {
                    document.querySelector('.due-dates-container').scrollIntoView({ behavior: 'smooth' });
                } else if (icon.includes('chart')) {
                    // Futura seção de relatórios
                    alert('Relatórios em breve!');
                }
            }
        });
    });
}

// Implementar funcionalidade de swipe nas transações para mobile
function setupSwipeActions() {
    const transactions = document.querySelectorAll('.transaction');
    
    transactions.forEach(transaction => {
        let touchStartX = 0;
        let touchEndX = 0;
        
        transaction.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        transaction.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(this, touchStartX, touchEndX);
        }, { passive: true });
    });
}

function handleSwipe(element, startX, endX) {
    const threshold = 100; // Mínimo de pixels para considerar um swipe
    
    if (startX - endX > threshold) {
        // Swipe para a esquerda (revelar ações)
        element.classList.add('swiped');
    } else if (endX - startX > threshold) {
        // Swipe para a direita (esconder ações)
        element.classList.remove('swiped');
    }
}

// Detectar cliques fora da transação para fechar swipe
document.addEventListener('click', function(e) {
    const swipedItems = document.querySelectorAll('.transaction.swiped');
    
    swipedItems.forEach(item => {
        if (!item.contains(e.target)) {
            item.classList.remove('swiped');
        }
    });
});