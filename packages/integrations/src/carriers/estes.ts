import { CarrierAdapter, CarrierPodResult } from "./types";

export class EstesCarrierAdapter implements CarrierAdapter {
  name = "Estes Express";
  scacCodes = ["EME", "ESTES"];

  constructor(private apiKey: string | undefined, private mock = false) {}

  async fetchPod(proNumber: string): Promise<CarrierPodResult> {
    if (this.mock) {
      // Simulates real-world Estes portal lag: POD not available yet.
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        success: false,
        proNumber,
        carrierCode: "EME",
        podUrl: null,
        podSigned: false,
        deliveryDate: null,
        exceptionNotes: "POD not yet available in Estes portal (mock)"
      };
    }

    const res = await fetch(
      "https://www.estesexpress.com/apis/tracking/v1/shipments?proNumber=" + proNumber,
      { headers: { "ESTES-API-KEY": this.apiKey ?? "" } }
    );

    if (!res.ok) {
      return {
        success: false,
        proNumber,
        carrierCode: "EME",
        podUrl: null,
        podSigned: false,
        deliveryDate: null,
        exceptionNotes: "Estes API error " + res.status
      };
    }

    const data = await res.json();

    return {
      success: Boolean(data.podUrl),
      proNumber,
      carrierCode: "EME",
      podUrl: data.podUrl ?? null,
      podSigned: Boolean(data.podUrl),
      deliveryDate: data.deliveryDate ?? null,
      exceptionNotes: data.exceptionNotes ?? null
    };
  }
}
