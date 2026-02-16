/**
 * Record Formatter Utility
 * Converts flexible time and distance formats to standard formats
 * Time: "01.23.45s" or "1:23:45" or "83" (seconds) → "HH.MM.SS"
 * Distance: "15.50m" or "15.50" or "15,50" → "XX.XXm"
 */

/**
 * Parse and format time record
 * Accepts: "01.23.45s", "1:23:45", "83" (seconds), "1h23m45s", etc.
 * Returns: "HH.MM.SS"
 * @param {string} input - Time input string
 * @returns {object} {success:boolean, value:string, error:string}
 */
export const formatTimeRecord = (input) => {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Time input must be a string' };
  }

  const trimmed = input.trim().toUpperCase();
  let totalSeconds = 0;

  // Pattern 1: HH:MM:SS or HH.MM.SS
  const timePattern = /^(\d{1,2})[:.\s](\d{2})[:.\s](\d{2})s?$/;
  const timeMatch = trimmed.match(timePattern);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]);

    if (hours > 23 || minutes > 59 || seconds > 59) {
      return { success: false, error: 'Invalid time format: values out of range' };
    }

    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  } else {
    // Pattern 2: Just seconds as number
    const secondsPattern = /^(\d+)\.?(\d{1,2})?s?$/;
    const secondsMatch = trimmed.match(secondsPattern);
    if (secondsMatch) {
      totalSeconds = parseInt(secondsMatch[1]);
      if (secondsMatch[2]) {
        totalSeconds += parseInt(secondsMatch[2]) / 100;
      }
    } else {
      return { success: false, error: 'Invalid time format (use HH.MM.SS, HH:MM:SS, or seconds)' };
    }
  }

  // Convert back to HH.MM.SS format
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}.${String(seconds.toFixed(2)).padStart(5, '0')}`;

  return { success: true, value: formatted };
};

/**
 * Parse and format distance record
 * Accepts: "15.50m", "15.50", "15,50m", etc.
 * Returns: "XX.XXm"
 * @param {string} input - Distance input string
 * @returns {object} {success:boolean, value:string, error:string}
 */
export const formatDistanceRecord = (input) => {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Distance input must be a string' };
  }

  const trimmed = input.trim().toUpperCase();

  // Replace comma with period for European format support
  const normalized = trimmed.replace(',', '.');

  // Pattern: Number with optional decimal and optional 'm' suffix
  const distancePattern = /^(\d+\.?\d{0,2})m?$/;
  const match = normalized.match(distancePattern);

  if (!match) {
    return { success: false, error: 'Invalid distance format (use format like 15.50 or 15.50m)' };
  }

  const value = parseFloat(match[1]);

  if (isNaN(value) || value <= 0) {
    return { success: false, error: 'Distance must be a positive number' };
  }

  // Format to 2 decimal places
  const formatted = `${value.toFixed(2)}m`;

  return { success: true, value: formatted };
};

/**
 * Format record based on event type
 * @param {string} input - Raw record input
 * @param {string} recordFormat - 'time' or 'distance'
 * @returns {object} {success:boolean, value:string, error:string}
 */
export const formatRecord = (input, recordFormat) => {
  if (!recordFormat || !['time', 'distance'].includes(recordFormat)) {
    return { success: false, error: 'Invalid record format type' };
  }

  if (recordFormat === 'time') {
    return formatTimeRecord(input);
  } else {
    return formatDistanceRecord(input);
  }
};

/**
 * Validate record value format
 * @param {string} record - Record value to validate
 * @param {string} recordFormat - 'time' or 'distance'
 * @returns {boolean} true if valid, false otherwise
 */
export const isValidRecordFormat = (record, recordFormat) => {
  if (recordFormat === 'time') {
    const timePattern = /^\d{2}\.\d{2}\.\d{2}(\.?\d{2})?$/;
    return timePattern.test(record);
  } else if (recordFormat === 'distance') {
    const distancePattern = /^\d+\.\d{2}m$/;
    return distancePattern.test(record);
  }
  return false;
};

/**
 * Get record display format hint based on event type
 * @param {string} recordFormat - 'time' or 'distance'
 * @returns {string} Format hint message
 */
export const getRecordFormatHint = (recordFormat) => {
  if (recordFormat === 'time') {
    return 'Format: HH.MM.SS (e.g., 00.01.23 for 1 minute 23 seconds)';
  } else {
    return 'Format: XX.XXm (e.g., 15.50 for 15.50 meters)';
  }
};

export default {
  formatTimeRecord,
  formatDistanceRecord,
  formatRecord,
  isValidRecordFormat,
  getRecordFormatHint
};
