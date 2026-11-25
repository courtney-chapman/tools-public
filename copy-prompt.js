document.addEventListener('click', async event => {
  const button = event.target.closest('.copy-prompt');
  if (!button) return;
  const prompt = button.closest('.prompt-block, .setup-prompt')?.querySelector('textarea');
  if (!prompt) return;
  try {
    await navigator.clipboard.writeText(prompt.value);
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = 'Copy prompt'; }, 2000);
  } catch {
    prompt.focus();
    prompt.select();
    button.textContent = 'Select and copy';
  }
});
