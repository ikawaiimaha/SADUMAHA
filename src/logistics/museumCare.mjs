export function validateConservation(value) {
  if (!value || !Number.isFinite(value.max_lux) || value.max_lux < 0 || !Number.isFinite(value.target_temp_c) || value.target_temp_c < -50 || value.target_temp_c > 60 || !Number.isFinite(value.target_humidity_pct) || value.target_humidity_pct < 0 || value.target_humidity_pct > 100) throw new Error('Enter valid light, temperature and relative-humidity requirements.');
  return { max_lux: value.max_lux, target_temp_c: value.target_temp_c, target_humidity_pct: value.target_humidity_pct };
}
export function conservationWarnings(requirements, capability) {
  const r = validateConservation(requirements);
  if (!capability || !['lux', 'min_temp_c', 'max_temp_c', 'min_humidity_pct', 'max_humidity_pct'].every(k => Number.isFinite(capability[k])) || capability.min_temp_c > capability.max_temp_c || capability.min_humidity_pct > capability.max_humidity_pct) return ['Venue climate capability has not been verified.'];
  return [capability.lux > r.max_lux && 'Venue lighting exceeds the maximum lux.', (r.target_temp_c < capability.min_temp_c || r.target_temp_c > capability.max_temp_c) && 'Venue cannot meet the target temperature.', (r.target_humidity_pct < capability.min_humidity_pct || r.target_humidity_pct > capability.max_humidity_pct) && 'Venue cannot meet the target humidity.'].filter(Boolean);
}
export function normalizedPin(x, y) {
  if (![x,y].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) throw new Error('Pin coordinates must be between 0 and 100 percent.');
  return { x_pct: x, y_pct: y };
}
/** All amounts use integer minor currency units, never floating-point money. */
export function budgetGauge(ceiling, rows) {
  if (!Number.isSafeInteger(ceiling) || ceiling < 0) throw new Error('Verified budget ceiling is required.');
  const ids = new Set(); let allocated = 0, reserved = 0, spent = 0;
  for (const row of rows) {
    if (!row.id || ids.has(row.id)) throw new Error('Budget lines must be unique.'); ids.add(row.id);
    if (![row.amount, row.paid, row.released].every(n => Number.isSafeInteger(n) && n >= 0) || row.paid + row.released > row.amount) throw new Error('Invalid budget reconciliation.');
    const outstanding = row.amount - row.paid - row.released; spent += row.paid;
    if (['CONTRACT_EXECUTED','ON_SITE'].includes(row.status)) allocated += outstanding;
    else reserved += outstanding; // Withdrawal is not a cancellation of invoices or commitments.
  }
  const available = ceiling - allocated - reserved - spent;
  if (![allocated,reserved,spent,available].every(Number.isSafeInteger)) throw new Error('Budget exceeds supported precision.');
  return { ceiling, allocated, reserved, spent, available };
}
