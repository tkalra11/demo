// workouts.js - Updated with Custom Exercises & Layout Fixes

// ==========================================
// 1. STATE & VARIABLES
// ==========================================
let exercisesDB = {}; 
let customExercises = []; // New array for user-created exercises
let templates = [];   
let currentTemplateIndex = 0;
let currentDayIndex = new Date().getDay() - 1; 
if (currentDayIndex < 0) currentDayIndex = 6; 

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultTemplates = [
    { id: "plan_1", name: "Push Pull Legs", active: true, schedule: Array(7).fill(null).map(() => ({ isRest: false, exercises: [] })) },
    { id: "plan_2", name: "Bro Split", active: false, schedule: Array(7).fill(null).map(() => ({ isRest: false, exercises: [] })) },
    { id: "plan_3", name: "Full Body", active: false, schedule: Array(7).fill(null).map(() => ({ isRest: false, exercises: [] })) }
];

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // A. Fix Layout Positioning dynamically
    fixLayoutPositioning();

    // B. Load Data
    loadTemplates();
    loadCustomExercises(); // Load user-created exercises
    await loadExerciseDatabase();

    // C. Render UI
    renderTemplateTabs();
    renderDaySelector();
    renderDayPlan();

    // D. Search Listener
    const searchInput = document.getElementById('search-bar');
    if (searchInput) searchInput.addEventListener('input', renderLibraryList);
});

// Run this again on resize (e.g. rotating phone)
window.addEventListener('resize', fixLayoutPositioning);

function fixLayoutPositioning() {
    // 1. Measure the fixed header (it changes height based on notch/safe-area)
    const header = document.querySelector('.top-bar'); // From script.js/header.html
    const headerHeight = header ? header.offsetHeight : 60; // Fallback to 60

    // 2. Set a CSS variable that style.css uses
    document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
}

// --- Data Loading ---
function loadTemplates() {
    const stored = localStorage.getItem('workout_templates');
    templates = stored ? JSON.parse(stored) : defaultTemplates;
    if (!stored) saveTemplates();
}

function saveTemplates() {
    localStorage.setItem('workout_templates', JSON.stringify(templates));
}

function loadCustomExercises() {
    const stored = localStorage.getItem('custom_exercises');
    customExercises = stored ? JSON.parse(stored) : [];
}

function saveCustomExercises() {
    localStorage.setItem('custom_exercises', JSON.stringify(customExercises));
}

async function loadExerciseDatabase() {
    try {
        const response = await fetch('fitness_exercises_by_bodyPart.json');
        if (!response.ok) throw new Error("File not found");
        exercisesDB = await response.json();
    } catch (error) {
        console.error("Error loading exercises:", error);
        // We continue anyway, so Custom Exercises still work
    }
}

// ==========================================
// 3. UI RENDERING
// ==========================================

function renderTemplateTabs() {
    const container = document.getElementById('template-tabs');
    if (!container) return;
    container.innerHTML = '';

    templates.forEach((temp, index) => {
        const tab = document.createElement('div');
        tab.className = `template-tab ${index === currentTemplateIndex ? 'active' : ''}`;
        tab.textContent = temp.name;
        tab.onclick = () => {
            currentTemplateIndex = index;
            renderTemplateTabs();
            renderDayPlan();
        };
        container.appendChild(tab);
    });
}

function renderDaySelector() {
    const container = document.getElementById('day-selector');
    if (!container) return;
    container.innerHTML = '';

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    dayLabels.forEach((label, index) => {
        const bubble = document.createElement('div');
        bubble.className = `day-bubble ${index === currentDayIndex ? 'active' : ''}`;
        bubble.textContent = label;
        bubble.onclick = () => {
            currentDayIndex = index;
            renderDaySelector();
            renderDayPlan();
        };
        container.appendChild(bubble);
    });
}

function renderDayPlan() {
    const dayHeader = document.getElementById('current-day-name');
    if (dayHeader) dayHeader.textContent = daysOfWeek[currentDayIndex];

    const currentPlan = templates[currentTemplateIndex].schedule[currentDayIndex];
    const listContainer = document.getElementById('exercise-list');
    const restToggle = document.getElementById('rest-toggle');

    // Rest Toggle Logic
    if (restToggle) {
        const newToggle = restToggle.cloneNode(true); // Clear old listeners
        restToggle.parentNode.replaceChild(newToggle, restToggle);
        newToggle.checked = currentPlan.isRest;
        newToggle.addEventListener('change', (e) => {
            templates[currentTemplateIndex].schedule[currentDayIndex].isRest = e.target.checked;
            saveTemplates();
            renderDayPlan();
        });
    }

    listContainer.innerHTML = '';

    if (currentPlan.isRest) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#666;"><h3>Rest Day 😴</h3><p>Recover for tomorrow!</p></div>`;
        return;
    }

    if (currentPlan.exercises.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#666;"><p>No exercises planned.</p><p>Tap "+ Add Exercise" to start building.</p></div>`;
        return; 
    }

    currentPlan.exercises.forEach((exercise, index) => {
        const item = document.createElement('div');
        item.className = 'exercise-card';
        item.innerHTML = `
            <div class="ex-header">
                <span class="ex-name">${exercise.name}</span>
                <span class="ex-remove" onclick="removeExercise(${index})">×</span>
            </div>
            <div class="ex-details">
                <div class="input-group">
                    <label>Sets</label>
                    <input type="number" value="${exercise.sets}" onchange="updateExercise(${index}, 'sets', this.value)">
                </div>
                <div class="input-group">
                    <label>Reps</label>
                    <input type="text" value="${exercise.targetReps}" onchange="updateExercise(${index}, 'targetReps', this.value)">
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// ==========================================
// 4. ACTIONS (Add/Remove/Custom)
// ==========================================

function updateExercise(exIndex, field, value) {
    templates[currentTemplateIndex].schedule[currentDayIndex].exercises[exIndex][field] = value;
    saveTemplates();
}

function removeExercise(index) {
    if (confirm("Remove this exercise?")) {
        templates[currentTemplateIndex].schedule[currentDayIndex].exercises.splice(index, 1);
        saveTemplates();
        renderDayPlan();
    }
}

// --- Custom Exercise Logic ---
function createCustomExercise() {
    const name = prompt("Enter Exercise Name:");
    if (!name) return;

    const target = prompt("Target Body Part (e.g., Chest, Back, Legs):") || "Other";

    const newCustomEx = {
        id: "custom_" + Date.now(),
        name: name,
        target: target.toLowerCase(),
        bodyPart: "custom", // Internal tag for filtering
        isCustom: true
    };

    // Save to user storage
    customExercises.push(newCustomEx);
    saveCustomExercises();

    // Select it immediately
    selectExercise(newCustomEx.id, newCustomEx.name);
    
    // Refresh modal to show it in future searches
    // (Optional: switch filter to 'Custom' automatically)
}

// ==========================================
// 5. LIBRARY MODAL
// ==========================================

let currentFilter = 'all';

function openExerciseLibrary() {
    document.getElementById('library-modal').classList.remove('hidden');
    // Ensure we have layout calculated before rendering list (sometimes needed for scrolling)
    renderLibraryList();
}

function closeLibrary() {
    document.getElementById('library-modal').classList.add('hidden');
}

function filterBodyPart(part) {
    currentFilter = part.toLowerCase();
    
    // Visual update
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    // Find the chip that was clicked (approximate match logic)
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        if(chip.innerText.toLowerCase() === part) chip.classList.add('active');
    });

    renderLibraryList();
}

function renderLibraryList() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const container = document.getElementById('library-list');
    container.innerHTML = '';

    // 1. COMBINE DATA: JSON Data + Custom User Data
    let allExercises = [...customExercises]; // Start with custom ones

    if (currentFilter === 'all') {
        Object.keys(exercisesDB).forEach(key => {
            allExercises = allExercises.concat(exercisesDB[key]);
        });
    } else if (currentFilter === 'custom') {
        // Just keep the initial customExercises array
    } else {
        // JSON categories
        if (exercisesDB[currentFilter]) {
            allExercises = allExercises.concat(exercisesDB[currentFilter]);
        }
    }

    // 2. Filter by Search Query
    const filtered = allExercises.filter(ex => ex.name.toLowerCase().includes(query));

    // 3. Render (Lazy limit to 50 for performance)
    if (filtered.length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No exercises found.<br>Tap "Create Custom Exercise" to add one.</div>`;
        return;
    }

    filtered.slice(0, 50).forEach(ex => {
        const item = document.createElement('div');
        item.className = 'lib-item';
        // Add a star or badge if it's custom
        const customBadge = ex.isCustom ? '<span style="color:#4A90E2; font-size:10px; margin-left:5px;">(Custom)</span>' : '';
        
        item.innerHTML = `
            <div class="lib-info">
                <div class="lib-name">${ex.name} ${customBadge}</div>
                <div class="lib-target">${ex.target}</div>
            </div>
            <button class="btn-add-small" onclick="selectExercise('${ex.id}', '${ex.name.replace(/'/g, "\\'")}')">+</button>
        `;
        container.appendChild(item);
    });
}

function selectExercise(id, name) {
    const newExercise = {
        id: id,
        name: name,
        sets: 3,
        targetReps: "10"
    };

    templates[currentTemplateIndex].schedule[currentDayIndex].exercises.push(newExercise);
    saveTemplates();
    closeLibrary();
    renderDayPlan();
}