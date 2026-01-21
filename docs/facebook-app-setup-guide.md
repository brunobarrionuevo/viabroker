# Guia de Configuração do Facebook App para ViaBroker

Este guia explica como criar e configurar um Facebook App para permitir a publicação direta de anúncios de imóveis no Facebook e Instagram.

## Pré-requisitos

1. Uma conta no Facebook
2. Uma Página do Facebook (não perfil pessoal)
3. Uma conta Business do Instagram vinculada à Página do Facebook (para publicar no Instagram)

## Passo 1: Criar o Facebook App

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Clique em **"Meus Apps"** no canto superior direito
3. Clique em **"Criar App"**
4. Selecione **"Negócios"** como tipo de app
5. Preencha:
   - **Nome do App**: ViaBroker (ou nome da sua empresa)
   - **Email de contato**: seu email
6. Clique em **"Criar App"**

## Passo 2: Configurar Produtos

Após criar o app, você precisa adicionar os produtos necessários:

### Facebook Login
1. No painel do app, clique em **"Adicionar Produto"**
2. Encontre **"Facebook Login"** e clique em **"Configurar"**
3. Selecione **"Web"**
4. Em **"URIs de Redirecionamento OAuth Válidos"**, adicione:
   ```
   https://www.viabroker.app/api/oauth/facebook/callback
   ```
5. Salve as alterações

### Instagram Graph API (para publicar no Instagram)
1. Clique em **"Adicionar Produto"**
2. Encontre **"Instagram Graph API"** e clique em **"Configurar"**

## Passo 3: Configurar Permissões

Vá em **"Permissões e Recursos"** e solicite as seguintes permissões:

### Para Facebook:
- `pages_show_list` - Ver lista de páginas
- `pages_read_engagement` - Ler engajamento das páginas
- `pages_manage_posts` - Publicar na página

### Para Instagram:
- `instagram_basic` - Acesso básico ao Instagram
- `instagram_content_publish` - Publicar conteúdo no Instagram

## Passo 4: Obter Credenciais

1. Vá em **"Configurações"** > **"Básico"**
2. Copie o **App ID** (ID do Aplicativo)
3. Clique em **"Mostrar"** ao lado de **Chave Secreta do App** e copie

## Passo 5: Configurar na ViaBroker

Forneça as seguintes credenciais para configurar na plataforma:

| Variável | Descrição |
|----------|-----------|
| `FACEBOOK_APP_ID` | ID do Aplicativo do Facebook |
| `FACEBOOK_APP_SECRET` | Chave Secreta do Aplicativo |

## Passo 6: Verificação do App (Produção)

Para usar o app em produção com outros usuários:

1. Vá em **"Verificação do App"**
2. Complete a verificação de negócios
3. Solicite aprovação das permissões necessárias
4. Aguarde a revisão do Facebook (pode levar alguns dias)

## Notas Importantes

- **Modo de Desenvolvimento**: Enquanto o app está em desenvolvimento, apenas administradores e testadores podem usá-lo
- **Conta Business do Instagram**: O Instagram só permite publicação via API para contas Business vinculadas a uma Página do Facebook
- **Limites de Taxa**: O Facebook tem limites de requisições por hora. Evite publicar muitos posts em sequência

## Suporte

Se tiver dúvidas durante a configuração, entre em contato com o suporte da ViaBroker.
