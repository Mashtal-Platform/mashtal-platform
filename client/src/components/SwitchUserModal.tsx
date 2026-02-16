import React, { useState } from 'react';
import { X, Search, User, Building2, Leaf, HardHat, Shield, CheckCircle } from 'lucide-react';
import { useAuth, User as UserType } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SwitchUserModalProps {
  onClose: () => void;
}

export function SwitchUserModal({ onClose }: SwitchUserModalProps) {
  const { availableUsers, switchUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = availableUsers.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group users by role
  const groupedUsers = {
    business: filteredUsers.filter(u => u.role === 'business'),
    engineer: filteredUsers.filter(u => u.role === 'engineer'),
    agronomist: filteredUsers.filter(u => u.role === 'agronomist'),
    admin: filteredUsers.filter(u => u.role === 'admin'),
    user: filteredUsers.filter(u => u.role === 'user' || !u.role),
  };

  const handleUserSelect = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const getRoleIcon = (role: string | null | undefined) => {
    switch (role) {
      case 'business':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'engineer':
        return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'agronomist':
        return <Leaf className="w-4 h-4 text-green-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
    switch (role) {
      case 'business':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'engineer':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'agronomist':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const renderUserGroup = (title: string, users: UserType[]) => {
    if (users.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">
          {title} ({users.length})
        </h3>
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors border border-neutral-100 hover:border-green-300 hover:shadow-sm group"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
                {/* Role Badge */}
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border-2 border-white shadow-sm">
                  {getRoleIcon(user.role)}
                </div>
                {/* Verified Badge */}
                {user.verified && (
                  <div className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 fill-current" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-neutral-900 truncate group-hover:text-green-600 transition-colors">
                    {user.fullName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${getRoleBadgeColor(user.role)}`}>
                    {user.role || 'user'}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                {user.location && (
                  <p className="text-xs text-neutral-400 truncate mt-1">{user.location}</p>
                )}
              </div>

              {/* Select Indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Switch Account</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Choose a different account to switch to
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* User List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No users found</p>
            </div>
          ) : (
            <>
              {renderUserGroup('Businesses', groupedUsers.business)}
              {renderUserGroup('Engineers', groupedUsers.engineer)}
              {renderUserGroup('Agronomists', groupedUsers.agronomist)}
              {renderUserGroup('Administrators', groupedUsers.admin)}
              {renderUserGroup('Users', groupedUsers.user)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 p-4 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}