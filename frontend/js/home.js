(async () => {
  const grid = $('grid');
  try {
    const { products } = await api('/products?limit=8');
    grid.innerHTML = '';
    if (!products.length) return grid.append(emptyBox('No products yet.'));
    products.forEach((p) => grid.append(productCard(p)));
  } catch (e) { grid.textContent = e.message; }
})();
