// script.js

// 1. Prevent "Link Breakout" on iOS
// This code intercepts all clicks on links. If the link is internal,
// it manually changes the URL without opening a new Safari window.
document.addEventListener('click', function(e) {
    // Find the closest anchor tag (in case user clicks an icon inside the A tag)
    var target = e.target.closest('a');
    
    // If a link was clicked AND it points to this same website
    if (target && target.getAttribute('href') && !target.getAttribute('href').startsWith('http')) {
        e.preventDefault(); // Stop Safari from doing its default "new window" thing
        window.location.href = target.getAttribute('href'); // Go there manually
    }
}, false);

// 2. Highlight the correct tab based on the current URL
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-item').forEach(item => {
        // Remove active class from everyone
        item.classList.remove('active');
        
        // precise matching: if the link href matches the current file
        const itemHref = item.getAttribute('href');
        if (itemHref === currentPath || (currentPath === '' && itemHref === 'index.html')) {
            item.classList.add('active');
        }
    });
});