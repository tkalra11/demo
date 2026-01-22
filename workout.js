// workouts.js - The Brains of the Operation

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let exercisesDB = {}; // Will hold the loaded JSON data
let templates = [];   // Will hold the user's plans
let currentTemplateIndex = 0;
let currentDayIndex = new Date().getDay() - 1; // Default to today (0=Mon, 6=Sun)
if (currentDayIndex < 0) currentDayIndex = 6; // Handle Sunday properly

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Default Template Structure (if fresh install)
const defaultTemplates = [
    { id: "plan_1", name: "Push Pull Legs", active: true, schedule: Array(7).fill().map(() => ({ isRest: false, exercises: [] })) },
    { id: "plan_2", name: "Bro Split", active: false, schedule: Array(7).fill().map(() => ({ isRest: false, exercises: [] })) },
    { id: "plan_3", name: "Full Body", active: false, schedule: Array(7).fill().map(() => ({ isRest: false, exercises: [] })) }
];

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // A. Load Data
    loadTemplates();
    await loadExerciseDatabase();

    // B. Render Initial UI
    renderTemplateTabs();
    renderDaySelector();
    renderDayPlan();

    // C. Attach Event Listeners
    setupEventListeners();
});

function loadTemplates() {
    const stored = localStorage.getItem('workout_templates');
    if (stored) {
        templates = JSON.parse(stored);
    } else {
        templates = defaultTemplates;
        saveTemplates();
    }
}

function saveTemplates() {
    localStorage.setItem('workout_templates', JSON.stringify(templates));
}

async function loadExerciseDatabase() {
    try {
        const response = await fetch('fitness_exercises_by_bodyPart.json');
        exercisesDB = await response.json();
        console.log("Database loaded:", Object.keys(exercisesDB).length + " categories found.");
    } catch (error) {
        console.error("Failed to load exercises:", error);
        alert("Error loading exercise library. Make sure the JSON file is in the folder.");
    }
}

// ==========================================
// 3. RENDERING UI
// ==========================================

// --- Top Template Tabs ---
function renderTemplateTabs() {
    const container = document.getElementById('template-tabs');
    container.innerHTML = '';

    templates.forEach((temp, index) => {
        const tab = document.createElement('div');
        tab.className = `template-tab ${index === currentTemplateIndex ? 'active' : ''}`;
        tab.textContent = temp.name;
        tab.onclick = () => switchTemplate(index);
        container.appendChild(tab);
    });

    // Add "+" Button (Optional: for renaming or clearing)
    const addBtn = document.createElement('div');
    addBtn.className = 'template-tab';
    addBtn.textContent = '✎'; // Edit icon
    addBtn.onclick = renameCurrentTemplate;
    container.appendChild(addBtn);
}

// --- Day Bubbles (M T W...) ---
function renderDaySelector() {
    const container = document.getElementById('day-selector');
    container.innerHTML = '';

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    dayLabels.forEach((label, index) => {
        const bubble = document.createElement('div');
        bubble.className = `day-bubble ${index === currentDayIndex ? 'active' : ''}`;
        bubble.textContent = label;
        bubble.onclick = () => switchDay(index);
        container.appendChild(bubble);
    });
}

// --- Main Exercise List for the Day ---
function renderDayPlan() {
    const dayHeader = document.getElementById('current-day-name');
    dayHeader.textContent = daysOfWeek[currentDayIndex];

    const currentPlan = templates[currentTemplateIndex].schedule[currentDayIndex];
    const listContainer = document.getElementById('exercise-list');
    const restToggle = document.getElementById('rest-toggle');

    // Update Toggle State
    restToggle.checked = currentPlan.isRest;

    // Clear List
    listContainer.innerHTML = '';

    if (currentPlan.isRest) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <h3>Rest Day 😴</h3>
                <p>Enjoy your recovery!</p>
            </div>`;
        return;
    }

    if (currentPlan.exercises.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <p>No exercises planned.</p>
                <p>Tap "+ Add Exercise" to start building.</p>
            </div>`;
        return;
    }

    // Render Exercises
    currentPlan.exercises.forEach((exercise, index) => {
        const item = document.createElement('div');
        item.className = 'exercise-card'; // We will style this in CSS
        item.innerHTML = `
            <div class="ex-header">
                <span class="ex-name">${exercise.name}</span>
                <span class="ex-remove" onclick="removeExercise(${index})">×</span>
            </div>
            <div class="ex-details">
                <div class="input-group">
                    <label>Sets</label>
                    <input type="number" value="${exercise.sets}" onchange="updateExerciseDetail(${index}, 'sets', this.value)">
                </div>
                <div class="input-group">
                    <label>Reps</label>
                    <input type="text" value="${exercise.targetReps}" onchange="updateExerciseDetail(${index}, 'targetReps', this.value)">
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// ==========================================
// 4. LOGIC & ACTIONS
// ==========================================

function switchTemplate(index) {
    currentTemplateIndex = index;
    renderTemplateTabs();
    renderDayPlan();
}

function switchDay(index) {
    currentDayIndex = index;
    renderDaySelector();
    renderDayPlan();
}

function renameCurrentTemplate() {
    const newName = prompt("Rename this plan:", templates[currentTemplateIndex].name);
    if (newName) {
        templates[currentTemplateIndex].name = newName;
        saveTemplates();
        renderTemplateTabs();
    }
}

// --- Rest Day Toggle ---
document.getElementById('rest-toggle').addEventListener('change', (e) => {
    templates[currentTemplateIndex].schedule[currentDayIndex].isRest = e.target.checked;
    saveTemplates();
    renderDayPlan();
});

function removeExercise(exerciseIndex) {
    if(confirm("Remove this exercise?")) {
        templates[currentTemplateIndex].schedule[currentDayIndex].exercises.splice(exerciseIndex, 1);
        saveTemplates();
        renderDayPlan();
    }
}

function updateExerciseDetail(exIndex, field, value) {
    templates[currentTemplateIndex].schedule[currentDayIndex].exercises[exIndex][field] = value;
    saveTemplates();
}

// ==========================================
// 5. LIBRARY & SEARCH LOGIC
// ==========================================

const modal = document.getElementById('library-modal');
const searchInput = document.getElementById('search-bar');
let currentFilter = 'all';

function openExerciseLibrary() {
    modal.classList.remove('hidden');
    renderLibraryList();
    searchInput.focus();
}

function closeLibrary() {
    modal.classList.add('hidden');
}

function filterBodyPart(part) {
    currentFilter = part.toLowerCase(); // Ensure lowercase to match JSON keys
    
    // UI Update for chips
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active'); // Highlight clicked chip
    
    renderLibraryList();
}

function renderLibraryList() {
    const query = searchInput.value.toLowerCase();
    const libContainer = document.getElementById('library-list');
    libContainer.innerHTML = '';

    // 1. Flatten the DB into a single array for easier searching
    let allExercises = [];
    
    if (currentFilter === 'all') {
        // Combine all arrays from the object
        Object.keys(exercisesDB).forEach(key => {
            allExercises = allExercises.concat(exercisesDB[key]);
        });
    } else {
        // Just take the specific body part array (if it exists)
        if (exercisesDB[currentFilter]) {
            allExercises = exercisesDB[currentFilter];
        }
    }

    // 2. Filter by Search Query
    const filtered = allExercises.filter(ex => ex.name.toLowerCase().includes(query));

    // 3. Limit results for performance (first 50)
    const displayList = filtered.slice(0, 50);

    // 4. Render
    displayList.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'lib-item';
        // Lazy load GIF logic can be added here later
        item.innerHTML = `
            <div class="lib-info">
                <div class="lib-name">${ex.name}</div>
                <div class="lib-target">${ex.target} • ${ex.equipment}</div>
            </div>
            <button class="btn-add-small" onclick="selectExercise('${ex.id}', '${ex.name.replace(/'/g, "\\'")}')">+</button>
        `;
        libContainer.appendChild(item);
    });
}

// Search Listener
searchInput.addEventListener('input', renderLibraryList);

// --- The "Smart Import" Logic ---
function selectExercise(id, name) {
    // 1. Look up history (Placeholder for now)
    // const lastPerformed = findLastLog(id); 
    const defaultSets = 3;
    const defaultReps = "10";

    // 2. Create the exercise object
    const newExercise = {
        id: id,
        name: name,
        sets: defaultSets,
        targetReps: defaultReps,
        note: ""
    };

    // 3. Push to current day
    templates[currentTemplateIndex].schedule[currentDayIndex].exercises.push(newExercise);
    saveTemplates();

    // 4. Close and Refresh
    closeLibrary();
    renderDayPlan();
}

// Empty Workout Button
function startEmptyWorkout() {
    alert("Starting an empty workout! (Dashboard redirection coming soon)");
    // In the future: window.location.href = 'active-workout.html';
}