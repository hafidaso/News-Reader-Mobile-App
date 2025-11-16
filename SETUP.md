# Setup Guide for News Reader App

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your NewsAPI Key

1. Go to [https://newsapi.org/](https://newsapi.org/)
2. Click "Get API Key" and sign up for a free account
3. Copy your API key from the dashboard

### 3. Configure API Key

Open `src/constants/config.ts` and replace `YOUR_API_KEY_HERE` with your actual API key:

```typescript
export const NEWS_API_CONFIG = {
  apiKey: 'paste_your_api_key_here',
  baseUrl: 'https://newsapi.org/v2',
  country: 'us',
  pageSize: 20,
};
```

### 4. Run the App

Start the development server:

```bash
npm start
```

Then choose your platform:
- Press **i** for iOS Simulator (Mac only)
- Press **a** for Android Emulator
- Scan the QR code with **Expo Go** app on your phone

## Features

✅ Category filters (Business, Technology, Sports, Health, Entertainment, Science)
✅ Article preview cards with images
✅ Pull-to-refresh functionality
✅ Loading states and error handling
✅ Empty state messages
✅ Open articles in device browser
✅ Mobile-optimized layout
✅ TypeScript for type safety

## Troubleshooting

### "Failed to fetch news. Please check your API key."

- Make sure you've replaced `YOUR_API_KEY_HERE` with your actual NewsAPI key
- Verify your API key is valid at [newsapi.org/account](https://newsapi.org/account)
- Check your internet connection

### Articles not loading

- The free NewsAPI tier delays articles by 24 hours
- Some categories may have limited articles for certain countries
- Try switching to a different category

### Expo errors

- Make sure you're using a compatible Node.js version (16 or later)
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ArticleCard.tsx  # Individual article display
│   ├── CategoryFilter.tsx # Category selection bar
│   ├── LoadingState.tsx  # Loading indicator
│   ├── EmptyState.tsx    # Empty results view
│   └── ErrorState.tsx    # Error display with retry
├── constants/           # App configuration
│   ├── categories.ts    # Category definitions
│   └── config.ts        # API configuration
├── screens/            # App screens
│   └── HomeScreen.tsx  # Main news feed screen
├── services/           # API services
│   └── newsApi.ts      # NewsAPI integration
└── types/              # TypeScript types
    └── index.ts        # Type definitions
```

## Customization

### Change Default Country

Edit `src/constants/config.ts`:

```typescript
country: 'gb', // For UK news
```

### Adjust Articles Per Page

Edit `src/constants/config.ts`:

```typescript
pageSize: 30, // Show 30 articles
```

### Modify Categories

Edit `src/constants/categories.ts` to add or remove categories.

## API Limitations (Free Tier)

- ⏱️ 100 requests per day
- 📅 Articles delayed by 24 hours
- 🌍 Limited to specific countries for top headlines

For production apps, consider upgrading to a paid NewsAPI plan.


## Support

If you encounter issues:

1. Check the console for error messages
2. Verify your API key is correct
3. Ensure you have an active internet connection
4. Try running `npx expo start -c` to clear cache

Enjoy your news reading! 📰

