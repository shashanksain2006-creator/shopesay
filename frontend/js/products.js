let page = 1, pages = 1;
const grid = $('grid'), msg = $('msg');

async function loadCategories() {
  try {
    const { categories } = await api('/products/categories');
    categories.forEach((c) => $('category').append(el('option', { value: c, textContent: c })));
  } catch { /* filter just stays "All" */ }
}

async function load() {
  clearMsg(msg); grid.innerHTML = ''; grid.append(el('div', { className: 'loading', textContent: 'Loading...' }));
  const params = new URLSearchParams({ page, limit: 12 });
  if ($('q').value.trim()) params.set('q', $('q').value.trim());
  if ($('category').value) params.set('category', $('category').value);
  try {
    const data = await api('/products?' + params);
    pages = data.pages; grid.innerHTML = '';
    if (!data.products.length) grid.append(emptyBox('No products found.'));
    data.products.forEach((p) => grid.append(productCard(p)));
    $('pageInfo').textContent = 'Page ' + data.page + ' of ' + pages;
    $('prev').disabled = page <= 1; $('next').disabled = page >= pages;
  } catch (e) { grid.innerHTML = ''; showMsg(msg, e.message); }
}

$('filters').addEventListener('submit', (e) => { e.preventDefault(); page = 1; load(); });
$('category').addEventListener('change', () => { page = 1; load(); });
$('prev').onclick = () => { if (page > 1) { page--; load(); scrollTo(0, 0); } };
$('next').onclick = () => { if (page < pages) { page++; load(); scrollTo(0, 0); } };
loadCategories(); load();
