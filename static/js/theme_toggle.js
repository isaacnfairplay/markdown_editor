const themeButton = document.getElementById('theme-toggle');

function updateButtonText() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeButton.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    updateButtonText();
});

updateButtonText();