const DEFAULT_SETTINGS = Object.freeze({
  pricePerKwh: 0.44,
  pricePerLiter: 2.2,
  chargingFee: 0,
  chargingFeePercentage: 0,
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
  const chargingFee = Math.max(0, sanitizeNumber(merged.chargingFee, DEFAULT_SETTINGS.chargingFee));
  const chargingFeePercentage = Math.min(
    100,
    Math.max(0, sanitizeNumber(merged.chargingFeePercentage, DEFAULT_SETTINGS.chargingFeePercentage))
  );

  return {
    pricePerKwh: Math.max(0, sanitizeNumber(merged.pricePerKwh, DEFAULT_SETTINGS.pricePerKwh)),
    pricePerLiter: Math.max(0, sanitizeNumber(merged.pricePerLiter, DEFAULT_SETTINGS.pricePerLiter)),
    chargingFee,
    chargingFeePercentage: chargingFee > 0 ? 0 : chargingFeePercentage,
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
  const baseElectricityCost = electricityUsedKwh * settings.pricePerKwh;
  const chargingSurcharge =
    electricDistanceKm > 0
      ? settings.chargingFee > 0
        ? settings.chargingFee
        : baseElectricityCost * (settings.chargingFeePercentage / 100)
      : 0;
  const electricityCostPerKm =
    (settings.kwhPer100Km / 100) * settings.pricePerKwh * (1 + settings.chargingFeePercentage / 100);
  const fuelCostPerKm = (settings.litersPer100Km / 100) * settings.pricePerLiter;
  const electricityCost = baseElectricityCost + chargingSurcharge;
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
    baseElectricityCost,
    chargingSurcharge,
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
