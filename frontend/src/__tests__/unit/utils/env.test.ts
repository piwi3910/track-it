import { env, isDev, isProd, isTest } from '../../../utils/env';

describe('Environment utilities', () => {
  describe('env object', () => {
    it('should have VITE_API_URL with default value', () => {
      expect(env.VITE_API_URL).toBeDefined();
      expect(typeof env.VITE_API_URL).toBe('string');
    });

    it('should have MODE property', () => {
      expect(env.MODE).toBeDefined();
      expect(typeof env.MODE).toBe('string');
    });

    it('should have BASE_URL property', () => {
      expect(env.BASE_URL).toBeDefined();
      expect(typeof env.BASE_URL).toBe('string');
    });

    it('should have DEBUG property as boolean', () => {
      expect(typeof env.DEBUG).toBe('boolean');
    });

    it('should set DEBUG to true when MODE is development', () => {
      // Since we're in test mode, we can't directly test this,
      // but we can verify the logic by checking that DEBUG is based on MODE
      const expectedDebug = env.MODE === 'development';
      expect(env.DEBUG).toBe(expectedDebug);
    });
  });

  describe('environment flags', () => {
    it('should correctly identify development mode', () => {
      const result = isDev;
      expect(typeof result).toBe('boolean');
      expect(result).toBe(env.MODE === 'development');
    });

    it('should correctly identify production mode', () => {
      const result = isProd;
      expect(typeof result).toBe('boolean');
      expect(result).toBe(env.MODE === 'production');
    });

    it('should correctly identify test mode', () => {
      const result = isTest;
      expect(typeof result).toBe('boolean');
      expect(result).toBe(env.MODE === 'test');
    });

    it('should have only one environment flag as true', () => {
      const flags = [isDev, isProd, isTest];
      const trueFlags = flags.filter(flag => flag === true);
      expect(trueFlags.length).toBeLessThanOrEqual(1);
    });
  });
});