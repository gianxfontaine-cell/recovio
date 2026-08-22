import crypto from "crypto";

export interface NetSuiteCredentials {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export interface NetSuiteInvoice {
  netsuiteId: string;
  invoiceNumber: string;
  poNumber: string | null;
  customerName: string | null;
  totalAmount: number;
  invoiceDate: string;
}

const MOCK_INVOICES: NetSuiteInvoice[] = [
  { netsuiteId: "10001", invoiceNumber: "INV-10042", poNumber: "PO-88392", customerName: "Walmart", totalAmount: 18400, invoiceDate: "2026-07-28" },
  { netsuiteId: "10002", invoiceNumber: "INV-10043", poNumber: "PO-88395", customerName: "Target", totalAmount: 9200, invoiceDate: "2026-07-30" },
  { netsuiteId: "10003", invoiceNumber: "INV-10044", poNumber: "PO-88399", customerName: "Target", totalAmount: 12750, invoiceDate: "2026-08-02" },
  { netsuiteId: "10004", invoiceNumber: "INV-10045", poNumber: "PO-88401", customerName: "UNFI", totalAmount: 6300, invoiceDate: "2026-08-05" },
  { netsuiteId: "10005", invoiceNumber: "INV-10048", poNumber: "PO-88410", customerName: "Walmart", totalAmount: 22100, invoiceDate: "2026-08-08" }
];

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export class NetSuiteClient {
  constructor(private creds: NetSuiteCredentials, private mock = false) {}

  async queryInvoices(): Promise<NetSuiteInvoice[]> {
    if (this.mock) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return MOCK_INVOICES;
    }

    const rows = await this.suiteql(
      "SELECT t.id AS ns_id, t.tranid AS invoice_number, t.otherrefnum AS po_number, e.entityid AS customer_name, t.total AS amount, t.trandate AS invoice_date FROM transaction t LEFT JOIN entity e ON e.id = t.entity WHERE t.type = 'CustInvc' AND t.mainline = 'T' ORDER BY t.trandate DESC"
    );

    return rows.map((row: any) => ({
      netsuiteId: String(row.ns_id),
      invoiceNumber: String(row.invoice_number),
      poNumber: row.po_number ? String(row.po_number) : null,
      customerName: row.customer_name ? String(row.customer_name) : null,
      totalAmount: Number(row.amount),
      invoiceDate: String(row.invoice_date)
    }));
  }

  private async suiteql(sql: string): Promise<any[]> {
    const url =
      "https://" +
      this.creds.accountId +
      ".suitetalk.api.netsuite.com/services/rest/query/v1/suiteql";

    const authHeader = this.buildAuthHeader("POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        prefer: "transient"
      },
      body: JSON.stringify({ q: sql })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error("NetSuite SuiteQL failed (" + res.status + "): " + text);
    }

    const data = await res.json();
    return data.items ?? [];
  }

  private buildAuthHeader(method: string, url: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const params: Record<string, string> = {
      oauth_consumer_key: this.creds.consumerKey,
      oauth_token: this.creds.tokenId,
      oauth_signature_method: "HMAC-SHA256",
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: "1.0"
    };

    const baseString = [
      method.toUpperCase(),
      rfc3986(url),
      rfc3986(
        Object.keys(params)
          .sort()
          .map(key => rfc3986(key) + "=" + rfc3986(params[key]))
          .join("&")
      )
    ].join("&");

    const signingKey =
      rfc3986(this.creds.consumerSecret) + "&" + rfc3986(this.creds.tokenSecret);

    const signature = crypto
      .createHmac("sha256", signingKey)
      .update(baseString)
      .digest("base64");

    const all: Record<string, string> = { ...params, oauth_signature: signature };

    return (
      'OAuth realm="' + rfc3986(this.creds.accountId) + '", ' +
      Object.keys(all)
        .map(key => rfc3986(key) + '="' + rfc3986(all[key]) + '"')
        .join(", ")
    );
  }
}
