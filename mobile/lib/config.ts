// Environment-based API configuration
const EMULATOR_API_URL = "http://10.0.2.2:3001"; // Android Emulator
const PHYSICAL_DEVICE_API_URL = "http://10.118.246.39:3001"; // YOUR LOCAL IP for Physical Device
const PROD_API_URL = "https://expense-iq-one.vercel.app"; // Production URL

// Toggle this manually or use __DEV__ if available in your environment
export const API_BASE_URL =__DEV__?  PHYSICAL_DEVICE_API_URL : PROD_API_URL;

export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
