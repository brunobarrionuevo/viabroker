import { describe, it, expect } from 'vitest';

describe('Facebook/Instagram Credentials Validation', () => {
  it('should have FACEBOOK_APP_ID configured', () => {
    const appId = process.env.FACEBOOK_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).not.toBe('');
    expect(appId).toBe('1601210811019992');
  });

  it('should have FACEBOOK_APP_SECRET configured', () => {
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    expect(appSecret).toBeDefined();
    expect(appSecret).not.toBe('');
    // Verificar que tem o formato correto (32 caracteres hexadecimais)
    expect(appSecret?.length).toBe(32);
  });

  it('should have INSTAGRAM_APP_ID configured', () => {
    const appId = process.env.INSTAGRAM_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).not.toBe('');
    expect(appId).toBe('1198664979040745');
  });

  it('should have INSTAGRAM_APP_SECRET configured', () => {
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    expect(appSecret).toBeDefined();
    expect(appSecret).not.toBe('');
    // Verificar que tem o formato correto (32 caracteres hexadecimais)
    expect(appSecret?.length).toBe(32);
  });

  it('should be able to construct valid Instagram OAuth URL', () => {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = 'https://www.viabroker.app/api/oauth/instagram/callback';
    const scope = 'instagram_business_basic,instagram_business_content_publish';
    
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    expect(authUrl).toContain('client_id=1198664979040745');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('scope=');
  });
});
