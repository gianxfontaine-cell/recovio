import { determineFault, FaultInput } from "./rules-engine";
import { DeductionStatus, FaultParty } from "./types";

export interface EvaluationInput extends FaultInput {
  hasInvoice: boolean;
  hasShipment: boolean;
}

export interface EvaluationResult {
  evidenceScore: number;
  faultParty: FaultParty;
  status: DeductionStatus;
  reasons: string[];
}

const POD_CRITICAL_REASONS = ["SHORTAGE", "DAMAGE", "OTIF_LATE"];

export function evaluateDeduction(input: EvaluationInput): EvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.hasInvoice) {
    score += 20;
    reasons.push("Matched to NetSuite invoice");
  } else {
    reasons.push("No matching invoice");
  }

  if (input.hasShipment) {
    score += 15;
    reasons.push("Matched to 3PL shipment");
  } else {
    reasons.push("No matching shipment");
  }

  if (input.podSigned) {
    score += 30;
    reasons.push("Signed POD on file");
  } else {
    reasons.push("POD missing");
  }

  if (
    input.carrierArrivalTime &&
    input.appointmentTime &&
    input.carrierArrivalTime <= input.appointmentTime
  ) {
    score += 15;
    reasons.push("Carrier arrived within appointment window");
  }

  const fault = determineFault(input);

  const podCritical = POD_CRITICAL_REASONS.includes(input.reasonCode);

  let status: DeductionStatus;
  if (podCritical && !input.podSigned) {
    status = "EVIDENCE_MISSING";
  } else if (fault.party === "RETAILER") {
    status = score >= 50 ? "READY_TO_DISPUTE" : "NEW";
  } else if (fault.party === "BRAND") {
    status = "LOST";
  } else {
    status = "NEW";
  }

  return {
    evidenceScore: Math.min(100, score),
    faultParty: fault.party,
    status,
    reasons
  };
}
