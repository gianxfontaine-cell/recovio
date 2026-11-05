export function isDemoMode(
  mode = process.env.RECOVIO_MODE,
  nodeEnv = process.env.NODE_ENV
): boolean {
  return mode === "demo" && nodeEnv !== "production"
}
