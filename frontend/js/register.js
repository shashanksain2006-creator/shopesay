if (Auth.isLoggedIn()) location.href = 'products.html';
const form = $('form'), msg = $('msg'), btn = $('btn');
form.addEventListener('submit', async (e) => {
  e.preventDefault(); clearMsg(msg);
  const name = $('name').value.trim(), email = $('email').value.trim(), password = $('password').value;
  if (name.length < 2) return showMsg(msg, 'Please enter your name');
  if (!/^\S+@\S+\.\S+$/.test(email)) return showMsg(msg, 'Please enter a valid email');
  if (password.length < 8) return showMsg(msg, 'Password must be at least 8 characters');
  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    Auth.save(data.token, data.user); Auth.afterLogin();
  } catch (err) { showMsg(msg, err.message); btn.disabled = false; btn.textContent = 'Register'; }
});
