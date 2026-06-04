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

// Contributor-specified data-use preferences, set at upload time.
// undefined on either field means the permission is granted (permissive default for legacy content).
export interface DataUseConsent {
  allowSharing: boolean;   // others may submit a share request for this asset
  allowDownload: boolean;  // others may download this asset directly
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
  dataUseConsent?: DataUseConsent;
}

// ---- Share request flow ----
export type ShareRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ShareRequest {
  id: string;
  contentId: string;
  contentTitle: string;
  requestedBy: string;        // AppUser.id
  requestedByName: string;
  requestedAt: string;        // ISO timestamp
  reason: string;
  status: ShareRequestStatus;
  shareToken?: string;        // UUID set by admin on approval; build URL as /share/{shareToken}
  reviewedBy?: string;        // admin AppUser.id
  reviewedAt?: string;        // ISO timestamp
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
