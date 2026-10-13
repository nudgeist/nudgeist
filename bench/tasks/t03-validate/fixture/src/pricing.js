export function applyDiscount(amount, percent) {
  return Math.round(amount * (100 - percent)) / 100;
}
