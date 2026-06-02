export interface Experiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  category?: string | null;
  featured: boolean;
  cover_image?: string | null;
  content?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabNote {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image?: string | null;
  tags: string[];
  published: boolean;
  reading_time?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyItem {
  id: string;
  year: number;
  title: string;
  description: string;
  icon?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
}
