// static/js/image_manager.js

// Upload image and store as WebP in local storage
function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const webpData = canvas.toDataURL('image/webp');
                const key = `image_${Date.now()}`; // Unique key using timestamp
                localStorage.setItem(key, webpData);
                resolve(key);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Retrieve image data from local storage
function getImageData(key) {
    return localStorage.getItem(key);
}

// Insert Markdown image link at cursor position
function insertImageLink(editor, key, altText) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const link = `![${altText}](local:${key})`;
    const newText = text.slice(0, start) + link + text.slice(end);
    editor.value = newText;
    editor.setSelectionRange(start + link.length, start + link.length);
    editor.dispatchEvent(new Event('input')); // Trigger preview update
}

// Handle image paste event
function handlePaste(editor) {
    editor.addEventListener('paste', async (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                const key = await uploadImage(file);
                insertImageLink(editor, key, 'Pasted Image');
                event.preventDefault(); // Prevent default paste
                break;
            }
        }
    });
}

// Initialize image manager
function initImageManager() {
    const editor = document.getElementById('editor');
    if (editor) {
        handlePaste(editor);
    } else {
        console.log('Editor not found, retrying...');
        setTimeout(initImageManager, 100); // Retry until editor is loaded
    }
}

// Expose functions globally
window.uploadImage = uploadImage;
window.getImageData = getImageData;
window.insertImageLink = insertImageLink;
window.initImageManager = initImageManager;