function save_options() {
  console.log("Test");
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  chrome.storage.sync.set({
    tymyUsername: username,
    tymyPassword: password
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    tymyUsername: 'USERNAME',
    tymyPassword: 'PASSWORD'
  }, function(items) {
    document.getElementById('username').value = items.tymyUsername;
    document.getElementById('password').value = items.tymyPassword;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);