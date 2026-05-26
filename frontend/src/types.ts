// ---- existing types ----
export type Category = 'Articles' | 'Audio' | 'Video' | 'Books';
export type UserRole = 'admin' | 'user';
export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'blocked';
export type FileStatus = 'approved' | 'pending' | 'flagged';

export interface User {
  id: string;
  email: string;
  name: string;
  intent?: string;
  role: UserRole;
  status: AccessStatus;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  category: Category;
  languageId: string;
  description: string;
  thumbnail?: string;
  transcript?: string;
  url?: string;
  author?: string;
  duration?: string;
  date?: string;
}

// ---- our AppUser (real DB) ----
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

// ---- Dinah’s additions ----
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  authorRole: 'admin' | 'user';
}

export interface UploadedFile {
  id: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  status: FileStatus;
  category: Category;
  languageId: string;
  comments: Comment[];
}

// preserved existing Language type
export interface Language {
  id: string;
  name: string;
  greeting: string;
  themeColor: string;
  bgImage: string;
  cultureDescription: string;
}
