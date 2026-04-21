// This file defines the "shapes" of our data. 
// In TypeScript, we use interfaces to make sure our code uses the right information in the right places.

// A Category can only be one of these four specific words.
export type Category = 'Articles' | 'Audio' | 'Video' | 'Books';

// This describes what information every Language in our app must have.
export interface Language {
  id: string;               //  unique identifier (like 'oshiwambo')
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
}
