export const CURRENCIES = [
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', min: 10000, max: 10000000 },
  { code: 'USD', name: 'US Dollar', symbol: '$', min: 10, max: 50000 },
  { code: 'EUR', name: 'Euro', symbol: '€', min: 10, max: 50000 },
  { code: 'GBP', name: 'British Pound', symbol: '£', min: 10, max: 40000 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', min: 1000, max: 7500000 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', min: 15, max: 75000 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', min: 15, max: 70000 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', min: 350, max: 2000000 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', min: 250000, max: 1500000000 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', min: 150000, max: 750000000 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', min: 50, max: 250000 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', min: 500, max: 3000000 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', min: 15, max: 70000 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', min: 15000, max: 70000000 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', min: 75, max: 400000 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', min: 850, max: 4500000 },
];

export const getCurrencyLimits = (code: string) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return { min: currency?.min || 10, max: currency?.max || 100000000 };
};

export const getCurrencySymbol = (code: string) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '$';
};