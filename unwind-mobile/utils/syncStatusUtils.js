import { getUnsyncedCount as getJournalUnsyncedCount } from '../storage/journal/storage';
import { getUnsyncedCount as getMistakesUnsyncedCount } from '../storage/mistakes/storage';
import { getUnsyncedCount as getOverthinkingUnsyncedCount } from '../storage/overthinking/storage';

/**
 * Check if all data for today is synced
 * @returns {Promise<Object>} - Sync status with details
 */
export const checkTodaySyncStatus = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const [journalUnsyncedCount, mistakesUnsyncedCount, overthinkingUnsyncedCount] = await Promise.all([
      getJournalUnsyncedCount(),
      getMistakesUnsyncedCount ? getMistakesUnsyncedCount() : 0,
      getOverthinkingUnsyncedCount ? getOverthinkingUnsyncedCount() : 0
    ]);

    const totalUnsyncedCount = journalUnsyncedCount + mistakesUnsyncedCount + overthinkingUnsyncedCount;
    const isAllSynced = totalUnsyncedCount === 0;

    return {
      isAllSynced,
      totalUnsyncedCount,
      details: {
        journal: journalUnsyncedCount,
        mistakes: mistakesUnsyncedCount,
        overthinking: overthinkingUnsyncedCount
      },
      date: today
    };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return {
      isAllSynced: false,
      totalUnsyncedCount: -1, // Indicates error
      details: {
        journal: 0,
        mistakes: 0,
        overthinking: 0
      },
      error: error.message
    };
  }
};

/**
 * Get user-friendly message about what needs to be synced
 * @param {Object} syncStatus - Result from checkTodaySyncStatus
 * @returns {string}
 */
export const getSyncStatusMessage = (syncStatus) => {
  if (syncStatus.error) {
    return 'Unable to check sync status. Please try again.';
  }

  if (syncStatus.isAllSynced) {
    return 'All data is synced!';
  }

  const unsyncedItems = [];
  if (syncStatus.details.journal > 0) {
    unsyncedItems.push(`${syncStatus.details.journal} journal ${syncStatus.details.journal === 1 ? 'entry' : 'entries'}`);
  }
  if (syncStatus.details.mistakes > 0) {
    unsyncedItems.push(`${syncStatus.details.mistakes} mistake ${syncStatus.details.mistakes === 1 ? 'entry' : 'entries'}`);
  }
  if (syncStatus.details.overthinking > 0) {
    unsyncedItems.push(`${syncStatus.details.overthinking} overthinking ${syncStatus.details.overthinking === 1 ? 'entry' : 'entries'}`);
  }

  if (unsyncedItems.length === 1) {
    return `${unsyncedItems[0]} needs to be synced.`;
  } else if (unsyncedItems.length === 2) {
    return `${unsyncedItems[0]} and ${unsyncedItems[1]} need to be synced.`;
  } else {
    return `${unsyncedItems.slice(0, -1).join(', ')}, and ${unsyncedItems[unsyncedItems.length - 1]} need to be synced.`;
  }
};

/**
 * Check if user has any data for today that could be used for summary generation
 * @returns {Promise<Object>}
 */
export const checkTodayDataAvailability = async () => {
  try {
    // This would need to be implemented based on your existing storage functions
    // For now, we'll use a simplified approach
    const syncStatus = await checkTodaySyncStatus();
    
    // If there are unsynced items, there's definitely data
    // If everything is synced, we assume there might still be synced data
    const hasData = syncStatus.totalUnsyncedCount > 0 || syncStatus.isAllSynced;
    
    return {
      hasData,
      message: hasData 
        ? 'Data available for summary generation'
        : 'No data available for today. Please add some journal entries, mistakes, or overthinking logs first.'
    };
  } catch (error) {
    console.error('Error checking data availability:', error);
    return {
      hasData: false,
      message: 'Unable to check data availability',
      error: error.message
    };
  }
};