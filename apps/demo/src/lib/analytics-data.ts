export const analyticsKpis = {
  recoveryRate: 0.78,
  mtdRecovered: 142500,
  avgCycleDays: 6.2,
  expiringSoon: 12500
};

export const faultBreakdown = [
  { name: "Retailer", value: 68000, color: "#38bdf8" },
  { name: "3PL", value: 45000, color: "#fbbf24" },
  { name: "Carrier", value: 22000, color: "#a78bfa" },
  { name: "Brand", value: 15000, color: "#64748b" }
];

export const weeklyRecovery = [
  { week: "W28", recovered: 28000, disputed: 35000 },
  { week: "W29", recovered: 42000, disputed: 48000 },
  { week: "W30", recovered: 38000, disputed: 44000 },
  { week: "W31", recovered: 34500, disputed: 41000 }
];

export const threePlScorecard = [
  {
    name: "ShipBob",
    shipments: 1240,
    faults: 23,
    faultPct: 1.9,
    avgPodDays: 0.8
  },
  {
    name: "Hub Group",
    shipments: 890,
    faults: 67,
    faultPct: 7.5,
    avgPodDays: 3.2
  },
  {
    name: "Geodis",
    shipments: 450,
    faults: 12,
    faultPct: 2.7,
    avgPodDays: 1.4
  }
];
