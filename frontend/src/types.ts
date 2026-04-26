// This file defines the "shapes" of our data. 
// In TypeScript, we use interfaces to make sure our code uses the right information in the right places.

// A Category can only be one of these four specific words.
export type Category = 'Articles' | 'Audio' | 'Video' | 'Books';

// User roles for different levels of access.
export type UserRole = 'admin' | 'user';

// Access status for users.
export type AccessStatus = 'pending' | 'approved' | 'rejected';

// This describes a user of the system.
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: AccessStatus;
  intent?: string; // Reason for wanting access (for normal users)
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  display_name?: string | null;
  email: string;
  role: 'admin' | 'contributor' | 'viewer';
  avatar_url?: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// This describes what information every Language in our app must have.
export interface Language {
  id: string;               // unique identifier (like 'oshiwambo')
  name: string;             // The display name (like 'Oshiwambo')
  greeting: string;         // The "Hello" in that language
  themeColor: string;       
  bgImage: string;          // A link to a background image
  cultureDescription: string; // A short text about the culture
}

// This describes what information every item in our library must have.
export interface ContentItem {
  id: string;               // A unique ID for the item
  title: string;            // The title of the article, book, etc.
  category: Category;       // Which category it belongs to
  languageId: string;       // Which language it is written/spoken in
  description: string;      // A short summary of the item
  thumbnail?: string;       // An optional link to a small image
  transcript?: string;      // Full text transcript for articles/audio
  url?: string;             // Audio/Video URL
  author?: string;          // Author or speaker
  duration?: string;        // Duration for audio/video
  date?: string;            // Published date
}
