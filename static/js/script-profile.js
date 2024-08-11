document.getElementById('settings-icon').addEventListener('click', function() {
    document.getElementById('settings-overlay').style.display = 'flex';
});

document.getElementById('close-settings').addEventListener('click', function() {
    document.getElementById('settings-overlay').style.display = 'none';
});
