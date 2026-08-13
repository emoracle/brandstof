const fields = [
  {
    key: "pricePerKwh",
    label: "Prijs per kWh",
    hint: "Standaard 0,44 euro per kWh.",
    step: "0.01",
    min: "0",
    unit: "euro"
  },
  {
    key: "pricePerLiter",
    label: "Prijs per liter",
    hint: "Ondersteunt tot vier cijfers achter de komma.",
    step: "0.0001",
    min: "0",
    unit: "euro"
  },
  {
    key: "kwhPer100Km",
    label: "Verbruik kWh per 100 km",
    hint: "Elektrisch verbruik van de auto.",
    step: "0.1",
    min: "0",
    unit: "kWh"
  },
  {
    key: "chargingFee",
    label: "Instaptarief laden",
    hint: "Wordt alleen meegenomen als er elektrisch gereden wordt.",
    step: "0.01",
    min: "0",
    unit: "euro"
  },
  {
    key: "litersPer100Km",
    label: "Verbruik liter per 100 km",
    hint: "Brandstofverbruik wanneer de accu niet meer dekt.",
    step: "0.1",
    min: "0",
    unit: "liter"
  },
  {
    key: "distanceKm",
    label: "Afstand",
    hint: "Afstand waarover direct gerekend wordt.",
    step: "0.1",
    min: "0",
    unit: "km"
  },
  {
    key: "batteryCapacityKwh",
    label: "Accucapaciteit",
    hint: "Totale beschikbare accucapaciteit.",
    step: "0.1",
    min: "0",
    unit: "kWh"
  }
];

const state = {
  settings: {},
  hasUnsavedChanges: false
};

const fieldGrid = document.querySelector("#field-grid");
const fieldTemplate = document.querySelector("#field-template");
const summaryCards = document.querySelector("#summary-cards");
const breakdownList = document.querySelector("#breakdown-list");
const saveState = document.querySelector("#save-state");
const summaryDistance = document.querySelector("#summary-distance");
const costPerKm = document.querySelector("#cost-per-km");

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function renderFields() {
  fieldGrid.innerHTML = "";

  for (const field of fields) {
    const fragment = fieldTemplate.content.cloneNode(true);
    const label = fragment.querySelector(".field-label");
    const hint = fragment.querySelector(".field-hint");
    const input = fragment.querySelector(".field-input");
    const unit = fragment.querySelector(".field-unit");

    label.textContent = field.label;
    hint.textContent = field.hint;
    unit.textContent = field.unit;
    input.type = "number";
    input.name = field.key;
    input.step = field.step;
    input.min = field.min;
    input.value = state.settings[field.key] ?? "";

    input.addEventListener("input", () => {
      state.settings[field.key] = Number(input.value);
      state.hasUnsavedChanges = true;
      renderSaveState();
      refresh();
    });

    fieldGrid.appendChild(fragment);

    if (field.key === "batteryCapacityKwh") {
      const action = document.createElement("div");
      const saveButton = document.createElement("button");
      const restoreButton = document.createElement("button");
      action.className = "field-action";
      saveButton.type = "button";
      saveButton.className = "save-button";
      saveButton.textContent = "Opslaan";
      saveButton.addEventListener("click", saveSettings);
      restoreButton.type = "button";
      restoreButton.className = "restore-button";
      restoreButton.textContent = "Terug";
      restoreButton.addEventListener("click", restoreSettings);
      action.append(saveButton, restoreButton);
      fieldGrid.appendChild(action);
    }
  }
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

function renderSummary(metrics) {
  summaryDistance.innerHTML = `Berekening voor <strong class="summary-highlight">${formatNumber(state.settings.distanceKm, 1)} km</strong> met totale kosten van <strong class="summary-highlight">${formatCurrency(metrics.totalCost)}</strong>. De waarden worden direct herberekend bij elke wijziging.`;
  costPerKm.innerHTML = `De kosten voor 1 km elektrisch zijn <strong>${formatCurrency(metrics.electricityCostPerKm)}</strong> en op benzine <strong>${formatCurrency(metrics.fuelCostPerKm)}</strong>.`;

  const cards = [
    ["Kosten elektra", formatCurrency(metrics.electricityCost)],
    ["Kosten benzine", formatCurrency(metrics.fuelCost)],
    ["Totale ritkosten", formatCurrency(metrics.totalCost)],
    ["Max. accubereik", `${formatNumber(metrics.maxBatteryDistanceKm, 1)} km`],
    ["Km per liter", metrics.kmPerLiter > 0 ? `${formatNumber(metrics.kmPerLiter, 2)} km/l` : "n.v.t."],
    ["Km per kWh", metrics.kmPerKwh > 0 ? `${formatNumber(metrics.kmPerKwh, 2)} km/kWh` : "n.v.t."]
  ];

  summaryCards.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <span class="metric-label">${label}</span>
          <strong class="metric-value">${value}</strong>
        </article>
      `
    )
    .join("");
}

function renderBreakdown(metrics) {
  const electricityChargeFee = metrics.electricDistanceKm > 0 ? state.settings.chargingFee : 0;
  const items = [
    {
      title: "Elektrische afstand",
      value: `${formatNumber(metrics.electricDistanceKm, 2)} km`,
      note: `Van de totale rit van ${formatNumber(state.settings.distanceKm, 2)} km wordt eerst ${formatNumber(metrics.electricDistanceKm, 2)} km door de accu afgedekt.`
    },
    {
      title: "Elektriciteitsverbruik",
      value: `${formatNumber(metrics.electricityUsedKwh, 2)} kWh`,
      note: `${formatNumber(metrics.electricDistanceKm, 2)} km × ${formatNumber(state.settings.kwhPer100Km, 2)} kWh / 100 km = ${formatNumber(metrics.electricityUsedKwh, 2)} kWh.`
    },
    {
      title: "Elektriciteitskosten",
      value: formatCurrency(metrics.electricityCost),
      note: `${formatNumber(metrics.electricityUsedKwh, 2)} kWh × ${formatCurrency(state.settings.pricePerKwh)} + instaptarief ${formatCurrency(electricityChargeFee)} = ${formatCurrency(metrics.electricityCost)}.`,
      dividerAfter: true
    },
    {
      title: "Benzineafstand",
      value: `${formatNumber(metrics.fuelDistanceKm, 2)} km`,
      note: `Resterende afstand na accubereik: ${formatNumber(state.settings.distanceKm, 2)} - ${formatNumber(metrics.electricDistanceKm, 2)} = ${formatNumber(metrics.fuelDistanceKm, 2)} km.`
    },
    {
      title: "Brandstofverbruik",
      value: `${formatNumber(metrics.fuelUsedLiters, 2)} liter`,
      note: `${formatNumber(metrics.fuelDistanceKm, 2)} km × ${formatNumber(state.settings.litersPer100Km, 2)} liter / 100 km = ${formatNumber(metrics.fuelUsedLiters, 2)} liter.`
    },
    {
      title: "Brandstofkosten",
      value: formatCurrency(metrics.fuelCost),
      note: `${formatNumber(metrics.fuelUsedLiters, 2)} liter × ${formatCurrency(state.settings.pricePerLiter)} = ${formatCurrency(metrics.fuelCost)}.`,
      dividerAfter: true
    },
    {
      title: "Kostenopbouw",
      value: formatCurrency(metrics.totalCost),
      note: `${formatCurrency(metrics.electricityCost)} elektra + ${formatCurrency(metrics.fuelCost)} benzine = ${formatCurrency(metrics.totalCost)} totaal.`
    }
  ];

  breakdownList.innerHTML = items
    .map(
      (item) => `
        <article class="breakdown-item${item.dividerAfter ? " breakdown-item-divider" : ""}">
          <div class="breakdown-header">
            <span class="breakdown-title">${item.title}</span>
            <span class="breakdown-value">${item.value}</span>
          </div>
          <p class="breakdown-note">${item.note}</p>
        </article>
      `
    )
    .join("");
}

function refresh() {
  const metrics = calculate(state.settings);
  renderSummary(metrics);
  renderBreakdown(metrics);
}

function renderSaveState() {
  if (state.hasUnsavedChanges) {
    saveState.textContent = "Niet-opgeslagen wijzigingen. Herladen toont de laatst opgeslagen waarden.";
    saveState.classList.remove("is-saved");
    return;
  }

  saveState.textContent = "Opgeslagen instellingen geladen. Wijzigingen worden pas bewaard na klikken op Opslaan.";
  saveState.classList.add("is-saved");
}

async function loadSettings() {
  const response = await fetch("/api/settings");
  if (!response.ok) {
    throw new Error("Instellingen konden niet worden geladen.");
  }

  const data = await response.json();
  state.settings = data.settings;
  state.hasUnsavedChanges = false;
  renderFields();
  refresh();
  renderSaveState();
}

async function restoreSettings() {
  try {
    await loadSettings();
    saveState.textContent = "Niet-opgeslagen wijzigingen zijn teruggedraaid.";
    saveState.classList.add("is-saved");
  } catch (error) {
    saveState.textContent = "Terughalen van opgeslagen instellingen is mislukt.";
    saveState.classList.remove("is-saved");
  }
}

async function saveSettings() {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.settings)
  });

  const data = await response.json();
  state.settings = data.settings;
  state.hasUnsavedChanges = false;
  refresh();
  renderFields();
  saveState.textContent = "Instellingen opgeslagen in data/settings.json.";
  saveState.classList.add("is-saved");
}

loadSettings().catch(() => {
  saveState.textContent = "Laden van instellingen is mislukt.";
});
