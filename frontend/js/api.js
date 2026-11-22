// Shared helpers loaded on every page.
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  save(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  isLoggedIn() { return !!this.getToken(); },
  requireLogin() {
    if (this.isLoggedIn()) return true;
    sessionStorage.setItem('next', location.pathname.split('/').pop() + location.search);
    location.href = 'login.html';
    return false;
  },
  afterLogin() {
    const n = sessionStorage.getItem('next'); sessionStorage.removeItem('next');
    location.href = n || 'products.html';
  },
  logout() { Auth.clear(); location.href = 'login.html'; },
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.getToken()) headers.Authorization = 'Bearer ' + Auth.getToken();
  let res;
  try { res = await fetch(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('Cannot reach the server. Is the backend running?'); }
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (res.status === 401 && Auth.isLoggedIn()) { Auth.clear(); location.href = 'login.html'; }
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  kids.forEach((k) => e.append(k));
  return e;
}
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY }).format(n);
const dateStr = (d) => new Date(d).toLocaleString();
function showMsg(box, text, type = 'error') { box.textContent = text; box.className = 'msg ' + type; }
function clearMsg(box) { box.textContent = ''; box.className = 'msg'; }
function emptyBox(text, linkHref, linkText) {
  const d = el('div', { className: 'empty', textContent: text + ' ' });
  if (linkHref) d.append(el('a', { href: linkHref, textContent: linkText }));
  return d;
}

// ---------- Cart (kept in the browser; prices are re-checked by the server at checkout) ----------
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } },
  save(c) { localStorage.setItem('cart', JSON.stringify(c)); updateCartBadge(); },
  add(p, qty = 1) {
    const c = this.get(); const max = Math.min(p.stock, 20);
    const i = c.find((x) => x.id === p._id);
    if (i) i.quantity = Math.min(i.quantity + qty, max);
    else c.push({ id: p._id, name: p.name, price: p.price, image: p.image, category: p.category, stock: p.stock, quantity: Math.min(qty, max) });
    this.save(c);
  },
  setQty(id, q) { const c = this.get(); const i = c.find((x) => x.id === id); if (i) { i.quantity = q; this.save(c); } },
  remove(id) { this.save(this.get().filter((x) => x.id !== id)); },
  clear() { this.save([]); },
  count() { return this.get().reduce((s, x) => s + x.quantity, 0); },
};

// Refresh cart with the newest prices/stock from the database; drop deleted or sold-out items.
async function syncCart() {
  const cart = Cart.get();
  if (!cart.length) return [];
  const { products } = await api('/products?limit=50&ids=' + cart.map((c) => c.id).join(','));
  const byId = new Map(products.map((p) => [p._id, p]));
  const fresh = [];
  cart.forEach((c) => {
    const p = byId.get(c.id);
    if (!p || p.stock < 1) return;
    fresh.push({ id: p._id, name: p.name, price: p.price, image: p.image, category: p.category, stock: p.stock, quantity: Math.max(1, Math.min(c.quantity, p.stock, 20)) });
  });
  Cart.save(fresh);
  return fresh;
}

// ---------- Product card ----------
const ICONS = { Electronics: '🎧', Fashion: '👕', Home: '🏠', Books: '📚', Beauty: '💄' };
function imgBox(p) {
  const box = el('div', { className: 'imgbox' });
  const icon = ICONS[p.category] || '🛍️';
  if (p.image) {
    const img = el('img', { src: p.image, alt: p.name, loading: 'lazy' });
    img.onerror = () => { box.textContent = icon; };
    box.append(img);
  } else box.textContent = icon;
  return box;
}
function productCard(p) {
  const btn = el('button', { textContent: p.stock > 0 ? 'Add to cart' : 'Out of stock', disabled: p.stock < 1 });
  btn.onclick = () => { Cart.add(p, 1); btn.textContent = 'Added ✓'; setTimeout(() => (btn.textContent = 'Add to cart'), 1200); };
  return el('div', { className: 'product' }, imgBox(p),
    el('div', { className: 'body' },
      el('span', { className: 'cat', textContent: p.category }),
      el('a', { className: 'name', href: 'product.html?id=' + p._id, textContent: p.name }),
      el('span', { className: 'price', textContent: money(p.price) }),
      btn));
}

// ---------- Navigation ----------
function updateCartBadge() { const b = $('cartCount'); if (b) b.textContent = Cart.count(); }
function renderNav() {
  const nav = $('nav'); if (!nav) return;
  const user = Auth.getUser();
  const here = location.pathname.split('/').pop() || 'index.html';
  nav.innerHTML = '';
  const brand = el('a', { className: 'brand', href: 'index.html' });
  const [w1, ...w2] = SITE_NAME.split(' ');
  brand.append(w1 + ' ', el('span', { textContent: w2.join(' ') }));
  nav.append(brand);
  const links = [['index.html', 'Home'], ['products.html', 'Shop'], ['cart.html', 'Cart'], ['contact.html', 'Contact']];
  if (user) links.push(['orders.html', 'My Orders']);
  if (user && user.role === 'admin') links.push(['admin.html', 'Admin']);
  if (!user) links.push(['login.html', 'Login'], ['register.html', 'Register']);
  links.forEach(([href, label]) => {
    const a = el('a', { href, className: href === here ? 'active' : '' }, label);
    if (href === 'cart.html') a.append(' (', el('span', { id: 'cartCount', textContent: Cart.count() }), ')');
    nav.append(a);
  });
  if (user) {
    const b = el('button', { className: 'secondary small', textContent: 'Logout (' + user.name.split(' ')[0] + ')' });
    b.onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} Auth.logout(); };
    nav.append(b);
  }
}
renderNav();
