export function applyDiscount(amount, percent) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new TypeError('amount must be a finite number');
  if (!(percent >= 0 && percent <= 100)) throw new RangeError('percent must be between 0 and 100');
  return Math.round(amount * (100 - percent)) / 100;
}
