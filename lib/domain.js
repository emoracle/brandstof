const DEFAULT_SETTINGS = Object.freeze({
  pricePerKwh: 0.44,
  pricePerLiter: 2.2,
  chargingFee: 0,
  kwhPer100Km: 15.5,
  litersPer100Km: 4.7,
  distanceKm: 75,
  batteryCapacityKwh: 17
});

function sanitizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeSettings(input = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...input };

  return {
    pricePerKwh: Math.max(0, sanitizeNumber(merged.pricePerKwh, DEFAULT_SETTINGS.pricePerKwh)),
    pricePerLiter: Math.max(0, sanitizeNumber(merged.pricePerLiter, DEFAULT_SETTINGS.pricePerLiter)),
    chargingFee: Math.max(0, sanitizeNumber(merged.chargingFee, DEFAULT_SETTINGS.chargingFee)),
    kwhPer100Km: Math.max(0, sanitizeNumber(merged.kwhPer100Km, DEFAULT_SETTINGS.kwhPer100Km)),
    litersPer100Km: Math.max(0, sanitizeNumber(merged.litersPer100Km, DEFAULT_SETTINGS.litersPer100Km)),
    distanceKm: Math.max(0, sanitizeNumber(merged.distanceKm, DEFAULT_SETTINGS.distanceKm)),
    batteryCapacityKwh: Math.max(0, sanitizeNumber(merged.batteryCapacityKwh, DEFAULT_SETTINGS.batteryCapacityKwh))
  };
}

function calculate(settings) {
  const kmPerLiter = settings.litersPer100Km > 0 ? 100 / settings.litersPer100Km : 0;
  const kmPerKwh = settings.kwhPer100Km > 0 ? 100 / settings.kwhPer100Km : 0;
  const maxBatteryDistanceKm = settings.batteryCapacityKwh * kmPerKwh;
  const electricDistanceKm = Math.min(settings.distanceKm, maxBatteryDistanceKm);
  const fuelDistanceKm = Math.max(settings.distanceKm - electricDistanceKm, 0);
  const electricityUsedKwh = electricDistanceKm * (settings.kwhPer100Km / 100);
  const fuelUsedLiters = fuelDistanceKm * (settings.litersPer100Km / 100);
  const electricityCostPerKm = (settings.kwhPer100Km / 100) * settings.pricePerKwh;
  const fuelCostPerKm = (settings.litersPer100Km / 100) * settings.pricePerLiter;
  const electricityCost =
    electricityUsedKwh * settings.pricePerKwh + (electricDistanceKm > 0 ? settings.chargingFee : 0);
  const fuelCost = fuelUsedLiters * settings.pricePerLiter;
  const totalCost = electricityCost + fuelCost;

  return {
    kmPerLiter,
    kmPerKwh,
    maxBatteryDistanceKm,
    electricDistanceKm,
    fuelDistanceKm,
    electricityUsedKwh,
    fuelUsedLiters,
    electricityCostPerKm,
    fuelCostPerKm,
    electricityCost,
    fuelCost,
    totalCost
  };
}

module.exports = {
  DEFAULT_SETTINGS,
  calculate,
  sanitizeSettings
};
