import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

function encryptionKey(): Buffer {
  const encoded = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!encoded) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be configured")
  }

  const key = Buffer.from(encoded, "base64")
  if (key.length !== 32) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be a base64-encoded 32-byte key")
  }
  return key
}

export function encryptCredentials(credentials: Record<string, string>, context: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  cipher.setAAD(Buffer.from(context, "utf8"))
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final()
  ])
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString("base64")).join(".")
}

export function decryptCredentials(value: string, context: string): Record<string, string> {
  const [encodedIv, encodedTag, encodedCiphertext] = value.split(".")
  if (!encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Stored integration credentials are malformed")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(encodedIv, "base64")
  )
  decipher.setAAD(Buffer.from(context, "utf8"))
  decipher.setAuthTag(Buffer.from(encodedTag, "base64"))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64")),
    decipher.final()
  ]).toString("utf8")
  const parsed: unknown = JSON.parse(plaintext)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored integration credentials are invalid")
  }
  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
}
