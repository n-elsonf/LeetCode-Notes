(function () {
  // Listen for submission results
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const nodes = Array.from(mutation.addedNodes);
      for (const node of nodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for notification elements
          const notificationElements = node.querySelectorAll('.notification-content');

          // Check if any contain "Accepted" text
          notificationElements.forEach(element => {
            if (element.textContent.includes('Accepted')) {
              handleAcceptedSubmission();
              return;
            }
          });

          // Alternative approach: check for success status indicators
          const successElements = node.querySelectorAll('.success-icon, .text-success, [data-status="success"]');
          if (successElements.length > 0) {
            handleAcceptedSubmission();
            return;
          }
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  function handleAcceptedSubmission() {
    // Get problem details
    const problemTitle = document.querySelector('.css-v3d350')?.textContent ||
      document.querySelector('title')?.textContent.replace(' - LeetCode', '') ||
      'Unknown Problem';

    const problemNumber = window.location.pathname.split('/')[2];

    // Get the solution code - with improved selector fallbacks
    let code = '';

    // Try multiple ways to get the code
    const aceEditor = document.querySelector('.ace_content');
    if (aceEditor) {
      // Get from Ace editor
      code = extractCodeFromAceEditor(aceEditor);
    } else {
      // Try to get from code elements
      const codeElements = document.querySelectorAll('pre, code, .CodeMirror');
      if (codeElements.length > 0) {
        // Use the largest code block
        let largestCode = '';
        codeElements.forEach(el => {
          if (el.textContent.length > largestCode.length) {
            largestCode = el.textContent;
          }
        });
        code = largestCode;
      }
    }

    // If still no code, try extracting from the DOM
    if (!code) {
      const submissionElements = document.querySelectorAll('.result-container, .submission-result, .accepted');
      submissionElements.forEach(el => {
        const possibleCode = el.querySelector('pre, code');
        if (possibleCode && possibleCode.textContent.length > code.length) {
          code = possibleCode.textContent;
        }
      });
    }

    // Get the language
    const language = getSubmissionLanguage();

    // Send to background script for GitHub upload
    chrome.runtime.sendMessage({
      action: 'pushToGithub',
      data: {
        problemNumber,
        problemTitle,
        code,
        language
      }
    });
  }

  // Extract code from Ace editor with better handling
  function extractCodeFromAceEditor(aceEditor) {
    // Get all text lines
    const lines = [];
    const rows = aceEditor.querySelectorAll('.ace_line');
    rows.forEach(row => {
      lines.push(row.textContent);
    });

    return lines.join('\n');
  }

  function getSubmissionLanguage() {
    // Get the selected language from LeetCode's UI with fallbacks
    const languageSelector = document.querySelector('.ant-select-selection-selected-value') ||
      document.querySelector('[data-cy="select-lang"]') ||
      document.querySelector('.select-lang');

    if (languageSelector) {
      return languageSelector.textContent.toLowerCase();
    }

    // Try to determine from code content or URL
    const url = window.location.href;
    if (url.includes('/python/')) return 'python';
    if (url.includes('/javascript/')) return 'javascript';
    if (url.includes('/java/')) return 'java';
    if (url.includes('/cpp/')) return 'cpp';

    // Default
    return '';
  }

  // Add a notification handler
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'showNotification') {
      showNotification(request.message);
    }
    return true;
  });

  function showNotification(message) {
    // Create a notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after a few seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
})();