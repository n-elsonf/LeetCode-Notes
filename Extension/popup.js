document.addEventListener('DOMContentLoaded', function () {
  // Load saved settings
  chrome.storage.sync.get(['githubToken', 'repoOwner', 'repoName', 'language'], function (data) {
    document.getElementById('githubToken').value = data.githubToken || '';
    document.getElementById('repoOwner').value = data.repoOwner || '';
    document.getElementById('repoName').value = data.repoName || '';
    document.getElementById('language').value = data.language || 'js';
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function () {
    const githubToken = document.getElementById('githubToken').value;
    const repoOwner = document.getElementById('repoOwner').value;
    const repoName = document.getElementById('repoName').value;
    const language = document.getElementById('language').value;

    if (!githubToken || !repoOwner || !repoName) {
      showStatus('Please fill in all fields', 'error');
      return;
    }

    chrome.storage.sync.set({
      githubToken,
      repoOwner,
      repoName,
      language
    }, function () {
      showStatus('Settings saved successfully!', 'success');
    });
  });

  function showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = 'status ' + type;
    setTimeout(function () {
      statusElement.textContent = '';
      statusElement.className = 'status';
    }, 3000);
  }
});