// Types pour l'import des livres Amazon

export interface AmazonBookFormat {
  name: string;
  price: string;
  url: string;
}

export interface AmazonBestSellerRank {
  category: string;
  rank: number;
}

export interface AmazonBookData {
  asin: string;
  ISBN10: string;
  answered_questions: number;
  availability: string;
  brand: string;
  buybox_seller?: string;
  currency: string;
  date_first_available: string | null;
  delivery: string[];
  department: string | null;
  description: string | null;
  discount: string | null;
  domain: string;
  features: string[];
  final_price: number;
  format: AmazonBookFormat[];
  image_url: string;
  images_count: string;
  initial_price: number | null;
  item_weight: string;
  manufacturer: string | null;
  model_number: string | null;
  plus_content: boolean;
  product_dimensions: string;
  rating: string;
  reviews_count: number;
  root_bs_rank: number;
  seller_id: string;
  seller_name: string;
  timestamp: string;
  title: string;
  upc: string | null;
  url: string;
  video: boolean;
  video_count: number;
  categories: string[];
  best_sellers_rank: AmazonBestSellerRank[];
}

export interface BookImportData {
  title: string;
  author: string;
  year?: number | null;
  category: string;
  price: number;
  asin?: string;
  isbn10?: string;
  description?: string;
  imageUrl?: string;
  rating?: string;
  reviewsCount?: number;
  availability?: string;
  format?: AmazonBookFormat[];
  categories?: string[];
  dimensions?: string;
  weight?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: string[];
  processingTime: number;
}

export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
}
