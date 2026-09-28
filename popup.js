const toggleButton = document.getElementById('toggle');
toggleButton.addEventListener('click', () => {
  toggleButton.innerText = toggleButton.innerText === 'Enable' ? 'Disable' : 'Enable';
  toggleButton.classList.toggle('enabled');
});
