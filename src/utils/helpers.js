export const generateId = () => {
  return 'car-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
};

export const formatPrice = (price) => {
  if (price >= 10000000) return `₹ ${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹ ${(price / 100000).toFixed(2)} Lakh`;
  if (price >= 1000) return `₹ ${(price / 1000).toFixed(0)}K`;
  return `₹ ${price}`;
};

export const formatKm = (km) => {
  return km.toLocaleString('en-IN') + ' km';
};

export const getStats = (cars) => {
  const total = cars.length;
  const brands = [...new Set(cars.map(c => c.brand))];
  const avgPrice = total ? Math.round(cars.reduce((s, c) => s + c.price, 0) / total) : 0;
  const latest = total ? cars.sort((a, b) => b.createdAt - a.createdAt)[0] : null;
  return { total, brands: brands.length, avgPrice, latest };
};