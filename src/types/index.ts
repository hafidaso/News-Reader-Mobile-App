export interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

export type Category = 
  | 'general'
  | 'business'
  | 'technology'
  | 'sports'
  | 'health'
  | 'entertainment'
  | 'science';

export interface CategoryItem {
  id: Category;
  label: string;
  icon: string;
}

