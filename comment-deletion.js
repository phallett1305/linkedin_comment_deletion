async function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Get clickable parent of each ellipsis icon
function getDeleteCommentDropdowns() {
    const svgs = Array.from(document.querySelectorAll('svg[aria-label^="Open options for"]'));
    return svgs.map(svg => svg.closest('button, span, div')).filter(Boolean);
}

// Get delete confirmation button (inside dialog)
function getDeleteConfirmationButton() {
    return Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.trim().toLowerCase() === 'delete'
    );
}

// Get readable timestamp
function getCurrentTimestamp() {
    return new Date().toLocaleString();
}

// Try to extract comment text (may vary by layout)
function getCommentTextFromDropdown(dropdown) {
    try {
        return dropdown.closest('.comments-comment-item')?.innerText.trim().split('\n')[0] ?? '[Comment text not found]';
    } catch {
        return '[Comment text not found]';
    }
}

// Confirm deletion
async function deleteComment(commentText) {
    await sleep(2);
    const confirmBtn = getDeleteConfirmationButton();
    if (confirmBtn) {
        confirmBtn.click();
        console.log(`[${getCurrentTimestamp()}] Deleted comment: "${commentText}"`);
    } else {
        console.warn(`[${getCurrentTimestamp()}] Delete confirmation button not found.`);
    }
}

// Deletes all currently loaded comments
async function deleteActivity() {
    const dropdowns = getDeleteCommentDropdowns();
    console.log(`Found ${dropdowns.length} comment ellipsis buttons.`);

    for (const dropdown of dropdowns) {
        try {
            const commentText = getCommentTextFromDropdown(dropdown);
            dropdown.click();
            await sleep(2);

            const deleteOption = Array.from(document.querySelectorAll(".comment-options-dropdown__option-text span"))
                .find(span => span.textContent.toLowerCase().includes("delete"));

            if (deleteOption) {
                deleteOption.click();
                await deleteComment(commentText);
            } else {
                console.warn(`[${getCurrentTimestamp()}] 'Delete' option not found for comment: "${commentText}"`);
            }

            await sleep(3);
        } catch (err) {
            console.error(`[${getCurrentTimestamp()}] Error processing comment:`, err);
        }
    }
}

// Count total delete buttons found
async function countTotalComments() {
    try {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(5);
        const count = getDeleteCommentDropdowns().length;
        console.log(`[${getCurrentTimestamp()}] Total deletable comments detected: ${count}`);
        return count;
    } catch (err) {
        console.error(`[${getCurrentTimestamp()}] Failed to count comments. Possibly offline.`, err);
        return 0;
    }
}

// Main loop
async function init() {
    console.log(`[${getCurrentTimestamp()}] Starting comment deletion...`);

    const maxIterations = await countTotalComments();
    if (maxIterations === 0) {
        console.warn(`[${getCurrentTimestamp()}] No deletable comments found or offline. Exiting.`);
        return;
    }

    let iteration = 0;

    async function runCycle() {
        if (iteration >= maxIterations) {
            console.log(`[${getCurrentTimestamp()}] All detected comments deleted.`);
            return;
        }

        iteration++;
        console.log(`[${getCurrentTimestamp()}] Deletion cycle ${iteration} of ${maxIterations}`);
        await deleteActivity();
        await sleep(5);
        runCycle();
    }

    runCycle();
}

init();
