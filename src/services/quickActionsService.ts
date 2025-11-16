import * as Linking from 'expo-linking';

export interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  route: string;
  params?: any;
}

// Define available quick actions
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'bookmarks',
    title: '🔖 Bookmarks',
    subtitle: 'View saved articles',
    route: 'Bookmarks',
  },
  {
    id: 'breaking',
    title: '🔥 Breaking News',
    subtitle: 'Latest headlines',
    route: 'Home',
    params: { category: 'breaking' },
  },
  {
    id: 'notes',
    title: '📝 My Notes',
    subtitle: 'View annotations',
    route: 'Notes',
  },
  {
    id: 'analytics',
    title: '📊 Reading Stats',
    subtitle: 'View your analytics',
    route: 'Analytics',
  },
];

class QuickActionsService {
  /**
   * Initialize deep linking for quick actions
   */
  initializeDeepLinking() {
    // Configure URL scheme
    const prefix = Linking.createURL('/');
    console.log('Deep linking prefix:', prefix);
  }

  /**
   * Handle a quick action
   */
  async handleQuickAction(actionId: string, navigation: any) {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    
    if (!action) {
      console.warn('Unknown quick action:', actionId);
      return;
    }

    // Navigate to the specified route
    if (action.params) {
      navigation.navigate(action.route, action.params);
    } else {
      navigation.navigate(action.route);
    }
  }

  /**
   * Create a deep link URL for a quick action
   */
  createDeepLink(actionId: string): string {
    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    if (!action) return '';

    // Create deep link URL
    const url = Linking.createURL(action.route, {
      queryParams: action.params || {},
    });

    return url;
  }

  /**
   * Parse a deep link URL
   */
  parseDeepLink(url: string): { route: string; params?: any } | null {
    try {
      const { path, queryParams } = Linking.parse(url);
      
      if (!path) return null;

      return {
        route: path,
        params: queryParams,
      };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Get quick action by ID
   */
  getQuickAction(actionId: string): QuickAction | undefined {
    return QUICK_ACTIONS.find(a => a.id === actionId);
  }

  /**
   * Get all quick actions
   */
  getAllQuickActions(): QuickAction[] {
    return QUICK_ACTIONS;
  }
}

export const quickActionsService = new QuickActionsService();

