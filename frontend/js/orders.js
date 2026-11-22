(async () => {
  if (!Auth.requireLogin()) return;
  const list = $('list'), msg = $('msg');
  if (new URLSearchParams(location.search).get('placed')) showMsg(msg, 'Thank you! Your order has been placed.', 'success');

  async function load() {
    try {
      const [{ orders }, { stats }] = await Promise.all([api('/orders/mine'), api('/dashboard/stats')]);
      const st = $('stats'); st.innerHTML = '';
      if (stats.spent !== undefined) [['Orders', stats.orders], ['Total spent', money(stats.spent || 0)]].forEach(([l, v]) => st.append(el('div', { className: 'stat' }, el('b', { textContent: v }), el('span', { textContent: l }))));
      list.innerHTML = '';
      if (!orders.length) return list.append(emptyBox('You have no orders yet.', 'products.html', 'Start shopping'));
      orders.forEach((o) => {
        const card = el('div', { className: 'card' },
          el('div', { className: 'row' }, el('div', { className: 'info' }, el('strong', { textContent: 'Order #' + o._id.slice(-6).toUpperCase() }), el('small', { textContent: dateStr(o.createdAt) })), el('span', { className: 'badge ' + o.status, textContent: o.status })));
        o.items.forEach((i) => card.append(el('div', { className: 'row' }, el('span', { textContent: i.name + ' × ' + i.quantity }), el('span', { textContent: money(i.price * i.quantity) }))));
        card.append(el('small', { textContent: 'Deliver to: ' + o.shipping.fullName + ', ' + o.shipping.address + ', ' + o.shipping.city + ' ' + o.shipping.postalCode }));
        card.append(el('div', { className: 'total' }, el('span', { textContent: 'Total (Cash on Delivery)' }), el('span', { textContent: money(o.total) })));
        if (o.status === 'placed') {
          const c = el('button', { className: 'danger small', textContent: 'Cancel order' });
          c.onclick = async () => { if (!confirm('Cancel this order?')) return; try { await api('/orders/' + o._id + '/cancel', { method: 'PUT' }); load(); } catch (e) { showMsg(msg, e.message); } };
          card.append(el('div', { style: 'margin-top:10px' }, c));
        }
        list.append(card);
      });
    } catch (e) { list.innerHTML = ''; showMsg(msg, e.message); }
  }
  load();
})();
