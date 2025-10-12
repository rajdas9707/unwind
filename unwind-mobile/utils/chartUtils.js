/**
 * Chart utility functions for preparing and formatting data for Chart.js
 */

/**
 * Format scores data for Chart.js line chart
 * @param {Array} scores - Array of score objects with date and score properties
 * @returns {Array} Formatted data array for Chart.js
 */
export const formatScoresForChart = (scores = []) => {
  if (!Array.isArray(scores) || scores.length === 0) {
    return [];
  }

  // Sort by date to ensure proper chronological order
  const sortedScores = [...scores].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Format each item for Chart.js
  return sortedScores.map(item => ({
    date: item.date,
    score: Number(item.score) || 0,
  }));
};

/**
 * Generate sample chart data for testing purposes
 * @param {number} days - Number of days to generate data for
 * @returns {Array} Sample chart data
 */
export const generateSampleChartData = (days = 14) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate a somewhat realistic score pattern
    const baseScore = 5 + Math.sin(i * 0.5) * 2;
    const randomVariation = (Math.random() - 0.5) * 2;
    const score = Math.max(1, Math.min(10, Math.round((baseScore + randomVariation) * 10) / 10));
    
    data.push({
      date: date.toISOString().split('T')[0],
      score: score,
    });
  }
  
  return data;
};

/**
 * Get the date range for chart display
 * @param {number} days - Number of days to include
 * @returns {Object} Object with startDate and endDate
 */
export const getChartDateRange = (days = 14) => {
  const today = new Date();
  const endDate = today.toISOString().slice(0, 10);
  
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const startDate = start.toISOString().slice(0, 10);
  
  return { startDate, endDate };
};

/**
 * Calculate chart statistics
 * @param {Array} scores - Array of score objects
 * @returns {Object} Statistics object
 */
export const calculateChartStats = (scores = []) => {
  if (!Array.isArray(scores) || scores.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      trend: 'neutral',
      totalEntries: 0,
    };
  }

  const values = scores.map(item => Number(item.score) || 0);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / values.length) * 10) / 10;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  
  // Calculate trend based on first half vs second half
  const midPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midPoint);
  const secondHalf = values.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  let trend = 'neutral';
  if (secondAvg > firstAvg + 0.5) {
    trend = 'improving';
  } else if (secondAvg < firstAvg - 0.5) {
    trend = 'declining';
  }
  
  return {
    average,
    highest,
    lowest,
    trend,
    totalEntries: scores.length,
  };
};

/**
 * Format date for display in chart labels
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} format - Format type ('short', 'medium', 'long')
 * @returns {string} Formatted date string
 */
export const formatChartDate = (dateString, format = 'short') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case 'medium':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: '2-digit'
      });
    case 'long':
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
    default:
      return dateString;
  }
};

/**
 * Validate chart data structure
 * @param {Array} data - Chart data to validate
 * @returns {boolean} True if data is valid
 */
export const validateChartData = (data) => {
  if (!Array.isArray(data)) {
    console.warn('Chart data must be an array');
    return false;
  }
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    if (!item || typeof item !== 'object') {
      console.warn(`Chart data item at index ${i} is not an object`);
      return false;
    }
    
    if (!item.date || typeof item.date !== 'string') {
      console.warn(`Chart data item at index ${i} missing valid date`);
      return false;
    }
    
    if (typeof item.score !== 'number' && typeof item.score !== 'string') {
      console.warn(`Chart data item at index ${i} missing valid score`);
      return false;
    }
    
    const score = Number(item.score);
    if (isNaN(score) || score < 0 || score > 10) {
      console.warn(`Chart data item at index ${i} has invalid score: ${item.score}`);
      return false;
    }
  }
  
  return true;
};

/**
 * Fill missing dates in chart data with zero scores
 * @param {Array} data - Existing chart data
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Data with filled gaps
 */
export const fillMissingDates = (data = [], startDate, endDate) => {
  if (!startDate || !endDate) {
    return data;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const existingDates = new Set(data.map(item => item.date));
  const filledData = [...data];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    
    if (!existingDates.has(dateString)) {
      filledData.push({
        date: dateString,
        score: 0,
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Sort by date
  return filledData.sort((a, b) => new Date(a.date) - new Date(b.date));
};