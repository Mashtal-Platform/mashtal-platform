import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Settings, ShoppingBag, Heart, Bookmark, X, Save } from 'lucide-react';
import { UserProfile, Page } from '../App';

interface ProfilePageProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigate: (page: Page) => void;
}

export function ProfilePage({ userProfile, onUpdateProfile, onNavigate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onUpdateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(userProfile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-neutral-900">Edit Profile</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editedProfile.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editedProfile.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editedProfile.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={editedProfile.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleCancel}
                  className="flex-1 border-2 border-neutral-200 text-neutral-700 py-3 rounded-lg hover:border-green-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-green-600" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl text-neutral-900 mb-2">{userProfile.fullName}</h1>
              <p className="text-neutral-600 mb-4">{userProfile.bio}</p>
              
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span>{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>{userProfile.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>{userProfile.location}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>Member since Jan 2024</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2 border-2 border-neutral-200 rounded-lg hover:border-green-600 hover:text-green-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <button
            onClick={() => onNavigate('profile')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-green-600" />
              <span className="text-2xl text-neutral-900">12</span>
            </div>
            <div className="text-neutral-600">Total Orders</div>
          </button>
          
          <button
            onClick={() => onNavigate('following')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-2xl text-neutral-900">8</span>
            </div>
            <div className="text-neutral-600">Following</div>
          </button>
          
          <button
            onClick={() => onNavigate('saved')}
            className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Bookmark className="w-8 h-8 text-green-600" />
              <span className="text-2xl text-neutral-900">5</span>
            </div>
            <div className="text-neutral-600">Saved Items</div>
          </button>
        </div>

        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl text-neutral-900 mb-6">Recent Orders</h2>
          
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 pb-4 border-b border-neutral-200 last:border-0">
                <img
                  src={order.image}
                  alt={order.productName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-neutral-900 mb-1">{order.productName}</h3>
                  <p className="text-sm text-neutral-600">{order.businessName}</p>
                  <p className="text-sm text-neutral-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg text-neutral-900 mb-1">SR {order.price}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const recentOrders = [
  {
    id: '1',
    productName: 'Date Palm Seedlings',
    businessName: 'Green Valley Nursery',
    price: '150.00',
    date: 'Dec 10, 2024',
    status: 'Delivered',
    image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=300',
  },
  {
    id: '2',
    productName: 'Garden Tool Set',
    businessName: 'Green Valley Nursery',
    price: '220.00',
    date: 'Dec 5, 2024',
    status: 'Shipped',
    image: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=300',
  },
  {
    id: '3',
    productName: 'Organic Fertilizer - 5kg',
    businessName: 'Eco Farm Solutions',
    price: '85.00',
    date: 'Nov 28, 2024',
    status: 'Processing',
    image: 'https://images.unsplash.com/photo-1611504261400-bca14f7e0b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kcyUyMGhvbGRpbmclMjBzZWVkbGluZ3xlbnwxfHx8fDE3NjU3NDkyMDd8MA&ixlib=rb-4.1.0&q=80&w=300',
  },
];
