import { summaryService } from '../services/summaryService';

/**
 * Initialize AI Summary settings with default configuration
 * This sets up the OpenRouter API key and enables AI summaries
 */
export const initializeSummarySettings = async () => {
  try {
    // Check if settings already exist
    const currentSettings = await summaryService.getSettings();
    
    // Only initialize if API key is not already set
    if (!currentSettings.apiKey) {
      await summaryService.updateSettings({
        enabled: true,
        autoGenerate: false, // User can enable this manually
        model: 'openai/gpt-3.5-turbo',
        apiKey: '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',
        maxKeyPoints: 5,
      });
      
      console.log('✅ AI Summary settings initialized successfully');
    } else {
      console.log('ℹ️  AI Summary settings already configured');
    }
  } catch (error) {
    console.error('❌ Error initializing summary settings:', error);
  }
};

