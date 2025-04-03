// Add logging to track activity
console.log('LeetCode to GitHub background script loaded');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Background script received message:', request);

  if (request.action === 'pushToGithub') {
    pushSolutionToGithub(request.data)
      .then(result => {
        console.log('Push to GitHub result:', result);
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Push to GitHub error:', error);
        sendResponse({ success: false, error: error.toString() });
      });
  }

  // This is important to use sendResponse asynchronously
  return true;
});

async function pushSolutionToGithub(data) {
  try {
    console.log('Processing GitHub push for:', data);

    // Get settings from storage
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get(['githubToken', 'repoOwner', 'repoName', 'language'], resolve);
    });

    console.log('Retrieved settings (token redacted):', {
      ...settings,
      githubToken: settings.githubToken ? '***' : undefined
    });

    if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
      const errorMsg = 'Please configure GitHub settings in the extension popup';
      console.error(errorMsg);
      showNotification(errorMsg, 'error');
      throw new Error(errorMsg);
    }

    const { problemNumber, problemTitle, code } = data;

    // Get file extension based on language
    const fileExtension = getFileExtension(data.language || settings.language);
    console.log('Using file extension:', fileExtension);

    // Create sanitized filename
    const sanitizedTitle = problemTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const fileName = `${problemNumber}_${sanitizedTitle}.${fileExtension}`;
    console.log('Generated filename:', fileName);

    // Create commit message
    const commitMessage = `Add solution for ${problemNumber}: ${problemTitle}`;

    // Check if file already exists
    console.log('Checking if file already exists:', fileName);
    const fileExists = await checkFileExists(settings, fileName);
    console.log('File exists:', fileExists);

    let result;
    if (fileExists) {
      console.log('Updating existing file');
      result = await updateFile(settings, fileName, code, commitMessage);
    } else {
      console.log('Creating new file');
      result = await createFile(settings, fileName, code, commitMessage);
    }

    const successMsg = `Successfully pushed solution to GitHub: ${fileName}`;
    console.log(successMsg, result);
    showNotification(successMsg);
    return result;

  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    showNotification(`Error: ${error.message}`, 'error');
    throw error;
  }
}

function getFileExtension(language) {
  if (!language) {
    console.warn('No language specified, defaulting to .txt');
    return 'txt';
  }

  const extensions = {
    'javascript': 'js',
    'python': 'py',
    'python3': 'py',
    'java': 'java',
    'c++': 'cpp',
    'c#': 'cs',
    'go': 'go',
    'ruby': 'rb',
    'kotlin': 'kt',
    'swift': 'swift',
    'js': 'js',
    'py': 'py',
    'cpp': 'cpp',
    'cs': 'cs',
    'rb': 'rb',
    'kt': 'kt'
  };

  const ext = extensions[language.toLowerCase()] || 'txt';
  console.log(`Mapped language "${language}" to extension "${ext}"`);
  return ext;
}

async function checkFileExists(settings, fileName) {
  try {
    console.log(`Checking if file exists: ${fileName}`);
    const url = `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`;
    console.log('API URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('File check response status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

async function createFile(settings, fileName, content, commitMessage) {
  console.log(`Creating file: ${fileName}`);
  const url = `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`;
  console.log('API URL:', url);

  try {
    // Make sure we're preserving line breaks correctly
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    console.log('Content line count before encoding:', normalizedContent.split('\n').length);
    console.log('Content first 100 chars:', normalizedContent.substring(0, 100));

    // Proper Base64 encoding for GitHub API
    const encodedContent = btoa(unescape(encodeURIComponent(normalizedContent)));
    console.log('Content encoded for GitHub API');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: encodedContent,
        branch: 'main'
      })
    });

    console.log('Create file response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API error response:', errorData);
      throw new Error(errorData.message || `Failed to create file (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createFile:', error);
    throw error;
  }
}

async function updateFile(settings, fileName, content, commitMessage) {
  console.log(`Updating file: ${fileName}`);

  try {
    // First get the SHA of the existing file
    const fileUrl = `https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`;
    console.log('File API URL:', fileUrl);

    const fileResponse = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('Get file response status:', fileResponse.status);

    if (!fileResponse.ok) {
      const errorData = await fileResponse.json();
      console.error('GitHub API error response when getting file:', errorData);
      throw new Error(errorData.message || `Failed to get existing file (Status: ${fileResponse.status})`);
    }

    const fileData = await fileResponse.json();
    console.log('Retrieved file SHA:', fileData.sha);

    // Now update the file with the new content
    // Make sure we're preserving line breaks correctly
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    console.log('Content line count before encoding:', normalizedContent.split('\n').length);
    console.log('Content first 100 chars:', normalizedContent.substring(0, 100));

    // Proper Base64 encoding for GitHub API
    const encodedContent = btoa(unescape(encodeURIComponent(normalizedContent)));
    console.log('Content encoded for GitHub API');

    const updateResponse = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: encodedContent,
        sha: fileData.sha,
        branch: 'main'
      })
    });

    console.log('Update file response status:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('GitHub API error response when updating file:', errorData);
      throw new Error(errorData.message || `Failed to update file (Status: ${updateResponse.status})`);
    }

    return await updateResponse.json();
  } catch (error) {
    console.error('Error in updateFile:', error);
    throw error;
  }
}

function showNotification(message, type = 'info') {
  console.log(`Showing notification: ${message} (${type})`);

  // Try to send notification to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showNotification',
        message: message,
        type: type
      }, response => {
        if (chrome.runtime.lastError) {
          console.warn('Error sending notification to tab:', chrome.runtime.lastError);
        } else {
          console.log('Notification sent to tab, response:', response);
        }
      });
    } else {
      console.warn('No active tab found to send notification');
    }
  });
}