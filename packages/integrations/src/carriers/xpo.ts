import { CarrierAdapter, CarrierPodResult } from "./types";

export class XpoCarrierAdapter implements CarrierAdapter {
  name = "XPO Logistics";
  scacCodes = ["XPO", "XPOL"];

  constructor(private apiKey: string | undefined, private mock = false) {}

  async fetchPod(proNumber: string): Promise<CarrierPodResult> {
    if (this.mock) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        success: true,
        proNumber,
        carrierCode: "XPO",
        podUrl: "https://pods.recovio.demo/xpo/" + proNumber + ".pdf",
        podSigned: true,
        deliveryDate: "2026-08-12T14:30:00Z",
        exceptionNotes: null
      };
    }

    const res = await fetch(
      "https://api.xpo.com/v1/shipments?proNumber=" + proNumber,
      { headers: { "X-API-Key": this.apiKey ?? "" } }
    );

    if (!res.ok) {
      return {
        success: false,
        proNumber,
        carrierCode: "XPO",
        podUrl: null,
        podSigned: false,
        deliveryDate: null,
        exceptionNotes: "XPO API error " + res.status
      };
    }

    const data = await res.json();

    return {
      success: true,
      proNumber,
      carrierCode: "XPO",
      podUrl: data.podUrl ?? null,
      podSigned: Boolean(data.podSigned),
      deliveryDate: data.deliveryDate ?? null,
      exceptionNotes: null
    };
  }
}
