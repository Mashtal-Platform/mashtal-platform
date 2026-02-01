import React from 'react';
import { PostsFeed } from '../components/PostsFeed';
import { SavedItem } from '../App';

interface PostsPageProps {
  onSavePost: (item: SavedItem) => void;
}

export function PostsPage({ onSavePost }: PostsPageProps) {
  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">
            Agricultural Updates & Posts
          </h1>
          <p className="text-neutral-600">
            Stay updated with the latest news, tips, and announcements from agricultural businesses
          </p>
        </div>
        
        <PostsFeed onSavePost={onSavePost} />
      </div>
    </div>
  );
}