// Reports.js - Sistema de relatórios financeiros

// Sistema de eventos para sincronização entre dashboard e relatórios
const FinanceEvents = {
    // Armazenar última atualização
    lastUpdate: {
        timestamp: 0,
        source: null
    },

    // Verificar se há atualizações recentes
    checkForUpdates: function () {
        const lastUpdateStr = localStorage.getItem('finance_last_update');
        if (lastUpdateStr) {
            const lastUpdate = JSON.parse(lastUpdateStr);
            if (lastUpdate.timestamp > this.lastUpdate.timestamp) {
                console.log("Detectada atualização de dados em outro componente:", lastUpdate.source);
                this.lastUpdate = lastUpdate;
                return true;
            }
        }
        return false;
    },

    // Notificar que houve uma atualização
    notifyUpdate: function (source) {
        const update = {
            timestamp: Date.now(),
            source: source
        };

        this.lastUpdate = update;
        localStorage.setItem('finance_last_update', JSON.stringify(update));
    }
};

// Verificar atualizações periodicamente
setInterval(() => {
    if (FinanceEvents.checkForUpdates()) {
        console.log("Recarregando dados devido a atualização externa");
        loadReportData();
    }
}, 2000); // Verificar a cada 2 segundos

// Verificar autenticação
document.addEventListener('DOMContentLoaded', function () {
    // Verificar se o usuário está logado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.isLoggedIn) {
        window.location.href = 'login.html?unauthorized=true';
        return;
    }

    // Atualizar nome de usuário
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username || 'Usuário';
    }

    // Inicializar relatórios
    initializeReports();
});

// Detectar navegador Chrome em dispositivos móveis
const isChromeMobile = /Android.*Chrome\/[.0-9]*/.test(navigator.userAgent) ||
    /iPhone.*CriOS\/[.0-9]*/.test(navigator.userAgent) ||
    /iPad.*CriOS\/[.0-9]*/.test(navigator.userAgent);

// Atualizar função de inicialização
function initializeReports() {
    console.log("Inicializando relatórios...");
    console.log("User Agent:", navigator.userAgent);
    console.log("Chrome Mobile detectado:", isChromeMobile);

    // Verificar se há atualização recente antes de carregar
    FinanceEvents.checkForUpdates();

    // Configurar seletores de data
    setupDateSelectors();

    // Carregar dados com otimização para dispositivos móveis
    if (isChromeMobile) {
        // Código existente para Chrome mobile...
    } else {
        // Carregar dados imediatamente, sem atrasos
        Promise.resolve().then(() => {
            console.time('loadReportData');
            loadReportData();
            console.timeEnd('loadReportData');
        });
    }

    // Inicializar outras partes
    initTransactionsTable();
    setupExportButtons();
    setupMobileNavigation();

    // Configurar botões de depuração
    const forceReloadBtn = document.getElementById('force-reload');
    const clearCacheBtn = document.getElementById('clear-cache');
    const debugInfo = document.getElementById('debug-info');

    if (forceReloadBtn && clearCacheBtn && debugInfo) {
        // Botão para forçar recarregamento completo
        forceReloadBtn.addEventListener('click', function () {
            // Limpar caches
            window.cachedTransactions = null;
            window.lastTransactionLoad = 0;
            window.chartsInitialized = false;
            sessionStorage.clear();

            // Recarregar dados diretamente do localStorage
            const rawTransactions = localStorage.getItem('transactions');
            debugInfo.innerHTML = `
                <strong>Dados em localStorage:</strong><br>
                ${rawTransactions ? ('Encontrados ' + JSON.parse(rawTransactions).length + ' registros') : 'Nenhum dado encontrado'}
            `;

            // Forçar recarregamento
            loadReportData();
        });

        // Botão para limpar cache
        clearCacheBtn.addEventListener('click', function () {
            window.cachedTransactions = null;
            window.lastTransactionLoad = 0;
            window.chartsInitialized = false;
            sessionStorage.clear();
            debugInfo.innerHTML = 'Cache limpo com sucesso.';
        });
    }
}

// Configurar seletores de data
function setupDateSelectors() {
    const timePeriod = document.getElementById('time-period');
    const customDateRange = document.getElementById('custom-date-range');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const applyDateRange = document.getElementById('apply-date-range');

    // Definir datas padrão
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Inicializar com mês atual
    startDate.value = formatDateForInput(firstDayOfMonth);
    endDate.value = formatDateForInput(today);

    // Evento de mudança no seletor de período
    timePeriod.addEventListener('change', function () {
        if (this.value === 'custom') {
            customDateRange.style.display = 'flex';
        } else {
            customDateRange.style.display = 'none';

            // Definir intervalo baseado na seleção
            const { start, end } = getDateRange(this.value);
            startDate.value = formatDateForInput(start);
            endDate.value = formatDateForInput(end);

            // Recarregar dados
            loadReportData();
        }
    });

    // Evento para aplicar intervalo personalizado
    applyDateRange.addEventListener('click', function () {
        if (startDate.value && endDate.value) {
            loadReportData();
        } else {
            alert('Por favor, selecione datas válidas.');
        }
    });
}

// Obter intervalo de datas baseado na seleção
function getDateRange(period) {
    const today = new Date();
    let start, end;

    end = new Date(today);

    switch (period) {
        case 'month':
            // Mês atual
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'lastMonth':
            // Mês anterior
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'quarter':
            // Últimos 3 meses
            start = new Date(today);
            start.setMonth(start.getMonth() - 3);
            break;
        case 'year':
            // Ano atual
            start = new Date(today.getFullYear(), 0, 1);
            break;
        default:
            // Mês atual (padrão)
            start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return { start, end };
}

// Formatar data para input HTML
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Atualizar função loadReportData
function loadReportData() {
    console.log("Carregando dados do relatório...");

    try {
        // Obter datas do intervalo selecionado
        const startDate = new Date(document.getElementById('start-date').value);
        const endDate = new Date(document.getElementById('end-date').value);
        endDate.setHours(23, 59, 59, 999); // Final do dia

        // Cache para evitar recarregamentos desnecessários
        const cacheKey = `report_data_${startDate.getTime()}_${endDate.getTime()}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData && !FinanceEvents.checkForUpdates()) {
            console.log("Usando dados em cache");
            const data = JSON.parse(cachedData);

            // Atualizar elementos visuais com dados em cache
            updateTotalDisplay(data.totals);
            updateTransactionsTable(data.transactions);

            // Se os gráficos já foram renderizados, não recarregue
            if (!window.chartsInitialized) {
                loadChartData(data.transactions, startDate, endDate);
                window.chartsInitialized = true;
            }

            return;
        }

        // Carregar transações com performance otimizada
        const transactions = loadTransactionsOptimized();

        // Filtrar transações no intervalo de datas (usando método otimizado)
        const filteredTransactions = filterTransactionsByDate(transactions, startDate, endDate);

        // Calcular totais (usando método otimizado com memoization)
        const totals = calculateReportTotals(filteredTransactions);

        // Atualizar elementos visuais
        updateTotalDisplay(totals);
        loadChartData(filteredTransactions, startDate, endDate);
        updateTransactionsTable(filteredTransactions);

        // Armazenar em cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
            transactions: filteredTransactions,
            totals: totals,
            timestamp: Date.now()
        }));

        // Marcar gráficos como inicializados
        window.chartsInitialized = true;

        console.log("Dados carregados com sucesso");
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        // Código de tratamento de erro existente...
    }
}

// Função otimizada para carregar transações
function loadTransactionsOptimized() {
    console.time('loadTransactions');

    try {
        // Tentar buscar transações do localStorage
        const transactionsJson = localStorage.getItem('transactions');

        // Verificar se há dados no localStorage
        if (!transactionsJson) {
            console.log("Nenhuma transação encontrada no localStorage");
            console.timeEnd('loadTransactions');
            return [];
        }

        // Tentar fazer o parse do JSON
        const transactions = JSON.parse(transactionsJson);

        // Verificar se o resultado é um array
        if (!Array.isArray(transactions)) {
            console.error("As transações não são um array:", transactions);
            console.timeEnd('loadTransactions');
            return [];
        }

        // Verificar se há dados inválidos
        const validTransactions = transactions.filter(transaction => {
            // Verificar campos obrigatórios
            const hasRequiredFields =
                transaction &&
                transaction.type &&
                transaction.amount &&
                transaction.date;

            // Verificar se o tipo é válido
            const hasValidType =
                transaction.type === 'income' ||
                transaction.type === 'expense';

            // Verificar se o valor é numérico
            const hasValidAmount = !isNaN(parseFloat(transaction.amount));

            // Se alguma verificação falhar, registrar
            if (!hasRequiredFields || !hasValidType || !hasValidAmount) {
                console.warn("Transação inválida ignorada:", transaction);
            }

            return hasRequiredFields && hasValidType && hasValidAmount;
        });

        // Registrar estatísticas
        console.log(`Total de transações: ${transactions.length}, Válidas: ${validTransactions.length}`);

        // Cache em memória para otimizar próximos acessos
        window.cachedTransactions = validTransactions;
        window.lastTransactionLoad = Date.now();

        console.timeEnd('loadTransactions');
        return validTransactions;
    } catch (e) {
        console.error("Erro ao carregar transações:", e);
        console.timeEnd('loadTransactions');
        return [];
    }
}

// Calcular totais para o relatório
function calculateReportTotals(transactions) {
    console.log("Calculando totais do relatório para", transactions.length, "transações");

    const totals = {
        income: 0,
        expenses: 0,
        balance: 0,
        savingsRate: 0
    };

    // Verificar se há transações
    if (!transactions || transactions.length === 0) {
        console.log("Nenhuma transação para calcular totais");
        return totals;
    }

    // Depurar valores de cada transação para encontrar possíveis problemas
    transactions.forEach((transaction, index) => {
        // Verificar se o valor é válido
        const amount = parseFloat(transaction.amount);

        if (isNaN(amount)) {
            console.error(`Transação ${index} com valor inválido:`, transaction);
            return; // Pular esta transação
        }

        if (transaction.type === 'income') {
            totals.income += amount;
            console.log(`Receita adicionada: ${amount}. Total atual: ${totals.income}`);
        } else if (transaction.type === 'expense') {
            totals.expenses += amount;
            console.log(`Despesa adicionada: ${amount}. Total atual: ${totals.expenses}`);
        } else {
            console.warn(`Tipo de transação desconhecido: ${transaction.type}`);
        }
    });

    // Calcular saldo
    totals.balance = totals.income - totals.expenses;

    // Calcular taxa de economia (se receita > 0)
    if (totals.income > 0) {
        totals.savingsRate = ((totals.income - totals.expenses) / totals.income) * 100;
    }

    console.log("Totais calculados:", totals);

    return totals;
}

// Atualizar exibição de totais
function updateTotalDisplay(totals) {
    console.log("Atualizando exibição de totais:", totals);

    // Garantir que os elementos existem antes de tentar atualizá-los
    const incomeElement = document.getElementById('report-total-income');
    const expensesElement = document.getElementById('report-total-expenses');
    const balanceElement = document.getElementById('report-balance');
    const savingsElement = document.getElementById('savings-rate');

    if (!incomeElement || !expensesElement || !balanceElement || !savingsElement) {
        console.error("Elementos de exibição de totais não encontrados no DOM");
        return;
    }

    // Atualizar valores com formatação
    incomeElement.textContent = formatCurrency(totals.income);
    expensesElement.textContent = formatCurrency(totals.expenses);
    balanceElement.textContent = formatCurrency(totals.balance);

    // Formatar e atualizar taxa de economia
    const savingsRate = isNaN(totals.savingsRate) ? 0 : Math.round(totals.savingsRate);
    savingsElement.textContent = `${savingsRate}%`;

    console.log("Exibição de totais atualizada com sucesso");
}

// Formatar valor como moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Carregar dados para os gráficos
function loadChartData(transactions, startDate, endDate) {
    // Dados para gráfico de receitas vs despesas
    createIncomeExpenseChart(transactions);

    // Dados para gráfico de categorias de despesas
    createExpenseCategoriesChart(transactions);

    // Dados para gráfico de tendência do saldo
    createBalanceTrendChart(transactions, startDate, endDate);

    // Dados para gráfico de comparação mensal
    createMonthlyComparisonChart(transactions);
}

// Criar gráfico de receitas vs despesas
function createIncomeExpenseChart(transactions) {
    // Agrupar transações por mês
    const monthlyData = groupTransactionsByMonth(transactions);

    // Preparar dados para o gráfico
    const months = Object.keys(monthlyData);
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expenses);

    // Obter contexto do canvas
    const canvas = document.getElementById('income-expense-chart');
    if (!canvas) {
        console.error("Canvas para gráfico não encontrado");
        return;
    }

    // Verificar dimensões do canvas
    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.log("Canvas com dimensão zero, adiando renderização");

        // Para Chrome Mobile: tentar redimensionar o canvas
        if (isChromeMobile) {
            canvas.style.width = '100%';
            canvas.style.height = '250px';

            // Tentar novamente após um pequeno delay
            setTimeout(() => createIncomeExpenseChart(transactions), 300);
            return;
        }
    }

    const ctx = canvas.getContext('2d');

    // Destruir gráfico anterior se existir
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.destroy();
    }

    // Criar novo gráfico com configurações otimizadas para mobile
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: isChromeMobile ? false : true, // Desabilitar animações no Chrome Mobile
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    maxTicksLimit: 5, // Menos marcações no eixo y para mobile
                    callback: function (value) {
                        return 'R$ ' + value;
                    }
                }
            },
            x: {
                ticks: {
                    maxTicksLimit: isChromeMobile ? 4 : 10 // Menos labels no eixo x para mobile
                }
            }
        },
        plugins: {
            legend: {
                display: !isChromeMobile || window.innerWidth > 480 // Esconder legenda em telas muito pequenas
            }
        }
    };

    window.incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: options
    });
}

// Criar gráfico de categorias de despesas
function createExpenseCategoriesChart(transactions) {
    // Para simplificar, vamos usar descrições como categorias
    const expensesByCategory = {};

    // Filtra apenas despesas
    const expenses = transactions.filter(t => t.type === 'expense');

    // Agrupa por descrição (simulando categorias)
    expenses.forEach(expense => {
        const category = expense.description; // Na versão final, usar categoria real
        if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += parseFloat(expense.amount);
    });

    // Preparar dados para o gráfico
    const categories = Object.keys(expensesByCategory);
    const values = categories.map(cat => expensesByCategory[cat]);

    // Gerar cores aleatórias
    const backgroundColors = categories.map(() => getRandomColor(0.6));
    const borderColors = categories.map(() => getRandomColor(1));

    // Obter contexto do canvas
    const ctx = document.getElementById('expense-categories-chart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (window.expenseCategoriesChart) {
        window.expenseCategoriesChart.destroy();
    }

    // Criar novo gráfico
    window.expenseCategoriesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [
                {
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            return `${context.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Criar gráfico de tendência do saldo
function createBalanceTrendChart(transactions, startDate, endDate) {
    // Criar um array de dias no intervalo
    const dateRange = getDatesInRange(startDate, endDate);

    // Inicializar dados do saldo
    const balanceData = {};
    dateRange.forEach(date => {
        balanceData[formatDateForDisplay(date)] = 0;
    });

    // Calcular saldo cumulativo
    let cumulativeBalance = 0;

    // Ordenar transações por data
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // Calcular saldo para cada dia com transações
    sortedTransactions.forEach(transaction => {
        const transactionDate = formatDateForDisplay(new Date(transaction.date));

        if (transaction.type === 'income') {
            cumulativeBalance += parseFloat(transaction.amount);
        } else {
            cumulativeBalance -= parseFloat(transaction.amount);
        }

        balanceData[transactionDate] = cumulativeBalance;
    });

    // Propagar o saldo para os dias sem transações
    let lastBalance = 0;
    Object.keys(balanceData).sort().forEach(date => {
        if (balanceData[date] === 0) {
            balanceData[date] = lastBalance;
        } else {
            lastBalance = balanceData[date];
        }
    });

    // Preparar dados para o gráfico
    const dates = Object.keys(balanceData);
    const balances = dates.map(date => balanceData[date]);

    // Obter contexto do canvas
    const ctx = document.getElementById('balance-trend-chart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (window.balanceTrendChart) {
        window.balanceTrendChart.destroy();
    }

    // Criar novo gráfico
    window.balanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Saldo',
                    data: balances,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            return 'R$ ' + value;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 10
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            return `Saldo: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Criar gráfico de comparação mensal
function createMonthlyComparisonChart(transactions) {
    // Obter todos os meses com transações
    const allMonths = {};

    // Preencher ultimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        allMonths[monthKey] = {
            income: 0,
            expenses: 0,
            label: getMonthName(date.getMonth()) + ' ' + date.getFullYear()
        };
    }

    // Agrupar transações por mês
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (allMonths[monthKey]) {
            if (transaction.type === 'income') {
                allMonths[monthKey].income += parseFloat(transaction.amount);
            } else {
                allMonths[monthKey].expenses += parseFloat(transaction.amount);
            }
        }
    });

    // Preparar dados para o gráfico
    const months = Object.keys(allMonths).sort();
    const labels = months.map(month => allMonths[month].label);
    const incomeData = months.map(month => allMonths[month].income);
    const expenseData = months.map(month => allMonths[month].expenses);
    const balanceData = months.map(month => allMonths[month].income - allMonths[month].expenses);

    // Obter contexto do canvas
    const ctx = document.getElementById('monthly-comparison-chart').getContext('2d');

    // Destruir gráfico anterior se existir
    if (window.monthlyComparisonChart) {
        window.monthlyComparisonChart.destroy();
    }

    // Criar novo gráfico
    window.monthlyComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: 'rgba(46, 204, 113, 0.6)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    order: 2
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    order: 3
                },
                {
                    label: 'Saldo',
                    data: balanceData,
                    type: 'line',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Agrupar transações por mês
function groupTransactionsByMonth(transactions) {
    const monthlyData = {};

    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = getMonthName(date.getMonth()) + ' ' + date.getFullYear();

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (transaction.type === 'income') {
            monthlyData[monthKey].income += parseFloat(transaction.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(transaction.amount);
        }
    });

    return monthlyData;
}

// Obter nome do mês
function getMonthName(monthIndex) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[monthIndex];
}

// Gerar cor aleatória para gráficos
function getRandomColor(alpha) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Obter array de datas no intervalo
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// Formatar data para exibição
function formatDateForDisplay(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Formatar data para exibição no formato BR
function formatDateBR(date) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
}

// Inicializar tabela de transações
function initTransactionsTable() {
    // Configurar busca
    const searchInput = document.getElementById('transaction-search');
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        filterTransactionsTable(searchTerm);
    });

    // Configurar ordenação
    const sortSelect = document.getElementById('table-sort');
    sortSelect.addEventListener('change', function () {
        const sortValue = this.value;
        sortTransactionsTable(sortValue);
    });
}

// Atualizar tabela de transações
function updateTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    tableBody.innerHTML = '';

    // Armazenar transações para referência
    window.tableTransactions = transactions;

    // Aplicar ordenação padrão (mais recente primeiro)
    const sortOrder = document.getElementById('table-sort').value || 'date-desc';
    const sortedTransactions = sortTransactions(transactions, sortOrder);

    // Renderizar transações
    renderTransactionsTable(sortedTransactions);
}

// Renderizar transações na tabela
function renderTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    tableBody.innerHTML = '';

    if (transactions.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" class="empty-table">Nenhuma transação encontrada no período.</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }

    transactions.forEach(transaction => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${formatDateForDisplay(new Date(transaction.date))}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type}">${transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
            <td>
                <span class="status-indicator ${transaction.status === 'paid' ? 'status-paid' : 'status-pending'}"></span>
                ${transaction.status === 'paid' ? 'Pago' : 'Pendente'}
            </td>
            <td class="${transaction.type}">${formatCurrency(transaction.amount)}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Filtrar transações na tabela
function filterTransactionsTable(searchTerm) {
    if (!window.tableTransactions) return;

    const filteredTransactions = window.tableTransactions.filter(transaction => {
        return (
            transaction.description.toLowerCase().includes(searchTerm) ||
            formatDateForDisplay(new Date(transaction.date)).includes(searchTerm) ||
            formatCurrency(transaction.amount).includes(searchTerm)
        );
    });

    // Aplicar ordenação atual
    const sortOrder = document.getElementById('table-sort').value || 'date-desc';
    const sortedTransactions = sortTransactions(filteredTransactions, sortOrder);

    // Atualizar tabela
    renderTransactionsTable(sortedTransactions);
}

// Ordenar transações na tabela
function sortTransactionsTable(sortOrder) {
    if (!window.tableTransactions) return;

    const sortedTransactions = sortTransactions(window.tableTransactions, sortOrder);
    renderTransactionsTable(sortedTransactions);
}

// Ordenar transações
function sortTransactions(transactions, sortOrder) {
    const sortedTransactions = [...transactions];

    switch (sortOrder) {
        case 'date-desc':
            sortedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            sortedTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-desc':
            sortedTransactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
            break;
        case 'amount-asc':
            sortedTransactions.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
            break;
    }

    return sortedTransactions;
}

// Configurar botões de exportação
function setupExportButtons() {
    // PDF
    document.getElementById('export-pdf').addEventListener('click', function () {
        exportToPDF();
    });

    // Excel
    document.getElementById('export-excel').addEventListener('click', function () {
        exportToExcel();
    });

    // CSV
    document.getElementById('export-csv').addEventListener('click', function () {
        exportToCSV();
    });
}

// Mostrar estado de carregamento no botão
function showButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);

    if (isLoading) {
        button.classList.add('loading');
        button.innerHTML = `<i class="fas fa-spinner"></i> Processando...`;
    } else {
        button.classList.remove('loading');

        // Restaurar conteúdo original do botão
        if (buttonId === 'export-pdf') {
            button.innerHTML = `<i class="fas fa-file-pdf"></i> Exportar PDF`;
        } else if (buttonId === 'export-excel') {
            button.innerHTML = `<i class="fas fa-file-excel"></i> Exportar Excel`;
        } else if (buttonId === 'export-csv') {
            button.innerHTML = `<i class="fas fa-file-csv"></i> Exportar CSV`;
        }
    }
}

// Exportar para PDF
function exportToPDF() {
    if (!window.tableTransactions || window.tableTransactions.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    // Mostrar loading
    showButtonLoading('export-pdf', true);

    setTimeout(() => {
        try {
            // Obter período do relatório
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const periodText = `Período: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`;

            // Obter totais
            const totalIncome = document.getElementById('report-total-income').textContent;
            const totalExpenses = document.getElementById('report-total-expenses').textContent;
            const balance = document.getElementById('report-balance').textContent;

            // Criar documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Adicionar cabeçalho
            doc.setFontSize(18);
            doc.setTextColor(46, 125, 50); // Cor verde
            doc.text('Relatório Financeiro', 105, 15, { align: 'center' });

            // Adicionar período
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100); // Cor cinza
            doc.text(periodText, 105, 23, { align: 'center' });

            // Adicionar informações do usuário
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            doc.setFontSize(10);
            doc.text(`Usuário: ${user.username || 'Não identificado'}`, 105, 30, { align: 'center' });
            doc.text(`Data de emissão: ${formatDateBR(new Date().toISOString().split('T')[0])}`, 105, 35, { align: 'center' });

            // Adicionar resumo financeiro
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0); // Cor preta
            doc.text('Resumo Financeiro', 14, 45);

            doc.setFontSize(10);
            doc.setTextColor(46, 125, 50); // Cor verde para receitas
            doc.text(`Receitas: ${totalIncome}`, 14, 52);

            doc.setTextColor(231, 76, 60); // Cor vermelha para despesas
            doc.text(`Despesas: ${totalExpenses}`, 70, 52);

            // Definir cor para o saldo (verde se positivo, vermelho se negativo)
            if (balance.includes('-')) {
                doc.setTextColor(231, 76, 60); // Vermelho se negativo
            } else {
                doc.setTextColor(46, 125, 50); // Verde se positivo
            }
            doc.text(`Saldo: ${balance}`, 130, 52);

            // Adicionar tabela de transações
            doc.setTextColor(0, 0, 0); // Voltar para preto
            doc.text('Detalhamento de Transações', 14, 65);

            // Preparar dados da tabela
            const tableColumn = ["Data", "Descrição", "Tipo", "Status", "Valor"];
            const tableRows = [];

            window.tableTransactions.forEach(transaction => {
                const dateFormatted = formatDateBR(transaction.date);
                const type = transaction.type === 'income' ? 'Receita' : 'Despesa';
                const status = transaction.status === 'paid' ? 'Pago' : 'Pendente';
                const value = formatCurrency(transaction.amount);

                tableRows.push([dateFormatted, transaction.description, type, status, value]);
            });

            // Adicionar tabela automaticamente
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: {
                    fillColor: [76, 175, 80],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [240, 240, 240] },
                columnStyles: {
                    4: { halign: 'right' } // Alinhar valores à direita
                }
            });

            // Adicionar rodapé
            const finalY = doc.lastAutoTable.finalY || 70;
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Relatório gerado pelo sistema Finanças Pessoais | Desenvolvido por Ivonildo Lima', 105, finalY + 15, { align: 'center' });

            // Data atual no rodapé
            const today = new Date();
            const dateString = today.toLocaleDateString('pt-BR');
            const timeString = today.toLocaleTimeString('pt-BR');
            doc.text(`Gerado em: ${dateString} às ${timeString}`, 105, finalY + 20, { align: 'center' });

            // Salvar o PDF
            doc.save('relatorio-financeiro.pdf');

            // Quando terminar, remover loading
            showButtonLoading('export-pdf', false);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
            showButtonLoading('export-pdf', false);
        }
    }, 500);
}

// Exportar para Excel
function exportToExcel() {
    if (!window.tableTransactions || window.tableTransactions.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    // Mostrar loading
    showButtonLoading('export-excel', true);

    setTimeout(() => {
        try {
            // Criar novo workbook
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Finanças Pessoais';
            workbook.lastModifiedBy = 'Sistema de Relatórios';
            workbook.created = new Date();
            workbook.modified = new Date();

            // Adicionar planilha
            const worksheet = workbook.addWorksheet('Relatório Financeiro');

            // Estilizar cabeçalho da planilha
            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'Relatório Financeiro';
            titleCell.font = {
                name: 'Arial',
                size: 16,
                bold: true,
                color: { argb: '2E7D32' }
            };
            titleCell.alignment = { horizontal: 'center' };

            // Obter período do relatório
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            // Adicionar informações do período
            worksheet.mergeCells('A2:E2');
            const periodCell = worksheet.getCell('A2');
            periodCell.value = `Período: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`;
            periodCell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: '666666' }
            };
            periodCell.alignment = { horizontal: 'center' };

            // Adicionar informações do usuário
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            worksheet.mergeCells('A3:E3');
            const userCell = worksheet.getCell('A3');
            userCell.value = `Usuário: ${user.username || 'Não identificado'} | Data de emissão: ${formatDateBR(new Date().toISOString().split('T')[0])}`;
            userCell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: '666666' }
            };
            userCell.alignment = { horizontal: 'center' };

            // Adicionar resumo financeiro
            worksheet.mergeCells('A5:E5');
            const summaryTitleCell = worksheet.getCell('A5');
            summaryTitleCell.value = 'Resumo Financeiro';
            summaryTitleCell.font = {
                name: 'Arial',
                size: 12,
                bold: true
            };

            // Adicionar receitas, despesas e saldo
            const totalIncome = document.getElementById('report-total-income').textContent;
            const totalExpenses = document.getElementById('report-total-expenses').textContent;
            const balance = document.getElementById('report-balance').textContent;

            worksheet.getCell('A6').value = 'Receitas:';
            worksheet.getCell('B6').value = totalIncome;
            worksheet.getCell('B6').font = {
                color: { argb: '2E7D32' },
                bold: true
            };

            worksheet.getCell('C6').value = 'Despesas:';
            worksheet.getCell('D6').value = totalExpenses;
            worksheet.getCell('D6').font = {
                color: { argb: 'E74C3C' },
                bold: true
            };

            worksheet.getCell('E6').value = 'Saldo:';
            worksheet.getCell('F6').value = balance;
            worksheet.getCell('F6').font = {
                color: { argb: balance.includes('-') ? 'E74C3C' : '2E7D32' },
                bold: true
            };

            // Adicionar cabeçalho da tabela de transações
            worksheet.addRow([]);
            worksheet.addRow(['Detalhamento de Transações']);
            const detailTitleCell = worksheet.getCell('A8');
            detailTitleCell.font = {
                name: 'Arial',
                size: 12,
                bold: true
            };

            // Definir cabeçalhos da tabela
            const headerRow = worksheet.addRow(['Data', 'Descrição', 'Tipo', 'Status', 'Valor']);
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '4CAF50' }
                };
                cell.font = {
                    color: { argb: 'FFFFFF' },
                    bold: true
                };
                cell.alignment = { horizontal: 'center' };
            });

            // Adicionar dados das transações
            window.tableTransactions.forEach(transaction => {
                const row = worksheet.addRow([
                    formatDateBR(transaction.date),
                    transaction.description,
                    transaction.type === 'income' ? 'Receita' : 'Despesa',
                    transaction.status === 'paid' ? 'Pago' : 'Pendente',
                    formatCurrency(transaction.amount)
                ]);

                // Estilizar células de acordo com o tipo
                const typeCell = row.getCell(3);
                const valueCell = row.getCell(5);

                if (transaction.type === 'income') {
                    typeCell.font = {
                        color: { argb: '2E7D32' }
                    };
                    valueCell.font = {
                        color: { argb: '2E7D32' }
                    };
                } else {
                    typeCell.font = {
                        color: { argb: 'E74C3C' }
                    };
                    valueCell.font = {
                        color: { argb: 'E74C3C' }
                    };
                }

                // Alinhar valor à direita
                valueCell.alignment = { horizontal: 'right' };
            });

            // Ajustar largura das colunas
            worksheet.columns.forEach(column => {
                column.width = 20;
            });

            // Adicionar rodapé
            const lastRow = worksheet.lastRow.number + 2;
            worksheet.mergeCells(`A${lastRow}:E${lastRow}`);
            const footerCell = worksheet.getCell(`A${lastRow}`);
            footerCell.value = 'Relatório gerado pelo sistema Finanças Pessoais | Desenvolvido por Ivonildo Lima';
            footerCell.font = {
                name: 'Arial',
                size: 8,
                color: { argb: '666666' }
            };
            footerCell.alignment = { horizontal: 'center' };

            // Data no rodapé
            worksheet.mergeCells(`A${lastRow + 1}:E${lastRow + 1}`);
            const dateFooterCell = worksheet.getCell(`A${lastRow + 1}`);
            const today = new Date();
            dateFooterCell.value = `Gerado em: ${today.toLocaleDateString('pt-BR')} às ${today.toLocaleTimeString('pt-BR')}`;
            dateFooterCell.font = {
                name: 'Arial',
                size: 8,
                color: { argb: '666666' }
            };
            dateFooterCell.alignment = { horizontal: 'center' };

            // Gerar arquivo
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                saveAs(blob, 'relatorio-financeiro.xlsx');

                // Quando terminar, remover loading
                showButtonLoading('export-excel', false);
            });
        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            alert('Ocorreu um erro ao gerar o Excel. Por favor, tente novamente.');
            showButtonLoading('export-excel', false);
        }
    }, 500);
}

// Exportar para CSV
function exportToCSV() {
    if (!window.tableTransactions || window.tableTransactions.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    // Mostrar loading
    showButtonLoading('export-csv', true);

    setTimeout(() => {
        try {
            // Cabeçalhos
            let csvContent = 'Data,Descrição,Tipo,Status,Valor\n';

            // Dados
            window.tableTransactions.forEach(transaction => {
                const row = [
                    formatDateBR(transaction.date),
                    transaction.description.replace(/,/g, ';'), // Evitar problemas com vírgulas
                    transaction.type === 'income' ? 'Receita' : 'Despesa',
                    transaction.status === 'paid' ? 'Pago' : 'Pendente',
                    formatCurrency(transaction.amount)
                ];

                csvContent += row.join(',') + '\n';
            });

            // Criar blob e link para download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            // Criar link para download
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'relatorio-financeiro.csv');
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Quando terminar, remover loading
            showButtonLoading('export-csv', false);
        } catch (error) {
            console.error('Erro ao gerar CSV:', error);
            alert('Ocorreu um erro ao gerar o CSV. Por favor, tente novamente.');
            showButtonLoading('export-csv', false);
        }
    }, 500);
}

// Configurar navegação mobile
function setupMobileNavigation() {
    // Quick Add Button
    const quickAddBtn = document.getElementById('quickAddBtn');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', function () {
            window.location.href = 'dashboard.html#add-transaction';
        });
    }

    // Mobile Nav Items
    const navItems = document.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => {
        if (!item.id || item.id !== 'mobileAddBtn') {
            item.addEventListener('click', function (e) {
                if (this.getAttribute('href') !== 'reports.html') {
                    e.preventDefault();

                    // Navegação baseada no ícone
                    const icon = this.querySelector('i').className;

                    if (icon.includes('home')) {
                        window.location.href = 'dashboard.html';
                    } else if (icon.includes('calendar')) {
                        window.location.href = 'dashboard.html#due-dates';
                    }
                }
            });
        }
    });
}

// Filtrar transações por data
function filterTransactionsByDate(transactions, startDate, endDate) {
    console.log(`Filtrando transações entre ${startDate.toDateString()} e ${endDate.toDateString()}`);

    if (!transactions || transactions.length === 0) {
        console.log("Nenhuma transação para filtrar");
        return [];
    }

    // Converter datas para timestamps para comparação mais rápida
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    const filtered = transactions.filter(transaction => {
        try {
            // Verificar se a data é válida
            if (!transaction.date) {
                console.warn("Transação sem data:", transaction);
                return false;
            }

            const transactionDate = new Date(transaction.date);

            // Verificar se a data é válida
            if (isNaN(transactionDate.getTime())) {
                console.warn("Data inválida na transação:", transaction);
                return false;
            }

            const transactionTimestamp = transactionDate.getTime();

            // Verificar se a data está no intervalo
            return transactionTimestamp >= startTimestamp && transactionTimestamp <= endTimestamp;
        } catch (e) {
            console.error("Erro ao filtrar transação:", e, transaction);
            return false;
        }
    });

    console.log(`Filtro: ${filtered.length} de ${transactions.length} transações no período`);
    return filtered;
}