import crypto from "crypto";

export function verifySignature(
  rawBody: Buffer,
  headerValue: string | undefined,
  secret: string
) {
  if (!headerValue || !secret) {
    return false;
  }
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(headerValue);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
