// static/js/live_preview.js

let previewWindow = null;

// Set up the preview window with initial HTML and styles
function setupPreviewWindow() {
    console.log('Step: Setting up preview window');
    if (previewWindow && !previewWindow.closed) {
        console.log(' - Closing existing preview window');
        previewWindow.close();
    }
    previewWindow = window.open('', 'MarkdownPreview', 'width=400,height=300');
    if (!previewWindow) {
        console.error('Failed to open preview window. Check pop-up blocker.');
        return false;
    }
    const isDarkMode = document.body.classList.contains('dark-mode');
    const bgColor = isDarkMode ? '#333' : '#fff';
    const textColor = isDarkMode ? '#fff' : '#000';
    console.log(' - Preview window opened with dark mode:', isDarkMode);
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Live Preview</title>
            <style>
                body {
                    margin: 10px;
                    font-family: Arial, sans-serif;
                    background-color: ${bgColor};
                    color: ${textColor};
                }
                #preview-content {
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                }
            </style>
        </head>
        <body class="${isDarkMode ? 'dark-mode' : ''}">
            <div id="preview-content"></div>
        </body>
        </html>
    `);
    previewWindow.document.close();
    console.log(' - Preview window HTML written and closed');
    return true;
}

// Define the custom renderer for Marked.js
const renderer = new marked.Renderer();
renderer.image = function(token) {
    console.log('Step: Rendering image token');
    console.log(' - Received token type:', typeof token);

    // Extract href, title, and text from token object (Marked.js v5+)
    const href = token.href;
    const title = token.title;
    const text = token.text;
    console.log(' - Extracted href type:', typeof href, 'value:', href);
    console.log(' - Extracted title type:', typeof title, 'value:', title);
    console.log(' - Extracted text type:', typeof text, 'value:', text);

    if (typeof href === 'string' && href.startsWith('local:')) {
        console.log(' - Processing local image link');
        const key = href.slice(6);
        console.log(' - Extracted key from href:', key);

        const imageData = window.getImageData ? window.getImageData(key) : null;
        console.log(' - Retrieved imageData from local storage for key:', key);
        console.log(' - imageData type:', typeof imageData);
        console.log(' - imageData starts with "data:image/":', imageData && typeof imageData === 'string' && imageData.startsWith('data:image/'));

        if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image/')) {
            console.log(' - Valid image data found, rendering img tag');
            return `<img src="${imageData}" alt="${text || 'Image'}" title="${title || ''}">`;
        } else {
            console.warn(' - Invalid or missing image data for key:', key);
            return `<span>Image not found or invalid: ${key}</span>`;
        }
    } else {
        console.log(' - Processing non-local or invalid image link');
        const safeHref = typeof href === 'string' ? href : '';
        console.log(' - Using safeHref:', safeHref);
        return `<img src="${safeHref}" alt="${text || 'Image'}" title="${title || ''}">`;
    }
};

// Configure Marked.js with the custom renderer
marked.use({ renderer });

// Define window.updatePreview globally
window.updatePreview = function(markdown) {
    console.log('Step: Updating preview');
    console.log(' - Markdown input received');
    if (previewWindow && !previewWindow.closed) {
        console.log(' - Preview window is open');
        const previewContent = previewWindow.document.getElementById('preview-content');
        if (previewContent) {
            console.log(' - Preview content element found');
            try {
                previewContent.innerHTML = marked.parse(markdown);
                console.log(' - Preview successfully updated');
            } catch (e) {
                console.error(' - Error parsing markdown:', e);
                previewContent.innerHTML = '<span>Error rendering preview</span>';
            }
        } else {
            console.warn(' - Preview content element not found');
        }
    } else {
        console.log(' - Preview window not open, skipping update');
    }
};

// Sync the preview window’s theme with the main window
function syncPreviewTheme() {
    console.log('Step: Syncing preview theme');
    if (previewWindow && !previewWindow.closed) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const previewBody = previewWindow.document.body;
        console.log(' - Applying dark mode:', isDarkMode);
        previewBody.classList.toggle('dark-mode', isDarkMode);
        previewBody.style.backgroundColor = isDarkMode ? '#333' : '#fff';
        previewBody.style.color = isDarkMode ? '#fff' : '#000';
        console.log(' - Theme sync completed');
    } else {
        console.log(' - Preview window not open, skipping theme sync');
    }
}

// Initialize the live preview functionality
function initLivePreview() {
    console.log('Step: Initializing live preview');
    const editor = document.getElementById('editor');
    const openPreviewButton = document.getElementById('open-preview');

    if (!editor || !openPreviewButton) {
        console.log(' - Editor or open-preview button not found, retrying...');
        setTimeout(initLivePreview, 100);
        return;
    }
    console.log(' - Editor and open-preview button found');

    openPreviewButton.addEventListener('click', () => {
        console.log(' - Open preview button clicked');
        if (setupPreviewWindow()) {
            window.updatePreview(editor.value);
        }
    });

    editor.addEventListener('input', () => {
        console.log(' - Editor input event triggered');
        window.updatePreview(editor.value);
    });

    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
        themeButton.addEventListener('click', () => {
            console.log(' - Theme toggle button clicked');
            setTimeout(syncPreviewTheme, 0);
        });
    }

    window.addEventListener('unload', () => {
        console.log(' - Window unloading');
        if (previewWindow && !previewWindow.closed) {
            previewWindow.close();
            console.log(' - Preview window closed');
        }
    });

    // Initial preview update if content exists
    if (editor.value) {
        console.log(' - Initial content detected in editor');
        window.updatePreview(editor.value);
    } else {
        console.log(' - No initial content in editor');
    }
}

// Run initialization
initLivePreview();