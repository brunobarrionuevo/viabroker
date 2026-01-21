import { Router } from 'express';

const router = Router();

// Endpoint para iniciar o fluxo de OAuth do Instagram
router.get('/api/oauth/instagram', (req, res) => {
  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/instagram/callback`;
  const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments';
  
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${req.query.userId || ''}`;
  
  res.redirect(authUrl);
});

// Callback do OAuth do Instagram
router.get('/api/oauth/instagram/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  if (error) {
    console.error('[Instagram OAuth] Error:', error, error_description);
    return res.redirect('/marketing?error=' + encodeURIComponent(error_description as string || 'Erro ao conectar Instagram'));
  }
  
  if (!code) {
    return res.redirect('/marketing?error=Código de autorização não recebido');
  }
  
  try {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/oauth/instagram/callback`;
    
    // Trocar o código por um token de acesso
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code as string,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Instagram OAuth] Token exchange failed:', errorData);
      return res.redirect('/marketing?error=Falha ao obter token de acesso');
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string;
      user_id: string;
    };
    
    // Obter token de longa duração
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
    );
    
    let finalToken = tokenData.access_token;
    let expiresIn = 3600; // 1 hora padrão
    
    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json() as {
        access_token: string;
        token_type: string;
        expires_in: number;
      };
      finalToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in;
    }
    
    // Obter informações do usuário do Instagram
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalToken}`
    );
    
    let username = 'instagram_user';
    let instagramUserId = tokenData.user_id;
    
    if (userResponse.ok) {
      const userData = await userResponse.json() as {
        id: string;
        username: string;
        account_type: string;
      };
      username = userData.username;
      instagramUserId = userData.id;
    }
    
    // Armazenar o token no sessionStorage via redirect com parâmetros
    // O frontend vai capturar esses dados e salvar via API
    const successUrl = `/marketing?instagram_connected=true&instagram_user=${encodeURIComponent(username)}&instagram_token=${encodeURIComponent(finalToken)}&instagram_user_id=${encodeURIComponent(instagramUserId)}&expires_in=${expiresIn}`;
    
    res.redirect(successUrl);
  } catch (error) {
    console.error('[Instagram OAuth] Error:', error);
    res.redirect('/marketing?error=Erro interno ao processar autenticação');
  }
});

export default router;
