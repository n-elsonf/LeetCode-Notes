(function () {
  console.log('LeetCode to GitHub extension loaded');

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'showNotification') {
      console.log('Notification received:', request.message);
      showNotification(request.message);
    }
    return true;
  });

  // Create a notification function
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';

    if (type === 'error') {
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.border = '1px solid #f5c6cb';
    } else {
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.style.border = '1px solid #c3e6cb';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Log submission results for debugging
  console.log('Setting up mutation observer for LeetCode submissions');

  // Listen for submission results with more robust selectors
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const nodes = Array.from(mutation.addedNodes);
      for (const node of nodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('DOM change detected, checking for submission results');

          // More comprehensive check for successful submissions
          // Check for text in various potential notification elements
          const textElements = node.querySelectorAll('.notification-content, .success, .ant-message-success, .text-success');
          textElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            console.log('Found potential notification element:', text);
            if (text.includes('accepted') || text.includes('correct') || text.includes('success')) {
              console.log('Submission accepted detected!');
              handleAcceptedSubmission();
              return;
            }
          });

          // Check for success icons or classes
          const successElements = node.querySelectorAll(
            '.success-icon, .text-success, [data-status="success"], .ant-message-success, ' +
            '[class*="success"], [class*="correct"], .fa-check'
          );
          if (successElements.length > 0) {
            console.log('Success element found:', successElements[0]);
            handleAcceptedSubmission();
            return;
          }
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Also check for submissions through URL changes
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('/submissions/')) {
      console.log('URL changed to submissions page:', currentUrl);

      // Check if the page indicates success
      setTimeout(() => {
        const pageContent = document.body.textContent.toLowerCase();
        if (pageContent.includes('accepted') || pageContent.includes('correct solution')) {
          console.log('Submission page shows acceptance');

          // On submission pages, try to get code from the specific submission elements
          setTimeout(() => {
            handleAcceptedSubmission();
          }, 500); // Give a bit more time for code to load
        }
      }, 1000); // Give the page a moment to load

      lastUrl = currentUrl;
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });

  function handleAcceptedSubmission() {
    console.log('Handling accepted submission');

    // Try multiple selectors for problem title to improve resilience
    let problemTitle = '';
    const titleSelectors = [
      '.css-v3d350',
      'div[data-cy="question-title"]',
      '.question-title',
      'h4[data-cypress="QuestionTitle"]',
      '.title-container h4',
      'title'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        problemTitle = element.textContent.trim();
        console.log('Found problem title:', problemTitle);
        break;
      }
    }

    // If we still don't have a title, try to get it from the URL
    if (!problemTitle) {
      const pathParts = window.location.pathname.split('/');
      const problemSlug = pathParts.find(part => part !== '' && part !== 'problems');
      if (problemSlug) {
        problemTitle = problemSlug.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        console.log('Derived problem title from URL:', problemTitle);
      }
    }

    // Extract problem number from URL
    const pathMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    const problemSlug = pathMatch ? pathMatch[1] : '';
    console.log('Problem slug:', problemSlug);

    // Try to get the latest accepted solution code with proper line breaks
    let code = '';
    const codeElements = [
      // LeetCode submissions page (accepted solution detail view)
      '.ace_content',
      '.monaco-editor .view-lines',
      '[data-cy="solution-content"]',
      'pre code',
      '.CodeMirror-code',
      // Submission detail page in LeetCode
      '[data-cy="submissions-content"] pre',
      '.submissions-details-tabs-container pre',
      '[role="tabpanel"] pre'
    ];

    for (const selector of codeElements) {
      const element = document.querySelector(selector);
      if (element) {
        // Try innerText first as it better preserves formatting
        if (element.innerText) {
          code = element.innerText;
        } else {
          code = element.textContent;
        }

        // If the code is from Ace Editor, we need special handling for line breaks
        if (selector === '.ace_content') {
          // Extract code from Ace Editor with proper line breaks
          const lines = Array.from(element.querySelectorAll('.ace_line')).map(line => line.textContent);
          if (lines.length > 0) {
            code = lines.join('\n');
          }
        }

        // For Monaco Editor, collect all line elements
        if (selector === '.monaco-editor .view-lines') {
          const lines = Array.from(element.querySelectorAll('.view-line')).map(line => line.textContent);
          if (lines.length > 0) {
            code = lines.join('\n');
          }
        }

        console.log('Found code using selector:', selector);
        console.log('Code first 100 chars:', code.substring(0, 100));
        console.log('Code length:', code.length);
        console.log('Line count:', code.split('\n').length);
        break;
      }
    }

    // Get the submission language
    const language = getSubmissionLanguage();
    console.log('Detected language:', language);

    if (!code) {
      console.error('Could not find solution code');
      showNotification('Could not find solution code', 'error');
      return;
    }

    // Send to background script for GitHub upload
    console.log('Sending data to background script');
    chrome.runtime.sendMessage({
      action: 'pushToGithub',
      data: {
        problemTitle: problemTitle || problemSlug,
        code,
        language
      }
    }, response => {
      console.log('Background script response:', response);
    });
  }

  function getSubmissionLanguage() {
    // Try multiple selectors for the language
    const languageSelectors = [
      '.ant-select-selection-selected-value',
      '[data-cy="code-lang"]',
      '.select-lang',
      '.language-select'
    ];

    for (const selector of languageSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.toLowerCase();
      }
    }

    // Fallback: try to detect from the editor or code classes
    const editorClasses = document.querySelector('.monaco-editor, .ace_editor, .CodeMirror')?.className || '';
    const languageMatches = editorClasses.match(/language-(\w+)/);

    return languageMatches ? languageMatches[1].toLowerCase() : '';
  }
})();