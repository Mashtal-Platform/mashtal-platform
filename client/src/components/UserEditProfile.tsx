import React, { useState, useRef } from 'react';
import { User, Camera, Save, X, Plus, Trash2 } from 'lucide-react';
import { UserProfile } from '../App';

interface UserEditProfileProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

interface CustomField {
  id: string;
  title: string;
  content: string;
}

export function UserEditProfile({ profile, onSave, onCancel }: UserEditProfileProps) {
  const [editedProfile, setEditedProfile] = useState(profile);
  const [customFields, setCustomFields] = useState<CustomField[]>(profile.customFields || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      title: '',
      content: '',
    };
    setCustomFields([...customFields, newField]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const handleCustomFieldChange = (id: string, field: 'title' | 'content', value: string) => {
    setCustomFields(customFields.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleSave = () => {
    onSave({ ...editedProfile, customFields });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl text-neutral-900">Edit Profile</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  {editedProfile.avatar ? (
                    <img
                      src={editedProfile.avatar}
                      alt={editedProfile.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-green-600" />
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                >
                  Change Photo
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={editedProfile.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={editedProfile.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-700 mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={editedProfile.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-700 mb-2">Bio *</label>
              <textarea
                name="bio"
                value={editedProfile.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
              />
            </div>

            {/* Optional Fields */}
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-base font-medium text-neutral-900 mb-4">Additional Information (Optional)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-700 mb-2">Farm Size</label>
                  <input
                    type="text"
                    name="farmSize"
                    value={editedProfile.farmSize || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 5 hectares"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-700 mb-2">Interests</label>
                  <input
                    type="text"
                    name="interests"
                    value={editedProfile.interests || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Organic farming, Hydroponics"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="border-t border-neutral-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-neutral-900">Custom Information</h3>
                <button
                  onClick={handleAddCustomField}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
              </div>

              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-neutral-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Custom Field {index + 1}</span>
                      <button
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="p-1 hover:bg-neutral-200 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-neutral-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={field.title}
                        onChange={(e) => handleCustomFieldChange(field.id, 'title', e.target.value)}
                        placeholder="e.g., Farming Experience, Crops Grown"
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-700 mb-2">Description</label>
                      <textarea
                        value={field.content}
                        onChange={(e) => handleCustomFieldChange(field.id, 'content', e.target.value)}
                        rows={3}
                        placeholder="Enter details..."
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
                      />
                    </div>
                  </div>
                ))}
                
                {customFields.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No custom fields added yet. Click "Add Field" to add custom information.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 border border-neutral-300 text-neutral-700 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
