(async () => {
  if (!Auth.requireLogin()) return;
  try { const { user } = await api('/auth/me'); Auth.save(Auth.getToken(), user); renderNav(); if (user.role !== 'admin') throw new Error('x'); }
  catch { document.querySelector('main').innerHTML = ''; return document.querySelector('main').append(emptyBox('Admins only.', 'index.html', 'Go home')); }

  // tabs
  document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
    ['products', 'orders', 'messages'].forEach((t) => ($('tab-' + t).style.display = t === b.dataset.tab ? '' : 'none'));
  }));

  async function loadStats() {
    try {
      const { stats: s } = await api('/dashboard/stats'); const box = $('stats'); box.innerHTML = '';
      [['Products', s.products], ['Orders', s.orders], ['New orders', s.newOrders], ['Revenue', money(s.revenue)], ['Users', s.users], ['Messages', s.messages]]
        .forEach(([l, v]) => box.append(el('div', { className: 'stat' }, el('b', { textContent: v }), el('span', { textContent: l }))));
    } catch { /* non-critical */ }
  }

  // ----- products -----
  const f = $('pform'), pmsg = $('pmsg'); let editingId = null;
  function resetForm() { f.reset(); editingId = null; $('formTitle').textContent = 'Add product'; $('pcancel').style.display = 'none'; }
  $('pcancel').onclick = resetForm;

  f.addEventListener('submit', async (e) => {
    e.preventDefault(); clearMsg(pmsg);
    const body = { name: $('pname').value.trim(), category: $('pcategory').value.trim() || 'General', price: $('pprice').value, stock: $('pstock').value, image: $('pimage').value.trim(), description: $('pdesc').value.trim() };
    if (body.name.length < 2) return showMsg(pmsg, 'Name is required');
    if (body.price === '' || Number(body.price) < 0) return showMsg(pmsg, 'Enter a valid price');
    if (body.stock === '' || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) return showMsg(pmsg, 'Stock must be a whole number');
    body.price = Number(body.price); body.stock = Number(body.stock);
    $('pbtn').disabled = true;
    try {
      await api(editingId ? '/products/' + editingId : '/products', { method: editingId ? 'PUT' : 'POST', body });
      showMsg(pmsg, editingId ? 'Product updated' : 'Product added', 'success'); resetForm(); loadProducts(); loadStats();
    } catch (err) { showMsg(pmsg, err.message); }
    $('pbtn').disabled = false;
  });

  async function loadProducts() {
    const box = $('plist');
    try {
      const { products } = await api('/products?limit=100'); box.innerHTML = '';
      if (!products.length) return box.append(emptyBox('No products yet. Add one above.'));
      products.forEach((p) => {
        const edit = el('button', { className: 'secondary small', textContent: 'Edit' });
        edit.onclick = () => {
          editingId = p._id; $('formTitle').textContent = 'Edit product';
          $('pname').value = p.name; $('pcategory').value = p.category; $('pprice').value = p.price; $('pstock').value = p.stock; $('pimage').value = p.image || ''; $('pdesc').value = p.description || '';
          $('pcancel').style.display = 'block'; scrollTo(0, 0);
        };
        const del = el('button', { className: 'danger small', textContent: 'Delete' });
        del.onclick = async () => { if (!confirm('Delete "' + p.name + '"?')) return; try { await api('/products/' + p._id, { method: 'DELETE' }); loadProducts(); loadStats(); } catch (e) { showMsg(pmsg, e.message); } };
        box.append(el('div', { className: 'row' },
          el('div', { className: 'info' }, el('strong', { textContent: p.name }), el('small', { textContent: p.category + ' · ' + money(p.price) + ' · stock ' + p.stock })),
          el('div', { className: 'actions' }, edit, del)));
      });
    } catch (e) { box.textContent = e.message; }
  }

  // ----- orders -----
  async function loadOrders() {
    const box = $('olist'), msg = $('msg');
    try {
      const { orders } = await api('/orders'); box.innerHTML = '';
      if (!orders.length) return box.append(emptyBox('No orders yet.'));
      orders.forEach((o) => {
        const sel = el('select');
        ['placed', 'shipped', 'delivered', 'cancelled'].forEach((s) => { const op = el('option', { value: s, textContent: s }); if (s === o.status) op.selected = true; sel.append(op); });
        sel.onchange = async () => { try { await api('/orders/' + o._id + '/status', { method: 'PUT', body: { status: sel.value } }); loadOrders(); loadProducts(); loadStats(); } catch (e) { showMsg(msg, e.message); loadOrders(); } };
        const who = o.user ? o.user.name + ' (' + o.user.email + ')' : 'Deleted user';
        box.append(el('div', { className: 'row' },
          el('div', { className: 'info' },
            el('strong', { textContent: '#' + o._id.slice(-6).toUpperCase() + ' · ' + money(o.total) }),
            el('small', { textContent: who + ' · ' + dateStr(o.createdAt) }),
            el('small', { textContent: o.items.map((i) => i.name + ' ×' + i.quantity).join(', ') }),
            el('small', { textContent: o.shipping.fullName + ', ' + o.shipping.phone + ', ' + o.shipping.address + ', ' + o.shipping.city + ' ' + o.shipping.postalCode })),
          el('div', { className: 'actions' }, sel)));
      });
    } catch (e) { box.textContent = e.message; }
  }

  // ----- messages -----
  async function loadMessages() {
    const box = $('mlist');
    try {
      const { messages } = await api('/contact'); box.innerHTML = '';
      if (!messages.length) return box.append(emptyBox('No messages yet.'));
      messages.forEach((m) => {
        const del = el('button', { className: 'danger small', textContent: 'Delete' });
        del.onclick = async () => { if (confirm('Delete this message?')) { await api('/contact/' + m._id, { method: 'DELETE' }); loadMessages(); loadStats(); } };
        box.append(el('div', { className: 'row' }, el('div', { className: 'info' }, el('strong', { textContent: m.name + ' <' + m.email + '>' }), el('small', { textContent: m.message }), el('small', { textContent: dateStr(m.createdAt) })), el('div', { className: 'actions' }, del)));
      });
    } catch (e) { box.textContent = e.message; }
  }

  loadStats(); loadProducts(); loadOrders(); loadMessages();
})();
