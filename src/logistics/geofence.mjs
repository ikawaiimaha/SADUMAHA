export const TARGET_LATITUDE = 25.36143;
export const TARGET_LONGITUDE = 55.38702;
export const UNAUTHORIZED_LOCATION = 'Unauthorized Location. Asset receipt can only be recorded within 200 meters of the official Sharjah Art Museum facility.';
export function haversineMetres(a, b) {
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
const coordinates = p => p && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
export function checkArrivalLocation(policy, location, now = Date.now()) {
  if (!policy.required) return { allowed: true, reason: 'Location policy is not enabled for this local demonstration.' };
  if (!coordinates(policy) || policy.radiusMetres !== 200) return { allowed: false, reason: 'An approved loading-dock location has not been configured.' };
  if (!coordinates(location) || !Number.isFinite(location.accuracy) || location.accuracy < 0 || !Number.isFinite(location.timestamp)) return { allowed: false, reason: 'Check your location before recording arrival.' };
  if (now - location.timestamp > 60000 || location.timestamp > now + 5000) return { allowed: false, reason: 'Location expired. Check again at the loading dock.' };
  const distance = haversineMetres(policy, location);
  if (distance > policy.radiusMetres) return { allowed: false, reason: UNAUTHORIZED_LOCATION };
  // Require the full reported uncertainty circle to fit within the dock boundary.
  if (distance + location.accuracy > policy.radiusMetres) return { allowed: false, reason: 'Outside the 200 m boundary, or GPS accuracy is insufficient. Move closer and retry.' };
  return { allowed: true, reason: 'Location check passed. Confirm the crate and condition separately.' };
}
export function arrivalPolicy() {
  return { required: true, radiusMetres: 200, latitude: TARGET_LATITUDE, longitude: TARGET_LONGITUDE };
}
