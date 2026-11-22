(async () => {
  if (!Auth.requireLogin()) return;
  const box = $('box');
  let items;
  try { items = await syncCart(); } catch (e) { box.innerHTML = ''; return box.append(emptyBox(e.message)); }
  box.innerHTML = '';
  if (!items.length) return box.append(emptyBox('Your cart is empty.', 'products.html', 'Start shopping'));

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const summary = el('div', { className: 'card' }, el('h2', { textContent: 'Order summary' }));
  items.forEach((i) => summary.append(el('div', { className: 'row' }, el('span', { textContent: i.name + ' × ' + i.quantity }), el('strong', { textContent: money(i.price * i.quantity) }))));
  summary.append(el('div', { className: 'total' }, el('span', { textContent: 'Total' }), el('span', { textContent: money(total) })));
  summary.append(el('p', { className: 'empty', textContent: 'Payment: Cash on Delivery' }));

  const form = el('form', { className: 'card', noValidate: true });
  form.innerHTML = `<h2>Delivery details</h2>
    <label>Full name</label><input name="fullName" maxlength="80">
    <label>Phone</label><input name="phone" maxlength="15" inputmode="tel">
    <label>Address</label><textarea name="address" maxlength="200"></textarea>
    <div class="two"><div><label>City</label><input name="city" maxlength="60"></div><div><label>Postal code</label><input name="postalCode" maxlength="10"></div></div>
    <div class="msg" id="fmsg"></div><button type="submit">Place order</button>`;
  const field = (k) => form.querySelector('[name="' + k + '"]');
  field('fullName').value = Auth.getUser().name;
  const fmsg = form.querySelector('#fmsg'), btn = form.querySelector('button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); clearMsg(fmsg);
    const shipping = {};
    ['fullName', 'phone', 'address', 'city', 'postalCode'].forEach((k) => (shipping[k] = field(k).value.trim()));
    if (shipping.fullName.length < 2) return showMsg(fmsg, 'Enter your full name');
    if (!/^[0-9+\-\s]{7,15}$/.test(shipping.phone)) return showMsg(fmsg, 'Enter a valid phone number');
    if (shipping.address.length < 5) return showMsg(fmsg, 'Enter your address');
    if (shipping.city.length < 2) return showMsg(fmsg, 'Enter your city');
    if (shipping.postalCode.length < 3) return showMsg(fmsg, 'Enter a valid postal code');
    btn.disabled = true; btn.textContent = 'Placing order...';
    try {
      await api('/orders', { method: 'POST', body: { items: items.map((i) => ({ productId: i.id, quantity: i.quantity })), shipping } });
      Cart.clear(); location.href = 'orders.html?placed=1';
    } catch (err) { showMsg(fmsg, err.message); btn.disabled = false; btn.textContent = 'Place order'; }
  });
  box.append(summary, form);
})();
