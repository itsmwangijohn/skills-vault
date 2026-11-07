// Initialize Supabase Client with your Project URL and Publishable Key
const SUPABASE_URL = 'https://tvjqcwghvhaaiguhmib.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_11UysRn1OdlsqvfMVP_0Og_WWG2PVo9'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// DOM Elements
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const authMessage = document.getElementById('authMessage');

const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');

const userEmailDisplay = document.getElementById('userEmailDisplay');
const skillForm = document.getElementById('skillForm');
const skillsList = document.getElementById('skillsList');
const statSkills = document.getElementById('statSkills');
const statHours = document.getElementById('statHours');

// View Toggles
showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginSection.classList.add('hidden');
  registerSection.classList.remove('hidden');
  hideMessage();
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  hideMessage();
});

function showMessage(text, type = 'error') {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
}

function hideMessage() {
  authMessage.className = 'message hidden';
}

// Auth: Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password }])
    .select();

  if (error) {
    if (error.code === '23505') {
      showMessage('Email is already registered!');
    } else {
      showMessage('Registration failed: ' + error.message);
    }
    return;
  }

  showMessage('Account created successfully! Please sign in.', 'success');
  registerForm.reset();
  setTimeout(() => showLogin.click(), 1200);
});

// Auth: Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) {
    showMessage('Invalid email or password.');
    return;
  }

  currentUser = data;
  localStorage.setItem('sv_session', JSON.stringify(data));
  loginForm.reset();
  hideMessage();
  loadDashboard();
});

// Auth: Logout
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('sv_session');
  dashboardContainer.classList.add('hidden');
  authContainer.classList.remove('hidden');
});

// Dashboard Management
function loadDashboard() {
  authContainer.classList.add('hidden');
  dashboardContainer.classList.remove('hidden');
  userEmailDisplay.textContent = currentUser.email;
  fetchAndRenderSkills();
}

async function fetchAndRenderSkills() {
  const { data: userSkills, error } = await supabase
    .from('skills')
    .select('*')
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error fetching skills:', error.message);
    return;
  }

  statSkills.textContent = userSkills.length;
  const totalHours = userSkills.reduce((sum, s) => sum + Number(s.hours), 0);
  statHours.textContent = totalHours;

  skillsList.innerHTML = '';
  if (userSkills.length === 0) {
    skillsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.875rem;">No skills added yet. Start by logging one!</p>`;
    return;
  }

  userSkills.forEach(skill => {
    const el = document.createElement('div');
    el.className = 'skill-item';
    el.innerHTML = `
      <div class="skill-info">
        <h4>${skill.name}</h4>
        <div class="skill-meta">${skill.hours} hrs spent • ${skill.status}</div>
      </div>
      <button class="delete-btn" onclick="deleteSkill('${skill.id}')">Remove</button>
    `;
    skillsList.appendChild(el);
  });
}

// Add New Skill Entry
skillForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('skillName').value.trim();
  const hours = parseInt(document.getElementById('hoursLogged').value);
  const status = document.getElementById('skillStatus').value;

  const { error } = await supabase
    .from('skills')
    .insert([{ user_id: currentUser.id, name, hours, status }]);

  if (error) {
    alert('Failed to add skill: ' + error.message);
    return;
  }

  skillForm.reset();
  fetchAndRenderSkills();
});

// Delete Skill Entry
window.deleteSkill = async function(id) {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Failed to delete skill: ' + error.message);
    return;
  }

  fetchAndRenderSkills();
};

// Check for Active Session on Load
window.addEventListener('DOMContentLoaded', () => {
  const sessionUser = JSON.parse(localStorage.getItem('sv_session'));
  if (sessionUser) {
    currentUser = sessionUser;
    loadDashboard();
  }
});