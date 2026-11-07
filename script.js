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

// Toggle between Login and Register views
if (showRegister) {
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        authMessage.textContent = '';
    });
}

if (showLogin) {
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        authMessage.textContent = '';
    });
}

function showMessage(msg, isError = true) {
    authMessage.textContent = msg;
    authMessage.style.color = isError ? '#ff4d4d' : '#4bb543';
}

// Register User
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        if (!email || !password) {
            showMessage('Please fill in all fields.');
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .insert([{ email, password }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                showMessage('Email already exists. Please sign in.');
            } else {
                showMessage('Registration failed: ' + error.message);
            }
            return;
        }

        showMessage('Registration successful! Please sign in.', false);
        registerForm.reset();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });
}

// Login User
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

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
        localStorage.setItem('skillvault_user', JSON.stringify(currentUser));
        transitionToDashboard();
    });
}

// Check existing session on load
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('skillvault_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        transitionToDashboard();
    }
});

function transitionToDashboard() {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    userEmailDisplay.textContent = currentUser.email;
    loadSkills();
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('skillvault_user');
        dashboardContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        loginForm.reset();
        authMessage.textContent = '';
    });
}

// Load Skills from Database
async function loadSkills() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading skills:', error.message);
        return;
    }

    renderSkills(data || []);
}

// Render Skills & Stats
function renderSkills(skills) {
    skillsList.innerHTML = '';
    let totalHours = 0;

    skills.forEach(skill => {
        totalHours += Number(skill.hours);

        const li = document.createElement('li');
        li.className = 'skill-item';
        li.innerHTML = `
            <div>
                <strong>${escapeHtml(skill.name)}</strong> (${skill.hours} hrs) - <span class="badge ${skill.status}">${skill.status}</span>
            </div>
            <button onclick="deleteSkill('${skill.id}')" class="delete-btn">Delete</button>
        `;
        skillsList.appendChild(li);
    });

    statSkills.textContent = skills.length;
    statHours.textContent = totalHours;
}

// Add Skill
if (skillForm) {
    skillForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const name = document.getElementById('skillName').value.trim();
        const hours = parseInt(document.getElementById('skillHours').value, 10);
        const status = document.getElementById('skillStatus').value;

        if (!name || isNaN(hours)) return;

        const { error } = await supabase
            .from('skills')
            .insert([{ user_id: currentUser.id, name, hours, status }]);

        if (error) {
            alert('Error adding skill: ' + error.message);
            return;
        }

        skillForm.reset();
        loadSkills();
    });
}

// Delete Skill
window.deleteSkill = async function(id) {
    const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error deleting skill: ' + error.message);
        return;
    }

    loadSkills();
};

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
