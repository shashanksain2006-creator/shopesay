(async () => {
  const box = $('box'), msg = $('msg');
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { box.innerHTML = ''; return box.append(emptyBox('Product not found.', 'products.html', 'Back to shop')); }
  try {
    const { product: p } = await api('/products/' + encodeURIComponent(id));
    document.title = p.name + ' | Shop Easy';
    const qty = el('input', { type: 'number', min: 1, max: Math.min(p.stock, 20), value: 1 });
    qty.style.width = '90px';
    const add = el('button', { textContent: 'Add to cart', disabled: p.stock < 1 });
    add.onclick = () => {
      const n = Math.max(1, Math.min(parseInt(qty.value) || 1, p.stock, 20));
      Cart.add(p, n); showMsg(msg, n + ' item(s) added to your cart.', 'success');
    };
    box.innerHTML = '';
    box.append(el('div', { className: 'detail' }, imgBox(p),
      el('div', {},
        el('span', { className: 'cat', textContent: p.category }),
        el('h1', { textContent: p.name }),
        el('p', { className: 'price', textContent: money(p.price) }),
        el('p', { className: p.stock > 0 ? 'stock-ok' : 'stock-no', textContent: p.stock > 0 ? 'In stock (' + p.stock + ' available)' : 'Out of stock' }),
        el('p', { textContent: p.description || '' }),
        p.stock > 0 ? el('div', { className: 'toolbar' }, qty, add) : add,
        el('a', { href: 'cart.html', textContent: 'Go to cart →' }))));
  } catch (e) { box.innerHTML = ''; showMsg(msg, e.message); box.append(emptyBox('', 'products.html', 'Back to shop')); }
})();
