
const toggleButton = document.getElementById('toggle');
const soundRemovalCheckbox = document.getElementById('soundRemoval');
const nameRemovalCheckbox = document.getElementById('nameRemoval');
const settings = await chrome.storage.local.get({ 'enabled': false, 'nameRemoval': false, 'soundRemoval': false });
let enabled = settings.enabled;
console.log(`Simply Said: Extension is currently ${enabled.enabled ? 'enabled' : 'disabled'}.`);
// Set the initial state of the button based on the stored value
if (enabled) {
  toggleButton.innerText = 'Disable';
  toggleButton.classList.toggle('enabled');
}
if (settings.soundRemoval) {
  soundRemovalCheckbox.checked = true;
}
if (settings.nameRemoval) {
  nameRemovalCheckbox.checked = true;
}
// Add a click event listener to the button to toggle the enabled state
toggleButton.addEventListener('click', async () => {
  toggleButton.innerText = toggleButton.innerText === 'Enable' ? 'Disable' : 'Enable';
  toggleButton.classList.toggle('enabled');
  enabled = !enabled;
  await chrome.storage.local.set({ enabled: enabled });
  console.log(`Simply Said: ${enabled ? 'Enabled' : 'Disabled'}`);

});
soundRemovalCheckbox.addEventListener('change', async () => {
  const soundRemovalEnabled = soundRemovalCheckbox.checked;
  await chrome.storage.local.set({ soundRemoval: soundRemovalEnabled });
  console.log(`Simply Said: Sound removal is now ${soundRemovalEnabled ? 'enabled' : 'disabled'}.`);
});
nameRemovalCheckbox.addEventListener('change', async () => {
  const nameRemovalEnabled = nameRemovalCheckbox.checked;
  await chrome.storage.local.set({ nameRemoval: nameRemovalEnabled });
  console.log(`Simply Said: Sound removal is now ${nameRemovalEnabled ? 'enabled' : 'disabled'}.`);
});
