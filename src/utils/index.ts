/**
 * Generate random id.
 * @param {number} length - Desired ID length.
 * @return {string} Generated ID.
 */

export const generateRandomId = (length: number): string => {
  return Math.random().toString(36).substring(2, 5)
}
