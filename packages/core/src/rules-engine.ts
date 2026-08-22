import { FaultParty } from "./types";

export interface FaultInput {
  reasonCode: string;
  carrierArrivalTime?: Date;
  appointmentTime?: Date;
  actualShipTime?: Date;
  requiredShipTime?: Date;
  asnSentTime?: Date;
  asnDeadline?: Date;
  podSigned?: boolean;
  podException?: boolean;
}

export interface FaultAssignment {
  party: FaultParty;
  reason: string;
  confidence: number;
}

export function determineFault(input: FaultInput): FaultAssignment {
  const cleanPod = Boolean(input.podSigned) && !input.podException;

  if (input.reasonCode === "OTIF_LATE") {
    if (
      input.carrierArrivalTime &&
      input.appointmentTime &&
      input.actualShipTime &&
      input.requiredShipTime &&
      input.carrierArrivalTime <= input.appointmentTime &&
      input.actualShipTime > input.requiredShipTime
    ) {
      return { party: "THREE_PL", reason: "MISSED_APPOINTMENT", confidence: 0.95 };
    }

    if (
      input.carrierArrivalTime &&
      input.appointmentTime &&
      input.carrierArrivalTime <= input.appointmentTime
    ) {
      return { party: "RETAILER", reason: "UNSUPPORTED_OTIF_CLAIM", confidence: 0.85 };
    }
  }

  if (input.reasonCode === "SHORTAGE" && cleanPod) {
    return { party: "RETAILER", reason: "UNSUPPORTED_SHORTAGE_CLAIM", confidence: 0.9 };
  }

  if (input.reasonCode === "DAMAGE" && cleanPod) {
    return { party: "RETAILER", reason: "UNSUPPORTED_DAMAGE_CLAIM", confidence: 0.85 };
  }

  if (input.reasonCode === "LATE_ASN") {
    if (
      input.asnSentTime &&
      input.asnDeadline &&
      input.asnSentTime > input.asnDeadline
    ) {
      return { party: "THREE_PL", reason: "LATE_ASN_TRANSMISSION", confidence: 0.85 };
    }
    return { party: "RETAILER", reason: "UNSUPPORTED_ASN_CLAIM", confidence: 0.6 };
  }

  return { party: "UNKNOWN", reason: "NEEDS_REVIEW", confidence: 0 };
}
