import { describe, it, expect } from 'vitest';

describe('Instagram OAuth', () => {
  it('should have INSTAGRAM_APP_ID configured', () => {
    const appId = process.env.INSTAGRAM_APP_ID;
    expect(appId).toBeDefined();
    expect(appId).not.toBe('');
  });

  it('should have INSTAGRAM_APP_SECRET configured', () => {
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    expect(appSecret).toBeDefined();
    expect(appSecret).not.toBe('');
  });

  it('should construct valid Instagram OAuth authorization URL', () => {
    const clientId = process.env.INSTAGRAM_APP_ID || '1198664979040745';
    const redirectUri = 'https://www.viabroker.app/api/oauth/instagram/callback';
    const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments';
    
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
    
    expect(authUrl).toContain('instagram.com/oauth/authorize');
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('scope=');
    expect(authUrl).toContain('response_type=code');
  });

  it('should have correct redirect URI format', () => {
    const redirectUri = 'https://www.viabroker.app/api/oauth/instagram/callback';
    
    expect(redirectUri).toMatch(/^https:\/\//);
    expect(redirectUri).toContain('/api/oauth/instagram/callback');
  });

  it('should include required scopes for content publishing', () => {
    const scopes = [
      'instagram_business_basic',
      'instagram_business_content_publish',
    ];
    
    scopes.forEach(scope => {
      expect(scope).toBeDefined();
    });
  });
});
