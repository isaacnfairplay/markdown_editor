// static/js/save_local.js

function initSaveLocal() {
    // Wait for window.updatePreview to be defined
    if (typeof window.updatePreview !== 'function') {
        console.log('Waiting for window.updatePreview to be defined...');
        setTimeout(initSaveLocal, 100);
        return;
    }

    const editor = document.getElementById('editor');
    const docTitle = document.getElementById('doc-title');
    const saveButton = document.getElementById('save-button');
    const toc = document.getElementById('toc');
    let autoSaveTimeout;
    let currentTitle = ''; // Track the current document title

    if (!editor || !docTitle || !saveButton || !toc) {
        console.error('Required elements not found, retrying...');
        setTimeout(initSaveLocal, 100);
        return;
    }

    // Get last version for a document
    function getLastVersion(title) {
        const rawDoc = localStorage.getItem(title);
        const doc = rawDoc ? JSON.parse(rawDoc) : { versions: [] };
        const versions = Array.isArray(doc.versions) ? doc.versions : [];
        return versions.length > 0 ? versions[versions.length - 1] : null;
    }

    // Compute diff between two strings
    function computeDiff(oldContent, newContent) {
        return Diff.diffLines(oldContent, newContent);
    }

    // Generate readable diff text
    function generateDiffText(diff) {
        let diffText = '';
        diff.forEach(part => {
            const lines = part.value.split('\n').filter(line => line !== '');
            lines.forEach(line => {
                if (part.added) diffText += `+ ${line}\n`;
                else if (part.removed) diffText += `- ${line}\n`;
                else diffText += `  ${line}\n`;
            });
        });
        return diffText.trim();
    }

    // Show approval dialog with diff
    function showApprovalDialog(diffText, onApprove) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';

        const dialog = document.createElement('div');
        dialog.style.backgroundColor = isDarkMode ? '#333' : '#fff';
        dialog.style.color = isDarkMode ? '#fff' : '#000';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '5px';
        dialog.style.maxWidth = '80%';
        dialog.style.maxHeight = '80%';
        dialog.style.overflow = 'auto';

        const pre = document.createElement('pre');
        pre.textContent = diffText;
        dialog.appendChild(pre);

        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comment (optional): ';
        dialog.appendChild(commentLabel);

        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.style.backgroundColor = isDarkMode ? '#444' : '#fff';
        commentInput.style.color = isDarkMode ? '#fff' : '#000';
        commentInput.style.border = isDarkMode ? '1px solid #666' : '1px solid #ccc';
        dialog.appendChild(commentInput);

        const approveButton = document.createElement('button');
        approveButton.textContent = 'Approve (Enter)';
        approveButton.style.margin = '10px';
        approveButton.style.backgroundColor = isDarkMode ? '#555' : '#ddd';
        approveButton.style.color = isDarkMode ? '#fff' : '#000';
        approveButton.onclick = () => {
            onApprove(commentInput.value);
            document.body.removeChild(modal);
        };
        dialog.appendChild(approveButton);

        const discardButton = document.createElement('button');
        discardButton.textContent = 'Discard (Esc)';
        discardButton.style.backgroundColor = isDarkMode ? '#555' : '#ddd';
        discardButton.style.color = isDarkMode ? '#fff' : '#000';
        discardButton.onclick = () => document.body.removeChild(modal);
        dialog.appendChild(discardButton);

        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                approveButton.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                discardButton.click();
            }
        };
        document.addEventListener('keydown', handleKeydown);
        const cleanup = () => {
            document.removeEventListener('keydown', handleKeydown);
        };
        approveButton.addEventListener('click', cleanup, { once: true });
        discardButton.addEventListener('click', cleanup, { once: true });

        modal.appendChild(dialog);
        document.body.appendChild(modal);
        commentInput.focus();
    }

    // Save a new version
    function saveNewVersion(title, content, comment = '') {
        const doc = JSON.parse(localStorage.getItem(title) || '{"versions":[]}');
        doc.versions = Array.isArray(doc.versions) ? doc.versions : [];
        doc.versions.push({
            content,
            timestamp: new Date().toISOString(),
            comment
        });
        localStorage.setItem(title, JSON.stringify(doc));
        localStorage.setItem('lastSavedTitle', title);
        updateTOC();
        if (currentTitle === title) {
            updateVersionsList(title);
        }
    }

    // Update TOC
    function updateTOC() {
        toc.innerHTML = '';
        Object.keys(localStorage).filter(key => key !== 'lastSavedTitle').forEach(title => {
            const li = document.createElement('li');
            li.textContent = title;
            li.addEventListener('click', () => {
                const lastVersion = getLastVersion(title);
                editor.value = lastVersion ? lastVersion.content : '';
                docTitle.value = title;
                currentTitle = title;
                window.updatePreview(editor.value);
                updateVersionsList(title);
            });
            toc.appendChild(li);
        });
    }

    // Update versions list
    function updateVersionsList(title) {
        const versionsList = document.getElementById('versions-list');
        if (!versionsList) {
            console.error('Versions list element not found');
            return;
        }
        versionsList.innerHTML = '';
        const doc = JSON.parse(localStorage.getItem(title) || '{"versions":[]}');
        const versions = Array.isArray(doc.versions) ? doc.versions : [];
        versions.forEach((version, index) => {
            const li = document.createElement('li');
            li.textContent = `${version.timestamp} - ${version.comment || 'No comment'}`;
            li.addEventListener('click', () => {
                const prevContent = index > 0 ? versions[index - 1].content : '';
                const diff = computeDiff(prevContent, version.content);
                const diffText = generateDiffText(diff);
                alert(diffText);
            });
            versionsList.appendChild(li);
        });
    }

    // Auto-save logic
    function tryAutoSave() {
        let title = docTitle.value.trim() || 'Untitled';
        if (!docTitle.value.trim()) docTitle.value = title;
        performAutoSave(title);
    }

    function performAutoSave(title) {
        const content = editor.value;
        const lastVersion = getLastVersion(title);
        const lastContent = lastVersion ? lastVersion.content : '';
        if (content === lastContent) return;
        const diff = computeDiff(lastContent, content);
        const hasChanges = diff.some(change => change.added || change.removed);
        if (hasChanges && !diff.some(change => change.removed)) {
            console.log('Auto-saving due to additions');
            saveNewVersion(title, content, 'Auto-save');
        } else {
            console.log('Skipping auto-save: deletions or no changes');
        }
    }

    // Reset auto-save timer
    function resetAutoSaveTimer() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(tryAutoSave, 5 * 60 * 1000); // 5 minutes
    }

    // Manual save
    saveButton.addEventListener('click', () => {
        const title = docTitle.value.trim();
        if (!title) {
            alert('Please enter a title');
            return;
        }
        const content = editor.value;
        const lastVersion = getLastVersion(title);
        const lastContent = lastVersion ? lastVersion.content : '';
        if (content === lastContent) {
            alert('No changes to save');
            return;
        }
        const diff = computeDiff(lastContent, content);
        const diffText = generateDiffText(diff);
        showApprovalDialog(diffText, comment => {
            saveNewVersion(title, content, comment);
            resetAutoSaveTimer();
        });
    });

    // Auto-save triggers
    editor.addEventListener('input', resetAutoSaveTimer);
    editor.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            console.log('Enter pressed');
            tryAutoSave();
        }
    });

    // Ctrl+S to trigger manual save
    editor.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            console.log('Ctrl+S pressed, triggering manual save');
            saveButton.click();
        }
    });

    // Load last saved item on page load
    const lastSavedTitle = localStorage.getItem('lastSavedTitle');
    if (lastSavedTitle) {
        const lastVersion = getLastVersion(lastSavedTitle);
        if (lastVersion) {
            docTitle.value = lastSavedTitle;
            editor.value = lastVersion.content;
            currentTitle = lastSavedTitle;
            window.updatePreview(lastVersion.content);
            updateVersionsList(lastSavedTitle);
        }
    }

    // Initial TOC load
    updateTOC();
}

// Expose initSaveLocal globally
window.initSaveLocal = initSaveLocal;