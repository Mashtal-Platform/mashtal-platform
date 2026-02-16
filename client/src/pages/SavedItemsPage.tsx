import React, { useState } from 'react';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { SavedItem } from '../App';

interface SavedItemsPageProps {
  savedItems: SavedItem[];
  onRemove: (itemId: string) => void;
  onViewBusiness: (businessId: string) => void;
}

export function SavedItemsPage({ savedItems, onRemove, onViewBusiness }: SavedItemsPageProps) {
  const [filter, setFilter] = useState<'all' | 'product' | 'post' | 'thread' | 'business'>('all');

  const filteredItems = filter === 'all' 
    ? savedItems 
    : savedItems.filter(item => item.type === filter);

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">Saved Items</h1>
          <p className="text-neutral-600">{savedItems.length} items saved for later</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            All ({savedItems.length})
          </button>
          <button
            onClick={() => setFilter('product')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'product' ? 'bg-green-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Products ({savedItems.filter(i => i.type === 'product').length})
          </button>
          <button
            onClick={() => setFilter('post')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'post' ? 'bg-green-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Posts ({savedItems.filter(i => i.type === 'post').length})
          </button>
          <button
            onClick={() => setFilter('thread')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'thread' ? 'bg-green-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Threads ({savedItems.filter(i => i.type === 'thread').length})
          </button>
          <button
            onClick={() => setFilter('business')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === 'business' ? 'bg-green-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Businesses ({savedItems.filter(i => i.type === 'business').length})
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Bookmark className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No saved items</h3>
            <p className="text-neutral-600">
              {filter === 'all' 
                ? 'Start saving items you\'re interested in'
                : `No saved ${filter}s yet`
              }
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white px-3 py-1 rounded-full text-xs text-neutral-700 capitalize">
                      {item.type}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group/btn border border-neutral-200 hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4 text-neutral-500 group-hover/btn:text-red-500 transition-colors" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-lg text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      Saved {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                    {item.type === 'product' && (
                      <button className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm">
                        <ExternalLink className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}