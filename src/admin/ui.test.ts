import { describe, it, expect } from 'vitest';
import { AdminPageLayout, formatISK, formatDuration, AdminStatsData, CharacterRevenue } from './ui'; // Importing all exports to ensure they are testable if needed

describe('Admin UI Helpers', () => {
  describe('formatISK', () => {
    it('should format whole numbers correctly', () => {
      expect(formatISK(1234567)).toBe('1,234,567.00 ISK');
    });
    it('should format numbers with decimals correctly', () => {
      expect(formatISK(12345.67)).toBe('12,345.67 ISK');
    });
    it('should format numbers that need rounding to two decimal places', () => {
      expect(formatISK(123.456)).toBe('123.46 ISK'); // .456 rounds up to .46
      expect(formatISK(123.454)).toBe('123.45 ISK'); // .454 rounds down to .45
    });
    it('should format zero correctly', () => {
      expect(formatISK(0)).toBe('0.00 ISK');
    });
    it('should handle large numbers with multiple commas', () => {
      expect(formatISK(1234567890.12)).toBe('1,234,567,890.12 ISK');
    });
    it('should handle NaN and return 0.00 ISK or a defined error string', () => {
      // The current implementation of formatISK returns '0.00 ISK' for NaN
      expect(formatISK(NaN)).toBe('0.00 ISK');
    });
    it('should handle negative numbers (though ISK is typically positive)', () => {
        expect(formatISK(-5000)).toBe('-5,000.00 ISK');
    });
  });

  describe('formatDuration', () => {
    it('should format null or NaN correctly', () => {
      expect(formatDuration(null)).toBe('N/A');
      expect(formatDuration(NaN)).toBe('N/A');
    });
    it('should format negative numbers as N/A', () => {
        expect(formatDuration(-100)).toBe('N/A');
    });
    it('should format 0 seconds', () => {
      expect(formatDuration(0)).toBe('0s');
    });
    it('should format just seconds correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });
    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3599)).toBe('59m 59s'); // 59 minutes, 59 seconds
    });
    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3600)).toBe('1h 0m 0s');
      expect(formatDuration(3661)).toBe('1h 1m 1s'); // 1 hour, 1 minute, 1 second
      expect(formatDuration(86399)).toBe('23h 59m 59s'); // 23 hours, 59 minutes, 59 seconds
    });
    it('should format days, hours, minutes, and seconds', () => {
      expect(formatDuration(86400)).toBe('1d 0h 0m 0s');
      expect(formatDuration(90000)).toBe('1d 1h 0m 0s'); // 1 day, 1 hour
      expect(formatDuration(90061)).toBe('1d 1h 1m 1s'); // 1 day, 1 hour, 1 minute, 1 second
    });
    it('should omit zero parts correctly', () => {
      expect(formatDuration(86400)).toBe('1d 0h 0m 0s'); // All parts present due to days
      expect(formatDuration(3600)).toBe('1h 0m 0s');   // Omits days
      expect(formatDuration(60)).toBe('1m 0s');      // Omits days and hours
      expect(formatDuration(5)).toBe('5s');        // Omits days, hours, and minutes
    });
     it('should handle very small fractional seconds (floor behavior)', () => {
      expect(formatDuration(0.5)).toBe('0s');
    });
  });

  // Basic check to ensure AdminPageLayout can be called (not testing rendering details here)
  describe('AdminPageLayout', () => {
    it('should not throw when called with valid stats', () => {
      const mockStats: AdminStatsData = {
        totalOpenContracts: 0,
        totalInProgressContracts: 0,
        finishedToday: 0,
        finishedThisWeek: 0,
        finishedThisMonth: 0,
        revenueToday: 0,
        revenueThisWeek: 0,
        revenueThisMonth: 0,
        revenueByCharacterThisMonth: [],
        avgCompletionTimeThisMonth: null,
        avgAcceptanceTimeThisMonth: null,
        avgTotalTimeThisMonth: null,
      };
      expect(() => AdminPageLayout(mockStats)).not.toThrow();
    });
  });
});
