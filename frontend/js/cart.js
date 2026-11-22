const box = $('box'), msg = $('msg');

async function render() {
  let items;
  try { items = await syncCart(); } catch (e) { items = Cart.get(); showMsg(msg, 'Could not refresh prices: ' + e.message); }
  box.innerHTML = '';
  if (!items.length) return box.append(emptyBox('Your cart is empty.', 'products.html', 'Start shopping'));
  items.forEach((i) => {
    const qty = el('input', { type: 'number', min: 1, max: Math.min(i.stock, 20), value: i.quantity });
    qty.onchange = () => { Cart.setQty(i.id, Math.max(1, Math.min(parseInt(qty.value) || 1, i.stock, 20))); render(); };
    const rm = el('button', { className: 'danger small', textContent: 'Remove' });
    rm.onclick = () => { Cart.remove(i.id); render(); };
    box.append(el('div', { className: 'row' },
      el('div', { className: 'info' }, el('a', { href: 'product.html?id=' + i.id, textContent: i.name }), el('small', { textContent: money(i.price) + ' each' })),
      el('div', { className: 'actions' }, qty, el('strong', { textContent: money(i.price * i.quantity) }), rm)));
  });
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  box.append(el('div', { className: 'total' }, el('span', { textContent: 'Total' }), el('span', { textContent: money(total) })));
  const clear = el('button', { className: 'secondary', textContent: 'Clear cart' });
  clear.onclick = () => { Cart.clear(); render(); };
  box.append(el('div', { className: 'toolbar', style: 'margin-top:16px' }, el('a', { className: 'btn', href: 'checkout.html', textContent: 'Proceed to checkout' }), clear));
}
render();
