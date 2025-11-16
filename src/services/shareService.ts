import { Share, Alert, Platform } from 'react-native';
import { Article } from '../types';

/**
 * Share service for sharing articles to social media and other apps
 * Uses React Native's built-in Share API (no additional dependencies needed)
 */
export const shareService = {
  /**
   * Share an article with title, description, and URL
   */
  shareArticle: async (article: Article): Promise<boolean> => {
    try {
      const shareMessage = shareService.formatShareMessage(article);
      
      const shareOptions = {
        message: shareMessage,
        title: article.title,
        url: article.url,
      };

      // Use React Native's built-in Share API
      const result = await Share.share(
        Platform.OS === 'ios' 
          ? { url: article.url, title: article.title, message: shareMessage }
          : { message: `${shareMessage}\n\n${article.url}` }
      );
      
      // Check if share was successful
      if (result.action === Share.sharedAction) {
        console.log('Article shared successfully');
        return true;
      } else if (result.action === Share.dismissedAction) {
        console.log('User dismissed share dialog');
        return false;
      }
      
      return false;
    } catch (error: any) {
      console.error('Error sharing article:', error);
      Alert.alert(
        'Share Failed',
        'Unable to share this article. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  },

  /**
   * Share article to a specific social media platform
   * Note: React Native's Share API opens native share sheet,
   * user can choose the platform from there
   */
  shareToSocial: async (
    article: Article,
    platform: 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'sms'
  ): Promise<boolean> => {
    // With React Native's built-in Share API, we just open the share sheet
    // and let the user choose the platform
    console.log(`Opening share sheet (user can select ${platform})`);
    return await shareService.shareArticle(article);
  },

  /**
   * Format article data into a shareable message
   */
  formatShareMessage: (article: Article): string => {
    const title = article.title || 'Check out this article';
    const source = article.source?.name || 'News';
    const description = article.description 
      ? `\n\n${article.description.substring(0, 150)}${article.description.length > 150 ? '...' : ''}`
      : '';
    
    // Create a nicely formatted share message
    const message = `${title}\n\nFrom: ${source}${description}\n\nRead more: ${article.url}`;
    
    return message;
  },

  /**
   * Check if sharing is available on the device
   */
  isShareAvailable: (): boolean => {
    // Share API is available on both iOS and Android
    return Platform.OS === 'ios' || Platform.OS === 'android';
  },

  /**
   * Get available share options based on platform
   */
  getShareOptions: () => {
    const baseOptions = [
      { id: 'share', label: 'Share', icon: 'share-outline' },
    ];

    const socialOptions = [
      { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
      { id: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
      { id: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
      { id: 'email', label: 'Email', icon: 'mail-outline' },
      { id: 'sms', label: 'Message', icon: 'chatbubble-outline' },
    ];

    return {
      base: baseOptions,
      social: socialOptions,
      all: [...baseOptions, ...socialOptions],
    };
  },
};

