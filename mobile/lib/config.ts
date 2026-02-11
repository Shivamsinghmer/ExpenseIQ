// Environment-based API configuration
const DEV_API_URL = "http://10.0.2.2:3001"; // Android emulator
const PROD_API_URL = "https://your-api.railway.app"; // Replace with your deployed URL

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
