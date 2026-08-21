import { FaultParty } from "./types";

export interface FaultInput {
  reasonCode: string;
  carrierArrivalTime?: Date;
  appointmentTime?: Date;
  actualShipTime?: Date;
  requiredShipTime?: Date;
  podSigned?: boolean;
  podException?: boolean;
}

export interface FaultAssignment {
  party: FaultParty;
  reason: string;
  confidence: number;
}

export function determineFault(input: FaultInput): FaultAssignment {
  if (input.reasonCode === "OTIF_LATE") {
    if (
      input.carrierArrivalTime &&
      input.appointmentTime &&
      input.carrierArrivalTime <= input.appointmentTime &&
      input.actualShipTime &&
      input.requiredShipTime &&
      input.actualShipTime > input.requiredShipTime
    ) {
      return {
        party: "THREE_PL",
        reason: "MISSED_APPOINTMENT",
        confidence: 0.95
      };
    }
  }

  if (input.reasonCode === "DAMAGE" && input.podSigned && !input.podException) {
    return {
      party: "RETAILER",
      reason: "UNSUPPORTED_DAMAGE_CLAIM",
      confidence: 0.85
    };
  }

  return {
    party: "UNKNOWN",
    reason: "NEEDS_REVIEW",
    confidence: 0
  };
}
