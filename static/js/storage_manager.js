// static/js/storage_manager.js

// Export local storage data as a JSON file
function exportLocalStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown_editor_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import local storage data from a JSON file
function importLocalStorage(fileInput, callback) {
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to import.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.clear();
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            if (callback) callback();
            alert('Data imported successfully.');
        } catch (err) {
            alert('Error importing data: Invalid JSON file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// Initialize storage manager functionality
function initStorageManager() {
    const waitForButtons = () => {
        const exportButton = document.getElementById('export-button');
        const importButton = document.getElementById('import-button');
        const importFile = document.getElementById('import-file');

        if (exportButton && importButton && importFile) {
            exportButton.addEventListener('click', () => {
                exportLocalStorage();
            });
            importButton.addEventListener('click', () => {
                importFile.click();
            });
            importFile.addEventListener('change', () => {
                importLocalStorage(importFile, () => {
                    initSaveLocal(); // Refresh UI
                });
                importFile.value = '';
            });
            console.log('Storage manager initialized');
        } else {
            console.log('Waiting for import/export buttons...');
            setTimeout(waitForButtons, 100); // Retry every 100ms
        }
    };

    // Start checking for buttons
    waitForButtons();
}

// Expose functions globally
window.exportLocalStorage = exportLocalStorage;
window.importLocalStorage = importLocalStorage;
window.initStorageManager = initStorageManager;

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initStorageManager();
});