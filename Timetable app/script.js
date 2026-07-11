const pages = {
  home: document.getElementById('page-home'),
  signup: document.getElementById('page-signup'),
  login: document.getElementById('page-login'),
  dashboard: document.getElementById('page-dashboard'),
};

const navButtons = {
  home: document.getElementById('nav-home'),
  signup: document.getElementById('nav-signup'),
  login: document.getElementById('nav-login'),
  dashboard: document.getElementById('nav-dashboard'),
};

const signupForm = document.getElementById('signup-form');
const signupMessage = document.getElementById('signup-message');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const timetableForm = document.getElementById('timetable-form');
const timetableTableBody = document.querySelector('#timetable-table tbody');
const optimizeStudyButton = document.getElementById('optimize-study');
const timetableFeedback = document.getElementById('timetable-feedback');
const studyPlanOutput = document.getElementById('study-plan-output');
const pdfFileInput = document.getElementById('pdf-file');
const summaryOutput = document.getElementById('summary-output');
const generateSummaryButton = document.getElementById('generate-summary');
const homeworkQuestion = document.getElementById('homework-question');
const askTutorButton = document.getElementById('ask-tutor');
const contextFileInput = document.getElementById('context-file');
const userGreeting = document.getElementById('dashboard-greeting');
const logoutButton = document.getElementById('logout-button');
const clearTimetableButton = document.getElementById('clear-timetable');
const serverWarning = document.getElementById('server-warning');

let timetable = JSON.parse(localStorage.getItem('eduhubTimetable') || 'null') || [];
let currentUser = null;

function showPage(pageKey) {
  if (pageKey === 'dashboard' && !currentUser) {
    showPage('login');
    return;
  }
  Object.keys(pages).forEach((key) => {
    pages[key].classList.toggle('hidden', key !== pageKey);
    navButtons[key].classList.toggle('active', key === pageKey);
  });
}

function renderTimetable() {
  timetableTableBody.innerHTML = '';
  timetable.forEach((entry, index) => {
    const tr = document.createElement('tr');
    ['day', 'time', 'subject', 'room', 'note'].forEach((field) => {
      const td = document.createElement('td');
      td.textContent = entry[field] || '';
      tr.appendChild(td);
    });
    const actionTd = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'secondary small-btn';
    deleteButton.addEventListener('click', () => {
      timetable.splice(index, 1);
      saveTimetable();
      renderTimetable();
      showAlert(timetableFeedback, 'Class removed from your timetable.', 'info');
      setTimeout(() => hideAlert(timetableFeedback), 3000);
    });
    actionTd.appendChild(deleteButton);
    tr.appendChild(actionTd);
    timetableTableBody.appendChild(tr);
  });
}

function saveTimetable() {
  localStorage.setItem('eduhubTimetable', JSON.stringify(timetable));
}

function showAlert(element, message, type = 'info') {
  element.className = `alert ${type}`;
  element.textContent = message;
  element.classList.remove('hidden');
}

function hideAlert(element) {
  element.classList.add('hidden');
}

async async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || response.statusText || 'Request failed');
    }
    return json;
  } catch (err) {
    throw new Error('Unable to reach the backend. Start the server with "npm start" and open http://localhost:5173');
  }
}

async function fetchGemini(prompt) {
  const response = await apiRequest('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, temperature: 0.65, max_tokens: 800 }),
  });
  return response.text;
}

function createTimetablePrompt() {
  if (!timetable || timetable.length === 0) {
    return 'You are an experienced student planner. The student has an empty timetable. Provide a friendly study plan and tips to get started with a weekly schedule.';
  }

  const lines = timetable.map((entry) => {
    const parts = [`${entry.day} ${entry.time}: ${entry.subject || 'Class'}`];
    if (entry.room) {
      parts.push(`Room ${entry.room}`);
    }
    if (entry.note) {
      parts.push(`Notes: ${entry.note}`);
    }
    return parts.join(' | ');
  });

  return `You are an experienced student planner. Here is the student's weekly class timetable:\n${lines.join('\n')}\n\nCreate a personalized independent study schedule that fits around these classes. Include study blocks, review sessions, and friendly guidance.`;
}

async function handleOptimizeStudy() {
  studyPlanOutput.classList.remove('hidden');
  studyPlanOutput.textContent = 'Generating your optimized study plan...';
  try {
    const prompt = createTimetablePrompt();
    const result = await fetchGemini(prompt);
    studyPlanOutput.textContent = result;
  } catch (err) {
    studyPlanOutput.textContent = err.message;
  }
}

async function extractTextFromPdf(file) {
  if (!file) return '';
  const formData = new FormData();
  formData.append('pdf', file);
  const response = await fetch('/api/pdf-text', { method: 'POST', body: formData });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || response.statusText || 'PDF extraction failed');
  }
  return json.text || '';
}

function createSummaryPrompt(depth, text) {
  return `You are a study assistant. Summary type: ${depth}. Use the text below to produce clean formatted student notes in Markdown. Document text:\n${text}`;
}

async function handleGenerateSummary() {
  summaryOutput.classList.remove('hidden');
  summaryOutput.textContent = 'Summarizing your document...';
  try {
    const file = pdfFileInput.files[0];
    if (!file) throw new Error('Upload a PDF file to generate a summary.');
    const rawText = await extractTextFromPdf(file);
    const prompt = createSummaryPrompt(document.getElementById('summary-depth').value, rawText);
    const result = await fetchGemini(prompt);
    summaryOutput.textContent = result;
  } catch (err) {
    summaryOutput.textContent = err.message;
  }
}

function createHomeworkPrompt(question, contextText) {
  return `You are a patient tutor. Help with this homework prompt, explain concepts step-by-step, and show why each step matters. Question: ${question} Context: ${contextText}`;
}

async function handleAskTutor() {
  tutorOutput.classList.remove('hidden');
  tutorOutput.textContent = 'Preparing the tutor response...';
  try {
    const question = homeworkQuestion.value.trim();
    if (!question) throw new Error('Please enter a homework question or prompt.');
    let contextText = '';
    const optionalFile = contextFileInput.files[0];
    if (optionalFile) {
      contextText = await optionalFile.text();
    }
    const prompt = createHomeworkPrompt(question, contextText);
    const result = await fetchGemini(prompt);
    tutorOutput.textContent = result;
  } catch (err) {
    tutorOutput.textContent = err.message;
  }
}

function addClassToTimetable(subject, day, time, room, note) {
  timetable.push({
    day,
    time,
    subject,
    room,
    note,
  });
}

function handleTimetableSubmit(event) {
  event.preventDefault();
  const subject = document.getElementById('subject-name').value.trim();
  const day = document.getElementById('day').value;
  const time = document.getElementById('time-slot').value.trim();
  const room = document.getElementById('room-number').value.trim();
  const note = document.getElementById('note').value.trim();
  if (!subject) {
    showAlert(timetableFeedback, 'Please enter a subject name before adding the class.', 'warning');
    return;
  }
  if (!time) {
    showAlert(timetableFeedback, 'Please enter the class time or time range.', 'warning');
    return;
  }
  addClassToTimetable(subject, day, time, room, note);
  saveTimetable();
  renderTimetable();
  showAlert(timetableFeedback, 'Class added to your timetable.', 'info');
  setTimeout(() => hideAlert(timetableFeedback), 3500);
  event.target.reset();
}

async function handleSignup(event) {
  event.preventDefault();
  hideAlert(signupMessage);
  const fullName = document.getElementById('full-name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  if (!fullName || !email || !password) {
    showAlert(signupMessage, 'Please fill in your name, email, and password to continue.', 'warning');
    return;
  }
  if (password !== confirmPassword) {
    showAlert(signupMessage, 'Passwords do not match. Please try again.', 'error');
    return;
  }
  try {
    const response = await apiRequest('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    currentUser = response.user;
    showAlert(signupMessage, 'Signup successful! Welcome to EduHub.', 'info');
    showPage('dashboard');
    updateDashboardHeader();
  } catch (err) {
    showAlert(signupMessage, err.message, 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  hideAlert(loginMessage);
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) {
    showAlert(loginMessage, 'Please enter your email and password.', 'warning');
    return;
  }
  try {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    currentUser = response.user;
    showAlert(loginMessage, 'Login successful! Welcome back.', 'info');
    showPage('dashboard');
    updateDashboardHeader();
  } catch (err) {
    showAlert(loginMessage, err.message, 'error');
  }
}

async function handleLogout() {
  await apiRequest('/api/logout', { method: 'POST' });
  currentUser = null;
  showPage('home');
}

async function loadSession() {
  try {
    const response = await apiRequest('/api/session');
    if (response.authenticated) {
      currentUser = response.user;
      updateDashboardHeader();
    }
  } catch (_) {
    currentUser = null;
  }
}

function updateDashboardHeader() {
  if (userGreeting) {
    userGreeting.textContent = currentUser ? `Welcome back, ${currentUser.fullName}!` : '';
  }
}

Object.entries(navButtons).forEach(([pageKey, button]) => {
  button.addEventListener('click', () => showPage(pageKey));
});

signupForm.addEventListener('submit', handleSignup);
loginForm.addEventListener('submit', handleLogin);
logoutButton?.addEventListener('click', handleLogout);
timetableForm.addEventListener('submit', handleTimetableSubmit);
clearTimetableButton?.addEventListener('click', () => {
  timetable = [];
  saveTimetable();
  renderTimetable();
  showAlert(timetableFeedback, 'Your timetable has been cleared.', 'info');
  setTimeout(() => hideAlert(timetableFeedback), 3000);
});
optimizeStudyButton.addEventListener('click', handleOptimizeStudy);
generateSummaryButton.addEventListener('click', handleGenerateSummary);
askTutorButton.addEventListener('click', handleAskTutor);

renderTimetable();
loadSession().then(() => {
  if (currentUser) {
    showPage('dashboard');
  } else {
    showPage('home');
  }
});
