export const paymentsConfig = {
  STRIPE_MODE: "test" as "test" | "live",
  STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder",
  PLATFORM_FEE_PERCENTAGE: 2.9,
  PLATFORM_FEE_FIXED: 0.30,
};

export const calculatePlatformFee = (amountCents: number) => {
  const percentage = (amountCents * paymentsConfig.PLATFORM_FEE_PERCENTAGE) / 100;
  const fixed = paymentsConfig.PLATFORM_FEE_FIXED * 100;
  return Math.round(percentage + fixed);
};