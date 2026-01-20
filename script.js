// script.js - v2 (The "Bulletproof" Version)

document.addEventListener('click', function(e) {
    // 1. Find the closest link (a tag) in the clicked area
    var target = e.target.closest('a');

    // 2. If it's a link...
    if (target) {
        // ...and it points to the SAME website (hostname matches)
        if (target.hostname === window.location.hostname) {
            
            // PREVENT the default browser "new window" behavior
            e.preventDefault(); 
            
            // MANUALLY navigate to the new page within the same window
            window.location.href = target.href;
        }
    }
}, false);

// Active Tab Highlighter (Kept this the same, it works fine)
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        // getAttribute('href') is safer for matching relative paths like "meals.html"
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
});