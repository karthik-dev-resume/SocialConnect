export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  bio?: string
  avatar_url?: string
  website?: string
  location?: string
  role: 'user' | 'admin'
  profile_visibility: 'public' | 'private' | 'followers_only'
  is_active: boolean
  is_verified: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  password_hash: string
  bio?: string
  avatar_url?: string
  website?: string
  location?: string
  profile_visibility?: 'public' | 'private' | 'followers_only'
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  content: string
  author_id: string
  image_url?: string
  category: 'general' | 'announcement' | 'question'
  is_active: boolean
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author?: User
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: User
  following?: User
}

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
}

export interface UserStats {
  followers_count: number
  following_count: number
  posts_count: number
}

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'like' | 'comment'
  actor_id: string
  post_id?: string
  comment_id?: string
  is_read: boolean
  created_at: string
  actor?: User
  post?: Post
}

