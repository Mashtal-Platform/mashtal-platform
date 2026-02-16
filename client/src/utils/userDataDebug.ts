/**
 * User Data Synchronization Debug Utilities
 * 
 * Helper functions to inspect and manage user data in localStorage
 * Useful for development and troubleshooting
 */

interface UserDataSnapshot {
  userId: string;
  savedItemsCount: number;
  postsCount: number;
  threadsCount: number;
  productsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  savesCount: number;
}

/**
 * Get all user IDs that have data in localStorage
 */
export function getAllUserIds(): string[] {
  const userData = localStorage.getItem('mashtal_user_data');
  const interactions = localStorage.getItem('mashtal_user_interactions');
  
  const userIds = new Set<string>();
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      Object.keys(parsed).forEach(id => userIds.add(id));
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
  
  if (interactions) {
    try {
      const parsed = JSON.parse(interactions);
      Object.keys(parsed).forEach(id => userIds.add(id));
    } catch (e) {
      console.error('Failed to parse interactions:', e);
    }
  }
  
  return Array.from(userIds);
}

/**
 * Get a snapshot of a specific user's data
 */
export function getUserDataSnapshot(userId: string): UserDataSnapshot | null {
  const userData = localStorage.getItem('mashtal_user_data');
  const interactions = localStorage.getItem('mashtal_user_interactions');
  
  if (!userData) return null;
  
  try {
    const parsedData = JSON.parse(userData);
    const parsedInteractions = interactions ? JSON.parse(interactions) : {};
    
    const userInfo = parsedData[userId];
    const userInteractions = parsedInteractions[userId];
    
    if (!userInfo) return null;
    
    return {
      userId,
      savedItemsCount: userInfo.savedItems?.length || 0,
      postsCount: userInfo.posts?.length || 0,
      threadsCount: userInfo.threads?.length || 0,
      productsCount: userInfo.products?.length || 0,
      followersCount: userInfo.followers?.length || 0,
      followingCount: userInfo.following?.length || 0,
      likesCount: userInteractions?.likes?.length || 0,
      savesCount: userInteractions?.saves?.length || 0,
    };
  } catch (e) {
    console.error('Failed to get user snapshot:', e);
    return null;
  }
}

/**
 * Get snapshots for all users
 */
export function getAllUserSnapshots(): UserDataSnapshot[] {
  const userIds = getAllUserIds();
  return userIds
    .map(id => getUserDataSnapshot(id))
    .filter((snapshot): snapshot is UserDataSnapshot => snapshot !== null);
}

/**
 * Print a formatted table of all user data
 */
export function printUserDataTable(): void {
  const snapshots = getAllUserSnapshots();
  
  if (snapshots.length === 0) {
    console.log('No user data found in localStorage');
    return;
  }
  
  console.table(snapshots);
}

/**
 * Clear data for a specific user
 */
export function clearUserData(userId: string): boolean {
  try {
    // Clear from user data
    const userData = localStorage.getItem('mashtal_user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      delete parsed[userId];
      localStorage.setItem('mashtal_user_data', JSON.stringify(parsed));
    }
    
    // Clear from interactions
    const interactions = localStorage.getItem('mashtal_user_interactions');
    if (interactions) {
      const parsed = JSON.parse(interactions);
      delete parsed[userId];
      localStorage.setItem('mashtal_user_interactions', JSON.stringify(parsed));
    }
    
    console.log(`✅ Cleared data for user: ${userId}`);
    return true;
  } catch (e) {
    console.error('Failed to clear user data:', e);
    return false;
  }
}

/**
 * Clear all user data and interactions
 */
export function clearAllUserData(): boolean {
  try {
    localStorage.removeItem('mashtal_user_data');
    localStorage.removeItem('mashtal_user_interactions');
    console.log('✅ Cleared all user data');
    return true;
  } catch (e) {
    console.error('Failed to clear all user data:', e);
    return false;
  }
}

/**
 * Export all user data as JSON
 */
export function exportUserData(): string {
  const userData = localStorage.getItem('mashtal_user_data');
  const interactions = localStorage.getItem('mashtal_user_interactions');
  
  const exportData = {
    userData: userData ? JSON.parse(userData) : {},
    interactions: interactions ? JSON.parse(interactions) : {},
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import user data from JSON
 */
export function importUserData(jsonString: string): boolean {
  try {
    const imported = JSON.parse(jsonString);
    
    if (imported.userData) {
      localStorage.setItem('mashtal_user_data', JSON.stringify(imported.userData));
    }
    
    if (imported.interactions) {
      localStorage.setItem('mashtal_user_interactions', JSON.stringify(imported.interactions));
    }
    
    console.log('✅ Imported user data successfully');
    return true;
  } catch (e) {
    console.error('Failed to import user data:', e);
    return false;
  }
}

/**
 * Download user data as a JSON file
 */
export function downloadUserData(): void {
  const data = exportUserData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mashtal-user-data-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('✅ Downloaded user data');
}

/**
 * Get localStorage usage statistics
 */
export function getStorageStats(): {
  used: number;
  usedFormatted: string;
  percentage: number;
  limit: number;
  limitFormatted: string;
} {
  let totalSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  
  // Convert to KB
  const usedKB = totalSize / 1024;
  // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
  const limitKB = 5 * 1024;
  const percentage = (usedKB / limitKB) * 100;
  
  return {
    used: usedKB,
    usedFormatted: `${usedKB.toFixed(2)} KB`,
    percentage: Math.min(percentage, 100),
    limit: limitKB,
    limitFormatted: `${limitKB} KB`,
  };
}

/**
 * Print storage statistics
 */
export function printStorageStats(): void {
  const stats = getStorageStats();
  console.log('📊 localStorage Usage:');
  console.log(`   Used: ${stats.usedFormatted} / ${stats.limitFormatted}`);
  console.log(`   Percentage: ${stats.percentage.toFixed(2)}%`);
  
  if (stats.percentage > 80) {
    console.warn('⚠️ localStorage is over 80% full! Consider clearing old data.');
  }
}

/**
 * Validate data integrity
 */
export function validateDataIntegrity(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const userData = localStorage.getItem('mashtal_user_data');
    const interactions = localStorage.getItem('mashtal_user_interactions');
    
    // Check if data can be parsed
    if (userData) {
      try {
        JSON.parse(userData);
      } catch (e) {
        errors.push('User data is corrupted (invalid JSON)');
      }
    }
    
    if (interactions) {
      try {
        JSON.parse(interactions);
      } catch (e) {
        errors.push('Interactions data is corrupted (invalid JSON)');
      }
    }
    
    // Check for orphaned data
    const userIds = getAllUserIds();
    if (userData) {
      const parsed = JSON.parse(userData);
      Object.keys(parsed).forEach(userId => {
        const userInfo = parsed[userId];
        
        if (!userInfo.savedItems) warnings.push(`User ${userId} missing savedItems array`);
        if (!userInfo.posts) warnings.push(`User ${userId} missing posts array`);
        if (!userInfo.threads) warnings.push(`User ${userId} missing threads array`);
        if (!userInfo.followers) warnings.push(`User ${userId} missing followers array`);
        if (!userInfo.following) warnings.push(`User ${userId} missing following array`);
      });
    }
    
  } catch (e) {
    errors.push(`Validation error: ${e}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Print data integrity report
 */
export function printIntegrityReport(): void {
  const report = validateDataIntegrity();
  
  console.log('🔍 Data Integrity Report:');
  
  if (report.valid) {
    console.log('✅ All data is valid');
  } else {
    console.error('❌ Data integrity issues found:');
    report.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (report.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    report.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

// Expose debug utilities to window object in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).mashtalDebug = {
    getAllUserIds,
    getUserDataSnapshot,
    getAllUserSnapshots,
    printUserDataTable,
    clearUserData,
    clearAllUserData,
    exportUserData,
    importUserData,
    downloadUserData,
    getStorageStats,
    printStorageStats,
    validateDataIntegrity,
    printIntegrityReport,
  };
  
  console.log('🛠️ Mashtal Debug Utils loaded. Use window.mashtalDebug to access utilities.');
  console.log('Available commands:');
  console.log('  - mashtalDebug.printUserDataTable()');
  console.log('  - mashtalDebug.printStorageStats()');
  console.log('  - mashtalDebug.printIntegrityReport()');
  console.log('  - mashtalDebug.downloadUserData()');
  console.log('  - mashtalDebug.clearAllUserData()');
}
