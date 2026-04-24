import * as Keychain from 'react-native-keychain';

const SERVICE_KEY = 'com.vitalsync.tokens';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const TokenManager = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Keychain.setGenericPassword(
      'tokens',
      JSON.stringify({ accessToken, refreshToken }),
      { service: SERVICE_KEY },
    );
  },

  async getTokens(): Promise<Tokens | null> {
    const result = await Keychain.getGenericPassword({ service: SERVICE_KEY });
    if (!result) return null;
    return JSON.parse(result.password) as Tokens;
  },

  async getAccessToken(): Promise<string | null> {
    const tokens = await TokenManager.getTokens();
    return tokens?.accessToken ?? null;
  },

  async getRefreshToken(): Promise<string | null> {
    const tokens = await TokenManager.getTokens();
    return tokens?.refreshToken ?? null;
  },

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE_KEY });
  },
};
