export type DeductionStatus =
  | "NEW"
  | "EVIDENCE_MISSING"
  | "READY_TO_DISPUTE"
  | "SUBMITTED"
  | "WON"
  | "LOST"
  | "EXPIRING_SOON";

export type FaultParty =
  | "RETAILER"
  | "THREE_PL"
  | "CARRIER"
  | "BRAND"
  | "UNKNOWN";

export type Retailer = {
  id: string;
  name: string;
  code: string;
  disputeWindowDays: number;
  color: string;
};

export type Deduction = {
  id: string;
  retailerId: string;
  externalId: string;
  amount: number;
  reasonCode: string;
  reasonDescription: string;
  status: DeductionStatus;
  faultParty: FaultParty;
  evidenceScore: number;
  deadlineDate: string;
  invoiceNumber: string;
  poNumber: string;
};

export type Shipment = {
  id: string;
  deductionId: string;
  proNumber: string;
  bolNumber: string;
  carrierName: string;
  thirdPartyLogistics: string;
  podUrl: string | null;
  podSigned: boolean;
  deliveryDate: string | null;
  appointmentTime: string | null;
};
