import { CarrierAdapter } from "./types";
import { XpoCarrierAdapter } from "./xpo";
import { EstesCarrierAdapter } from "./estes";

export function getCarrierAdapter(
  carrierName: string,
  mock: boolean,
  apiKey?: string
): CarrierAdapter | undefined {
  const upper = (carrierName ?? "").toUpperCase();

  if (upper.includes("XPO")) {
    return new XpoCarrierAdapter(apiKey, mock);
  }

  if (upper.includes("ESTES")) {
    return new EstesCarrierAdapter(apiKey, mock);
  }

  return undefined;
}
