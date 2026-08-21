import { Deduction, Retailer, Shipment } from "@recovio/core";

export const retailers: Retailer[] = [
  {
    id: "r1",
    name: "Walmart",
    code: "WMT",
    disputeWindowDays: 15,
    color: "#38bdf8"
  },
  {
    id: "r2",
    name: "Target",
    code: "TGT",
    disputeWindowDays: 21,
    color: "#f87171"
  },
  {
    id: "r3",
    name: "UNFI",
    code: "UNFI",
    disputeWindowDays: 30,
    color: "#4ade80"
  }
];

export const deductions: Deduction[] = [
  {
    id: "DED-001",
    retailerId: "r1",
    externalId: "CB-99210",
    amount: -4200,
    reasonCode: "OTIF_LATE",
    reasonDescription: "Late delivery / OTIF",
    status: "READY_TO_DISPUTE",
    faultParty: "CARRIER",
    evidenceScore: 92,
    deadlineDate: "2026-08-20",
    invoiceNumber: "INV-10042",
    poNumber: "PO-88392"
  },
  {
    id: "DED-002",
    retailerId: "r2",
    externalId: "DB-44102",
    amount: -1850,
    reasonCode: "SHORTAGE",
    reasonDescription: "Shortage claim",
    status: "EVIDENCE_MISSING",
    faultParty: "THREE_PL",
    evidenceScore: 20,
    deadlineDate: "2026-08-19",
    invoiceNumber: "INV-10038",
    poNumber: "PO-88371"
  },
  {
    id: "DED-003",
    retailerId: "r1",
    externalId: "CB-98874",
    amount: -8400,
    reasonCode: "DAMAGE",
    reasonDescription: "Freight damage",
    status: "WON",
    faultParty: "RETAILER",
    evidenceScore: 98,
    deadlineDate: "2026-08-10",
    invoiceNumber: "INV-10029",
    poNumber: "PO-88340"
  },
  {
    id: "DED-004",
    retailerId: "r3",
    externalId: "CR-88321",
    amount: -620,
    reasonCode: "PRICING",
    reasonDescription: "Price discrepancy",
    status: "SUBMITTED",
    faultParty: "RETAILER",
    evidenceScore: 85,
    deadlineDate: "2026-08-25",
    invoiceNumber: "INV-10045",
    poNumber: "PO-88401"
  },
  {
    id: "DED-005",
    retailerId: "r2",
    externalId: "DB-44288",
    amount: -3100,
    reasonCode: "LATE_ASN",
    reasonDescription: "Late ASN transmission",
    status: "READY_TO_DISPUTE",
    faultParty: "THREE_PL",
    evidenceScore: 88,
    deadlineDate: "2026-08-22",
    invoiceNumber: "INV-10041",
    poNumber: "PO-88388"
  },
  {
    id: "DED-006",
    retailerId: "r1",
    externalId: "CB-99301",
    amount: -950,
    reasonCode: "COMPLIANCE",
    reasonDescription: "Routing compliance",
    status: "LOST",
    faultParty: "BRAND",
    evidenceScore: 40,
    deadlineDate: "2026-08-12",
    invoiceNumber: "INV-10033",
    poNumber: "PO-88355"
  },
  {
    id: "DED-007",
    retailerId: "r1",
    externalId: "CB-99412",
    amount: -12500,
    reasonCode: "SHORTAGE",
    reasonDescription: "Shortage claim",
    status: "EXPIRING_SOON",
    faultParty: "UNKNOWN",
    evidenceScore: 45,
    deadlineDate: "2026-08-14",
    invoiceNumber: "INV-10048",
    poNumber: "PO-88410"
  },
  {
    id: "DED-008",
    retailerId: "r2",
    externalId: "DB-44355",
    amount: -2200,
    reasonCode: "PROMO_BILLBACK",
    reasonDescription: "Promotional allowance",
    status: "READY_TO_DISPUTE",
    faultParty: "RETAILER",
    evidenceScore: 90,
    deadlineDate: "2026-08-24",
    invoiceNumber: "INV-10044",
    poNumber: "PO-88399"
  }
];

export const shipments: Shipment[] = [
  {
    id: "SHP-001",
    deductionId: "DED-001",
    proNumber: "PRO-884721-XPO",
    bolNumber: "BOL-229104",
    carrierName: "XPO Logistics",
    thirdPartyLogistics: "ShipBob",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-07-28T14:30:00Z",
    appointmentTime: "2026-07-28T16:00:00Z"
  },
  {
    id: "SHP-002",
    deductionId: "DED-002",
    proNumber: "PRO-773822-EST",
    bolNumber: "BOL-229088",
    carrierName: "Estes Express",
    thirdPartyLogistics: "Hub Group",
    podUrl: null,
    podSigned: false,
    deliveryDate: "2026-07-30T10:15:00Z",
    appointmentTime: "2026-07-30T09:00:00Z"
  },
  {
    id: "SHP-003",
    deductionId: "DED-003",
    proNumber: "PRO-662911-SAIA",
    bolNumber: "BOL-229055",
    carrierName: "SAIA",
    thirdPartyLogistics: "ShipBob",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-07-25T13:45:00Z",
    appointmentTime: "2026-07-25T14:00:00Z"
  },
  {
    id: "SHP-004",
    deductionId: "DED-004",
    proNumber: "PRO-551822-ODFL",
    bolNumber: "BOL-229112",
    carrierName: "Old Dominion",
    thirdPartyLogistics: "Geodis",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-08-01T11:30:00Z",
    appointmentTime: "2026-08-01T12:00:00Z"
  },
  {
    id: "SHP-005",
    deductionId: "DED-005",
    proNumber: "PRO-440733-XPO",
    bolNumber: "BOL-229099",
    carrierName: "XPO Logistics",
    thirdPartyLogistics: "Hub Group",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-07-29T15:20:00Z",
    appointmentTime: "2026-07-29T14:00:00Z"
  },
  {
    id: "SHP-006",
    deductionId: "DED-006",
    proNumber: "PRO-339644-EST",
    bolNumber: "BOL-229077",
    carrierName: "Estes Express",
    thirdPartyLogistics: "ShipBob",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-07-27T09:00:00Z",
    appointmentTime: "2026-07-27T09:00:00Z"
  },
  {
    id: "SHP-007",
    deductionId: "DED-007",
    proNumber: "PRO-228555-SAIA",
    bolNumber: "BOL-229120",
    carrierName: "SAIA",
    thirdPartyLogistics: "Geodis",
    podUrl: null,
    podSigned: false,
    deliveryDate: null,
    appointmentTime: "2026-08-05T10:00:00Z"
  },
  {
    id: "SHP-008",
    deductionId: "DED-008",
    proNumber: "PRO-117466-ODFL",
    bolNumber: "BOL-229108",
    carrierName: "Old Dominion",
    thirdPartyLogistics: "ShipBob",
    podUrl: "/demo-assets/pod-sample.pdf",
    podSigned: true,
    deliveryDate: "2026-08-02T14:10:00Z",
    appointmentTime: "2026-08-02T15:00:00Z"
  }
];