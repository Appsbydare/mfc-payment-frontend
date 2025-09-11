// Environment configuration
const getApiUrl = (): string => {
  // In production builds, Vite will replace import.meta.env at build time
  // In development, it will be available at runtime
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (error) {
    // Fallback if import.meta is not available
    console.warn('import.meta.env not available, using fallback');
  }
  
  // Temporarily force localhost for development testing
  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();

export const config = {
  API_URL,
  // Add other config variables here as needed
} as const;
