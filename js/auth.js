// auth.js

const API_URL = 'http://localhost:3000/users'; // Change if using another server

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `px-4 py-2 rounded shadow text-white animate-slide-in 
    ${type === "success" ? "bg-green-500" : "bg-red-500"}`;

  toast.innerText = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => toast.remove(), 500); // Remove after fade
  }, 3000);
}
let isLogin = true;

// DOM elements
const formTitle = document.getElementById('form-title');
const formDescription = document.getElementById('form-description');
const nameField = document.getElementById('name-field');
const confirmPasswordField = document.getElementById('confirm-password-field');
const forgotPassword = document.getElementById('forgot-password');
const submitText = document.getElementById('submit-text');
const toggleText = document.getElementById('toggle-text');
const toggleMode = document.getElementById('toggle-mode');
const authForm = document.getElementById('auth-form');

// Update form based on mode
function updateForm() {
  if (isLogin) {
    formTitle.textContent = 'Welcome back';
    formDescription.textContent = 'Sign in to your account to continue';
    nameField.classList.add('hidden');
    confirmPasswordField.classList.add('hidden');
    forgotPassword.classList.remove('hidden');
    submitText.textContent = 'Sign In';
    toggleText.innerHTML = "Don't have an account? ";
    toggleMode.textContent = 'Sign up';

    document.getElementById('name').removeAttribute('required');
    document.getElementById('confirm-password').removeAttribute('required');
  } else {
    formTitle.textContent = 'Create account';
    formDescription.textContent = 'Join thousands who split expenses effortlessly';
    nameField.classList.remove('hidden');
    confirmPasswordField.classList.remove('hidden');
    forgotPassword.classList.add('hidden');
    submitText.textContent = 'Create Account';
    toggleText.innerHTML = 'Already have an account? ';
    toggleMode.textContent = 'Sign in';

    document.getElementById('name').setAttribute('required', '');
    document.getElementById('confirm-password').setAttribute('required', '');
  }
}

// Toggle between login and signup
toggleMode.addEventListener('click', () => {
  isLogin = !isLogin;
  updateForm();

  const formContainer = document.querySelector('.form-container');
  formContainer.style.animation = 'none';
  formContainer.offsetHeight;
  formContainer.style.animation = 'fadeIn 0.3s ease-out, scaleIn 0.2s ease-out';
});

// Handle form submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(authForm);
  const data = Object.fromEntries(formData);
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(data.email)) {
    showToast("Please enter a valid email address!", "error");
    return;
  }
    // yha par sab check krna h email and password
  if (!isLogin && data.password !== data['confirm-password']) {
    showToast('Passwords do not match!',"error");
    return;
  }

  const password = data.password;
  const passwordRules = [
    { regex: /.{6,}/, message: "Password must be at least 6 characters long" },
    { regex: /[A-Z]/, message: "Password must contain at least one uppercase letter" },
    { regex: /[a-z]/, message: "Password must contain at least one lowercase letter" },
    { regex: /\d/, message: "Password must contain at least one number" },
    { regex: /[@$!%*?&]/, message: "Password must contain at least one special character (@, $, !, %, *, ?, &)" }
  ];

  for (let rule of passwordRules) {
    if (!rule.regex.test(password)) {
      showToast(rule.message, "error");
      return;
    }
  }

  try {
    if (isLogin) {
      // LOGIN FLOW
      const response = await fetch(`${API_URL}?email=${data.email}&password=${data.password}`);
      const users = await response.json();

      if (users.length > 0) {
        showToast('Login successful!',"success");
        localStorage.setItem('user', JSON.stringify(users[0]));  // TAAKI HOME PAGE PAR NAAM DIKHA SKE
        setTimeout(()=>{
          window.location.href = 'home.html'; // redirect after login
        },500)
       
      } else {
        showToast('Invalid email or password!',"error");
      }
    } else {
      // SIGNUP FLOW
      const checkResponse = await fetch(`${API_URL}?email=${data.email}`);
      const existing = await checkResponse.json();

      if (existing.length > 0) {
        showToast('User already exists with this email!',"error");
        return;
      }
     
      const newUser = {
        id:Date.now().toString(),
        name: data.name,
        email: data.email,
        password: data.password
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        showToast('Account created successfully!',"success");
        isLogin = true;
        updateForm();
      } else {
        showToast('Error creating account!',"error");
      }
    }
  } catch (error) {
    console.error('Auth Error:', error);
    showToast('Something went wrong!',"error");
  }
});

// Input animations
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.style.transform = 'scale(1.02)';
  });
  input.addEventListener('blur', () => {
    input.parentElement.style.transform = 'scale(1)';
  });
});

// Initial load
updateForm();
