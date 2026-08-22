export interface CarrierPodResult {
  success: boolean;
  proNumber: string;
  carrierCode: string;
  podUrl: string | null;
  podSigned: boolean;
  deliveryDate: string | null;
  exceptionNotes: string | null;
}

export interface CarrierAdapter {
  name: string;
  scacCodes: string[];
  fetchPod(proNumber: string): Promise<CarrierPodResult>;
}
