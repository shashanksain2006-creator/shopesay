const form = $('form'), msg = $('msg'), btn = $('btn');
form.addEventListener('submit', async (e) => {
  e.preventDefault(); clearMsg(msg);
  const name = $('name').value.trim(), email = $('email').value.trim(), message = $('message').value.trim();
  if (name.length < 2) return showMsg(msg, 'Please enter your name');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showMsg(msg, 'Please enter a valid email');
  if (message.length < 5) return showMsg(msg, 'Message is too short');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    const data = await api('/contact', { method: 'POST', body: { name, email, message } });
    showMsg(msg, data.message, 'success'); form.reset();
  } catch (err) { showMsg(msg, err.message); }
  btn.disabled = false; btn.textContent = 'Send message';
});
