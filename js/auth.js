// auth.js - Sistema de autenticação melhorado

// Usuários cadastrados no sistema (em um sistema real, isso estaria em um banco de dados)
const registeredUsers = [
    { username: "vanio", password: "@ivo01" },
];

// Function to handle user login
function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validar se os campos estão preenchidos
    if (!username || !password) {
        showError('Por favor, preencha o nome de usuário e senha.');
        return;
    }

    // Verificar se o usuário existe
    const userFound = registeredUsers.find(
        user => user.username === username && user.password === password
    );

    if (userFound) {
        // Não armazenar a senha no localStorage por segurança
        const userData = { 
            username: userFound.username, 
            isLoggedIn: true,
            loginTime: Date.now(),
            sessionExpires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        };
        localStorage.setItem('user', JSON.stringify(userData));
        window.location.href = 'dashboard.html';
    } else {
        showError('Usuário ou senha incorretos. Tente novamente.');
    }
}

// Função para mostrar mensagens de erro
function showError(message) {
    const errorElement = document.getElementById('login-error') || createErrorElement();
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Criar elemento de erro se não existir
function createErrorElement() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'login-error';
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '10px';

    const loginForm = document.getElementById('loginForm');
    loginForm.appendChild(errorDiv);

    return errorDiv;
}

// Function to handle user logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Function to check if user is logged in
function checkLogin() {
    const currentPage = window.location.pathname.split('/').pop();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Páginas que não requerem autenticação
    const publicPages = ['login.html', 'index.html', '', 'register.html'];
    const isPublicPage = publicPages.includes(currentPage);

    // Verificar se a sessão expirou
    if (user.sessionExpires && user.sessionExpires < Date.now()) {
        console.log("Sessão expirada");
        localStorage.removeItem('user');
        user.isLoggedIn = false;
        
        if (!isPublicPage) {
            window.location.href = 'login.html?expired=true';
            return;
        }
    }

    // Se estiver em uma página pública e já estiver logado, redirecionar para o dashboard
    if (isPublicPage && user.isLoggedIn) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Se estiver em uma página protegida e não estiver logado, redirecionar para login
    if (!isPublicPage && !user.isLoggedIn) {
        window.location.href = 'login.html?unauthorized=true';
        return;
    }
}

// Função para alternar visibilidade da senha
function togglePassword() {
    const passwordInput = document.getElementById('password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
}

// Verificar parâmetros de URL e mostrar mensagens correspondentes
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('unauthorized')) {
        showError('Acesso não autorizado. Por favor, faça login para continuar.');
    }
    
    if (urlParams.has('expired')) {
        showError('Sua sessão expirou. Por favor, faça login novamente.');
    }
}

// Inicializar event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    // Verificar login em todas as páginas
    checkLogin();
    
    // Verificar se estamos na página de login
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = ['login.html', 'index.html', ''].includes(currentPage);

    if (isLoginPage) {
        // Verificar parâmetros da URL
        checkUrlParams();
        
        // Adicionar event listeners para o formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', login);
        }

        // Adicionar event listener para o botão de alternar senha
        const togglePasswordBtn = document.getElementById('togglePasswordBtn');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', togglePassword);
        }
    }
    
    // Verificações periódicas de autenticação (a cada 5 minutos)
    setInterval(checkLogin, 5 * 60 * 1000);
});