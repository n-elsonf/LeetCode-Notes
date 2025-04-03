chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'pushToGithub') {
    pushSolutionToGithub(request.data);
  }
  return true;
});

async function pushSolutionToGithub(data) {
  try {
    // Get settings from storage
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get(['githubToken', 'repoOwner', 'repoName', 'language'], resolve);
    });

    if (!settings.githubToken || !settings.repoOwner || !settings.repoName) {
      showNotification('Please configure GitHub settings in the extension popup');
      return;
    }

    const { problemNumber, problemTitle, code } = data;

    // Get file extension based on language
    const fileExtension = getFileExtension(data.language || settings.language);

    // Create sanitized filename - now without the problem number
    const sanitizedTitle = problemTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const fileName = `${sanitizedTitle}.${fileExtension}`;

    // Create commit message - still keeping the problem number in the commit message for reference
    const commitMessage = `Add solution for ${problemNumber}: ${problemTitle}`;

    // Check if file already exists to determine if we're creating or updating
    const fileExists = await checkFileExists(settings, fileName);

    if (fileExists) {
      await updateFile(settings, fileName, code, commitMessage);
    } else {
      await createFile(settings, fileName, code, commitMessage);
    }

    showNotification(`Successfully pushed solution to GitHub!`);
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    showNotification(`Error: ${error.message}`);
  }
}

function getFileExtension(language) {
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

  return extensions[language.toLowerCase()] || 'txt';
}

async function checkFileExists(settings, fileName) {
  try {
    const response = await fetch(`https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`, {
      headers: {
        'Authorization': `token ${settings.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function createFile(settings, fileName, content, commitMessage) {
  const response = await fetch(`https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${settings.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: 'main'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create file');
  }

  return response.json();
}

async function updateFile(settings, fileName, content, commitMessage) {
  // First get the SHA of the existing file
  const fileResponse = await fetch(`https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`, {
    headers: {
      'Authorization': `token ${settings.githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!fileResponse.ok) {
    throw new Error('Failed to get existing file');
  }

  const fileData = await fileResponse.json();

  // Now update the file with the new content
  const response = await fetch(`https://api.github.com/repos/${settings.repoOwner}/${settings.repoName}/contents/${fileName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${settings.githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      sha: fileData.sha,
      branch: 'main'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update file');
  }

  return response.json();
}

function showNotification(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showNotification',
        message: message
      });
    }
  });
}