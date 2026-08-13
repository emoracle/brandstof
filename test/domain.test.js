const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_SETTINGS, calculate, sanitizeSettings } = require("../lib/domain");

function assertApproximately(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `expected ${actual} to be approximately ${expected}`);
}

test("default settings describe the documented starting values", () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    pricePerKwh: 0.44,
    pricePerLiter: 2.2,
    chargingFee: 0,
    kwhPer100Km: 15.5,
    litersPer100Km: 4.7,
    distanceKm: 75,
    batteryCapacityKwh: 17
  });
});

test("a trip within battery range is fully electric", () => {
  const metrics = calculate({
    pricePerKwh: 0.4,
    pricePerLiter: 2,
    chargingFee: 1,
    kwhPer100Km: 20,
    litersPer100Km: 5,
    distanceKm: 50,
    batteryCapacityKwh: 12
  });

  assert.equal(metrics.kmPerKwh, 5);
  assert.equal(metrics.maxBatteryDistanceKm, 60);
  assert.equal(metrics.electricDistanceKm, 50);
  assert.equal(metrics.fuelDistanceKm, 0);
  assert.equal(metrics.electricityUsedKwh, 10);
  assertApproximately(metrics.electricityCostPerKm, 0.08);
  assertApproximately(metrics.fuelCostPerKm, 0.1);
  assert.equal(metrics.electricityCost, 5);
  assert.equal(metrics.fuelCost, 0);
  assert.equal(metrics.totalCost, 5);
});

test("a trip beyond battery range uses fuel for the remainder", () => {
  const metrics = calculate({
    pricePerKwh: 0.4,
    pricePerLiter: 2,
    chargingFee: 1,
    kwhPer100Km: 20,
    litersPer100Km: 5,
    distanceKm: 100,
    batteryCapacityKwh: 12
  });

  assert.equal(metrics.electricDistanceKm, 60);
  assert.equal(metrics.fuelDistanceKm, 40);
  assert.equal(metrics.electricityUsedKwh, 12);
  assert.equal(metrics.fuelUsedLiters, 2);
  assertApproximately(metrics.electricityCost, 5.8);
  assert.equal(metrics.fuelCost, 4);
  assertApproximately(metrics.totalCost, 9.8);
});

test("charging fee is not applied without electric distance", () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    chargingFee: 3.5,
    distanceKm: 100,
    batteryCapacityKwh: 0
  };

  const metrics = calculate(settings);

  assert.equal(metrics.electricDistanceKm, 0);
  assert.equal(metrics.electricityCost, 0);
  assert.ok(metrics.fuelCost > 0);
  assert.equal(metrics.totalCost, metrics.fuelCost);
});

test("zero consumption values avoid division by zero", () => {
  const metrics = calculate({
    ...DEFAULT_SETTINGS,
    kwhPer100Km: 0,
    litersPer100Km: 0
  });

  assert.equal(metrics.kmPerKwh, 0);
  assert.equal(metrics.kmPerLiter, 0);
  assert.equal(metrics.maxBatteryDistanceKm, 0);
  assert.equal(metrics.electricityUsedKwh, 0);
  assert.equal(metrics.fuelUsedLiters, 0);
  assert.equal(metrics.totalCost, 0);
});

test("sanitization converts numeric strings and fills missing values", () => {
  const settings = sanitizeSettings({
    pricePerLiter: "2.1234",
    distanceKm: "125.5"
  });

  assert.equal(settings.pricePerLiter, 2.1234);
  assert.equal(settings.distanceKm, 125.5);
  assert.equal(settings.pricePerKwh, DEFAULT_SETTINGS.pricePerKwh);
  assert.equal(settings.batteryCapacityKwh, DEFAULT_SETTINGS.batteryCapacityKwh);
});

test("sanitization clamps negatives and replaces invalid numbers", () => {
  const settings = sanitizeSettings({
    pricePerKwh: -1,
    chargingFee: -10,
    litersPer100Km: "geen getal",
    distanceKm: Infinity
  });

  assert.equal(settings.pricePerKwh, 0);
  assert.equal(settings.chargingFee, 0);
  assert.equal(settings.litersPer100Km, DEFAULT_SETTINGS.litersPer100Km);
  assert.equal(settings.distanceKm, DEFAULT_SETTINGS.distanceKm);
});
