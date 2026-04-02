export function resolveCountryCode(senderE164: string, fallback: string) {
  if (senderE164.startsWith("91")) {
    return "91";
  }
  return fallback;
}

export function formatCustomerNumber(
  senderE164: string,
  countryCode: string,
  format: "E164" | "NATIONAL"
) {
  if (format === "E164") {
    return senderE164;
  }
  if (senderE164.startsWith(countryCode)) {
    return senderE164.slice(countryCode.length);
  }
  return senderE164;
}

export function normalizeInboundNumber(input: string, defaultCountryCode: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith(defaultCountryCode)) {
    return digits;
  }
  if (digits.length <= 10 && defaultCountryCode) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}
