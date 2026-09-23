// NEXT_PUBLIC values are embedded at build time. Invalid IDs disable analytics.
const configuredId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
export const gaMeasurementId =
  configuredId && /^G-[A-Z0-9]{10}$/.test(configuredId)
    ? configuredId
    : undefined;
