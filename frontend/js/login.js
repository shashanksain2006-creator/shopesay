if (Auth.isLoggedIn()) location.href = 'products.html';
const form = $('form'), msg = $('msg'), btn = $('btn');
form.addEventListener('submit', async (e) => {
  e.preventDefault(); clearMsg(msg);
  const email = form.email.value.trim(), password = form.password.value;
  if (!email || !password) return showMsg(msg, 'Enter your email and password');
  btn.disabled = true; btn.textContent = 'Logging in...';
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    Auth.save(data.token, data.user); Auth.afterLogin();
  } catch (err) { showMsg(msg, err.message); btn.disabled = false; btn.textContent = 'Log in'; }
});
