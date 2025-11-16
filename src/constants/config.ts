// For demo purposes, you can use a test API key
// In production, use environment variables or secure storage
export const NEWS_API_CONFIG = {
  apiKey: 'd0c8c86ec51446809076ac4544c7b5fe', // Your NewsAPI key
  baseUrl: 'https://newsapi.org/v2',
  country: 'us', // Default country for news
  pageSize: 20, // Number of articles per request
};

// Note: To use environment variables with Expo, install expo-constants
// and use: import Constants from 'expo-constants';
// Then access via: Constants.expoConfig?.extra?.newsApiKey

