// js/workouts.js

// --- STATE ---
let exercisesDB = {};
let customExercises = [];
let favorites = [];
let templates = [];
let currentTemplateIndex = 0;
let currentDayIndex = new Date().getDay() - 1; 
if (currentDayIndex < 0) currentDayIndex = 6; 

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    loadData();
    await loadExerciseDatabase();
    initUI();
    
    // Fix Header Height for CSS
    setTimeout(() => {
        const header = document.querySelector('.top-bar');
        if (header) {
            document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
        }
    }, 100);
});

// --- DATA MANAGEMENT ---
function loadData() {
    // Templates
    const storedTemplates = localStorage.getItem('workout_templates');
    if (storedTemplates) {
        templates = JSON.parse(storedTemplates);
    } else {
        templates = [{
            id: "plan_default",
            name: "Default Plan",
            active: true,
            schedule: Array(7).fill(null).map(() => ({ isRest: false, exercises: [] }))
        }];
        saveTemplates();
    }

    // Custom Exercises
    const storedCustom = localStorage.getItem('custom_exercises');
    customExercises = storedCustom ? JSON.parse(storedCustom) : [];

    // Favorites
    const storedFavs = localStorage.getItem('exercise_favorites');
    favorites = storedFavs ? JSON.parse(storedFavs) : [];
}

function saveTemplates() { localStorage.setItem('workout_templates', JSON.stringify(templates)); }
function saveCustom() { localStorage.setItem('custom_exercises', JSON.stringify(customExercises)); }
function saveFavorites() { localStorage.setItem('exercise_favorites', JSON.stringify(favorites)); }

async function loadExerciseDatabase() {
    try {
        const response = await fetch('../data/fitness_exercises_by_bodyPart.json');
        if (!response.ok) throw new Error("JSON not found");
        exercisesDB = await response.json();
    } catch (error) {
        console.error("DB Load Error:", error);
    }
}

// --- UI RENDERING ---
function initUI() {
    renderTemplateTabs();
    renderDaySelector();
    renderDayPlan();
    const searchInput = document.getElementById('search-bar');
    if (searchInput) searchInput.addEventListener('input', renderLibraryList);
}

// --- PLAN TABS ---
function renderTemplateTabs() {
    const container = document.getElementById('template-tabs');
    if (!container) return;
    container.innerHTML = '';

    templates.forEach((temp, index) => {
        const tab = document.createElement('div');
        tab.className = `template-tab ${index === currentTemplateIndex ? 'active' : ''}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = temp.name;
        nameSpan.onclick = () => {
            currentTemplateIndex = index;
            renderTemplateTabs();
            renderDayPlan();
        };
        tab.appendChild(nameSpan);

        // Edit/Delete Controls for Active Tab
        if (index === currentTemplateIndex) {
            const controls = document.createElement('div');
            controls.className = 'tab-controls';
            
            const renameBtn = document.createElement('span');
            renameBtn.innerHTML = '✎';
            renameBtn.onclick = (e) => { e.stopPropagation(); renamePlan(index); };
            
            controls.appendChild(renameBtn);

            if (templates.length > 1) {
                const delBtn = document.createElement('span');
                delBtn.innerHTML = '🗑';
                delBtn.className = 'del-btn';
                delBtn.onclick = (e) => { e.stopPropagation(); deletePlan(index); };
                controls.appendChild(delBtn);
            }
            tab.appendChild(controls);
        }
        container.appendChild(tab);
    });

    // Add New Plan Button
    const addBtn = document.createElement('div');
    addBtn.className = 'template-tab';
    addBtn.innerHTML = '+';
    addBtn.onclick = createNewPlan;
    container.appendChild(addBtn);
}

function createNewPlan() {
    const name = prompt("Plan Name:", "New Plan");
    if (!name) return;
    templates.push({
        id: "plan_" + Date.now(),
        name: name,
        active: false,
        schedule: Array(7).fill(null).map(() => ({ isRest: false, exercises: [] }))
    });
    saveTemplates();
    currentTemplateIndex = templates.length - 1;
    renderTemplateTabs();
    renderDayPlan();
}

function renamePlan(index) {
    const newName = prompt("Rename Plan:", templates[index].name);
    if (newName) {
        templates[index].name = newName;
        saveTemplates();
        renderTemplateTabs();
    }
}

function deletePlan(index) {
    if (confirm(`Delete "${templates[index].name}"?`)) {
        templates.splice(index, 1);
        currentTemplateIndex = 0;
        saveTemplates();
        renderTemplateTabs();
        renderDayPlan();
    }
}

// --- DAY SELECTOR ---
function renderDaySelector() {
    const container = document.getElementById('day-selector');
    if (!container) return;
    container.innerHTML = '';
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    labels.forEach((label, index) => {
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

// --- MAIN WORKOUT LIST ---
function renderDayPlan() {
    const dayHeader = document.getElementById('current-day-name');
    if (dayHeader) dayHeader.textContent = daysOfWeek[currentDayIndex];

    const currentPlan = templates[currentTemplateIndex].schedule[currentDayIndex];
    const listContainer = document.getElementById('exercise-list');
    const restToggle = document.getElementById('rest-toggle');
    const addBtn = document.querySelector('.btn-add');

    // Rest Toggle
    if (restToggle) {
        const newToggle = restToggle.cloneNode(true);
        restToggle.parentNode.replaceChild(newToggle, restToggle);
        newToggle.checked = currentPlan.isRest;
        newToggle.addEventListener('change', (e) => {
            templates[currentTemplateIndex].schedule[currentDayIndex].isRest = e.target.checked;
            saveTemplates();
            renderDayPlan();
        });
    }

    // Hide "Add" button if Rest Day
    if (addBtn) {
        addBtn.style.display = currentPlan.isRest ? 'none' : 'block';
    }

    listContainer.innerHTML = '';

    if (currentPlan.isRest) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#666;"><p>Rest Day Active 😴</p></div>`;
        return;
    }

    if (currentPlan.exercises.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#666;"><p>No exercises planned.</p></div>`;
    } else {
        currentPlan.exercises.forEach((exercise, exIndex) => {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            
            // Ensure setsData exists
            if (!exercise.setsData) {
                exercise.setsData = Array(exercise.sets || 3).fill({ weight: 0, reps: exercise.targetReps || 0 });
            }

            let setsHtml = '';
            exercise.setsData.forEach((set, setIndex) => {
                setsHtml += `
                    <div class="set-row">
                        <span class="set-num">${setIndex + 1}</span>
                        <input type="number" placeholder="kg" value="${set.weight}" min="0" onchange="updateSetData(${exIndex}, ${setIndex}, 'weight', this.value)">
                        <input type="number" placeholder="reps" value="${set.reps}" min="0" onchange="updateSetData(${exIndex}, ${setIndex}, 'reps', this.value)">
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="ex-header">
                    <span class="ex-name">${exercise.name}</span>
                    <span class="ex-remove" onclick="removeExercise(${exIndex})">×</span>
                </div>
                <div class="ex-sets-container">
                    <div class="set-header"><span>Set</span><span>Weight (kg)</span><span>Reps</span></div>
                    ${setsHtml}
                    <div class="set-actions">
                        <button class="btn-set-action" onclick="addSet(${exIndex})">+ Set</button>
                        <button class="btn-set-action remove" onclick="removeSet(${exIndex})">- Set</button>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }
}

// --- ACTIONS ---
function updateSetData(exIndex, setIndex, field, value) {
    if (value < 0) value = 0; // Prevent negatives
    templates[currentTemplateIndex].schedule[currentDayIndex].exercises[exIndex].setsData[setIndex][field] = value;
    saveTemplates();
}

function addSet(exIndex) {
    const ex = templates[currentTemplateIndex].schedule[currentDayIndex].exercises[exIndex];
    const lastSet = ex.setsData[ex.setsData.length - 1] || { weight: 0, reps: 0 };
    ex.setsData.push({ ...lastSet });
    saveTemplates();
    renderDayPlan();
}

function removeSet(exIndex) {
    const ex = templates[currentTemplateIndex].schedule[currentDayIndex].exercises[exIndex];
    if (ex.setsData.length > 1) {
        ex.setsData.pop();
        saveTemplates();
        renderDayPlan();
    }
}

function removeExercise(index) {
    if (confirm("Remove exercise?")) {
        templates[currentTemplateIndex].schedule[currentDayIndex].exercises.splice(index, 1);
        saveTemplates();
        renderDayPlan();
    }
}

// --- LIBRARY MODAL ---
let currentFilter = 'all';

function openLibrary() {
    document.getElementById('library-modal').classList.add('active');
    filterBodyPart('all'); 
}

function closeLibrary() {
    document.getElementById('library-modal').classList.remove('active');
}

function createCustomExercise() {
    const name = prompt("Exercise Name:");
    if (!name) return;
    const target = prompt("Body Part (chest, back, legs, arms, abs, shoulders, cardio):");
    
    const newEx = {
        id: "cust_" + Date.now(),
        name: name,
        target: "custom",
        bodyPart: target ? target.toLowerCase() : "custom", 
        isCustom: true
    };
    
    customExercises.push(newEx);
    saveCustom();
    addExerciseToPlan(newEx.id, newEx.name);
}

function filterBodyPart(category) {
    currentFilter = category;
    document.querySelectorAll('.chip').forEach(c => {
        c.classList.remove('active');
        if (c.innerText.toLowerCase() === category) c.classList.add('active');
        if (category === 'all' && c.innerText.toLowerCase() === 'all') c.classList.add('active');
    });
    renderLibraryList();
}

function renderLibraryList() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const container = document.getElementById('library-list');
    container.innerHTML = '';

    let list = [];
    // MAPPING LOGIC
    const map = {
        'chest': ['chest'],
        'back': ['back'],
        'shoulders': ['shoulders', 'neck'],
        'arms': ['lower arms', 'upper arms'],
        'legs': ['lower legs', 'upper legs'],
        'abs': ['waist'],
        'cardio': ['cardio']
    };

    if (currentFilter === 'favorites') {
        // Fix: Force String conversion for IDs to match JSON numbers vs Custom Strings
        const favIds = new Set(favorites.map(String));
        
        Object.values(exercisesDB).flat().forEach(ex => {
            if (favIds.has(String(ex.id))) list.push(ex);
        });
        customExercises.forEach(ex => {
            if (favIds.has(String(ex.id))) list.push(ex);
        });

    } else if (currentFilter === 'custom') {
        list = customExercises;
    } else if (currentFilter === 'all') {
        Object.values(exercisesDB).flat().forEach(ex => list.push(ex));
        list = list.concat(customExercises);
    } else {
        const jsonKeys = map[currentFilter] || [];
        jsonKeys.forEach(key => {
            if (exercisesDB[key]) list = list.concat(exercisesDB[key]);
        });
        const matchingCustom = customExercises.filter(ex => ex.bodyPart === currentFilter);
        list = list.concat(matchingCustom);
    }

    if (query) {
        list = list.filter(ex => ex.name.toLowerCase().includes(query));
    }

    if (list.length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">No exercises found.</div>`;
        return;
    }

    // Removed the .slice() limit to show ALL exercises
    list.forEach(ex => {
        const isFav = favorites.map(String).includes(String(ex.id));
        const item = document.createElement('div');
        item.className = 'lib-item';
        item.innerHTML = `
            <div class="lib-info">
                <span class="lib-name">${ex.name}</span>
                <div class="lib-meta">${ex.target}</div>
            </div>
            <div class="lib-actions">
                <span class="lib-star ${isFav ? 'starred' : ''}" onclick="toggleFav('${ex.id}', this)">★</span>
                <button class="btn-add-small" onclick="addExerciseToPlan('${ex.id}', '${ex.name.replace(/'/g, "\\'")}')">+</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleFav(id, starElement) {
    const strId = String(id);
    const idx = favorites.map(String).indexOf(strId);
    
    if (idx === -1) {
        favorites.push(strId); 
        starElement.classList.add('starred');
    } else {
        favorites.splice(idx, 1);
        starElement.classList.remove('starred');
    }
    saveFavorites();
    // Only refresh if we are currently looking at the favorites tab
    if (currentFilter === 'favorites') renderLibraryList();
}

function addExerciseToPlan(id, name) {
    const newEx = {
        id: id,
        name: name,
        // New Data Structure: setsData array
        setsData: [
            { weight: 0, reps: 0 },
            { weight: 0, reps: 0 },
            { weight: 0, reps: 0 }
        ]
    };
    
    templates[currentTemplateIndex].schedule[currentDayIndex].exercises.push(newEx);
    saveTemplates();
    closeLibrary();
    renderDayPlan();
}