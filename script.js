// script.js - v4 (Header + Navbar + Dynamic Titles)

async function loadLayout() {
    try {
        // 1. Load Navbar (Bottom)
        const navResponse = await fetch('navbar.html');
        const navText = await navResponse.text();
        document.body.insertAdjacentHTML('beforeend', navText);

        // 2. Load Header (Top)
        const headerResponse = await fetch('header.html');
        const headerText = await headerResponse.text();
        document.body.insertAdjacentHTML('afterbegin', headerText); // 'afterbegin' puts it at the TOP

        // 3. Set the Title dynamically
        updatePageTitle();

        // 4. Highlight the active tab
        highlightActiveTab();

    } catch (error) {
        console.error('Error loading layout:', error);
    }
}

function updatePageTitle() {
    // Get the filename (e.g., "meals.html")
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const titleElement = document.getElementById('page-title');

    // Simple logic to pick the name
    if (path.includes('index')) {
        titleElement.textContent = 'Dashboard';
    } else if (path.includes('meals')) {
        titleElement.textContent = 'Meals';
    } else if (path.includes('workouts')) {
        titleElement.textContent = 'Workouts';
    } else if (path.includes('progress')) {
        titleElement.textContent = 'Progress';
    }
}

function highlightActiveTab() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
}

// Keep the Link Breakout fix!
document.addEventListener('click', function(e) {
    var target = e.target.closest('a');
    if (target && target.hostname === window.location.hostname) {
        e.preventDefault(); 
        window.location.href = target.href;
    }
}, false);

document.addEventListener('DOMContentLoaded', loadLayout);