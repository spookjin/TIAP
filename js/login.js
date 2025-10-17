const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  // Limpar mensagens anteriores
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';

  console.log('Tentativa de login:', {
    username: username,
    password: password,
    rememberMe: rememberMe,
    timestamp: new Date().toISOString(),
  });

  successMessage.textContent = '✓ Login realizado com sucesso! Redirecionando para o sistema...';
  successMessage.style.display = 'block';

  setTimeout(() => {
    form.reset();
    successMessage.style.display = 'none';
  }, 2000);
});

// Bloqueia links placeholder "#"
document.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', function (e) {
    if (this.getAttribute('href') === '#') {
      e.preventDefault();
      alert('Esta funcionalidade será implementada em breve!');
    }
  });
});

// Efeitos de foco nos inputs
const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
inputs.forEach((input) => {
  input.addEventListener('focus', function () {
    this.parentElement.style.transform = 'scale(1.01)';
  });
  input.addEventListener('blur', function () {
    this.parentElement.style.transform = 'scale(1)';
  });
});
