export const validateCar = (carData) => {
  const errors = [];
  
  const required = ['title', 'brand', 'year', 'price', 'km', 'fuel', 'trans', 'owner'];
  for (const field of required) {
    if (!carData[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (carData.year) {
    const year = parseInt(carData.year);
    if (year < 1990 || year > 2025) {
      errors.push('Year must be between 1990 and 2025');
    }
  }

  if (carData.price) {
    const price = parseInt(carData.price);
    if (price <= 0) {
      errors.push('Price must be greater than 0');
    }
  }

  if (carData.km) {
    const km = parseInt(carData.km);
    if (km < 0) {
      errors.push('KM must be greater than or equal to 0');
    }
  }

  return errors;
};

export const validateLogin = (data) => {
  const errors = [];
  if (!data.username) errors.push('Username is required');
  if (!data.password) errors.push('Password is required');
  return errors;
};