import { CarrierAdapter } from "./types";
import { XpoCarrierAdapter } from "./xpo";
import { EstesCarrierAdapter } from "./estes";

export function getCarrierAdapter(
  carrierName: string,
  mock: boolean
): CarrierAdapter | undefined {
  const upper = (carrierName ?? "").toUpperCase();

  if (upper.includes("XPO")) {
    return new XpoCarrierAdapter(process.env.XPO_API_KEY, mock);
  }

  if (upper.includes("ESTES")) {
    return new EstesCarrierAdapter(process.env.ESTES_API_KEY, mock);
  }

  return undefined;
}
