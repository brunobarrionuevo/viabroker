# Facebook/Instagram API - Notas de Integração

## Requisitos para Publicação no Facebook

### Permissões Necessárias
- `pages_manage_engagement`
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_read_user_engagement`
- `publish_video` (se publicar vídeos)

### Tarefas do Usuário na Página
O usuário deve ter permissão para:
- `CREATE_CONTENT`
- `MANAGE`
- `MODERATE`

### Endpoints

#### Publicar Post de Texto
```
POST https://graph.facebook.com/v24.0/{page_id}/feed
{
  "message": "texto do post",
  "link": "url opcional",
  "published": true/false,
  "scheduled_publish_time": "unix_timestamp" // se published=false
}
```

#### Publicar Foto
```
POST https://graph.facebook.com/v24.0/{page_id}/photos
{
  "url": "url_da_foto",
  "message": "legenda opcional"
}
```

### Fluxo de Autenticação
1. Usuário faz login com Facebook
2. App solicita permissões necessárias
3. Recebe User Access Token
4. Troca por Page Access Token
5. Usa Page Access Token para publicar

## Instagram Content Publishing API

### Requisitos
- Conta Instagram Business (não pessoal)
- Página do Facebook conectada à conta Instagram
- App aprovado para Instagram Content Publishing

### Fluxo de Publicação
1. Upload da mídia para container
2. Publicação do container

### Endpoints

#### Criar Container de Mídia
```
POST https://graph.facebook.com/v24.0/{ig_user_id}/media
{
  "image_url": "url_da_imagem",
  "caption": "legenda do post"
}
```

#### Publicar Container
```
POST https://graph.facebook.com/v24.0/{ig_user_id}/media_publish
{
  "creation_id": "container_id"
}
```

## Considerações Importantes

1. **App Review**: O app precisa passar por revisão da Meta para usar essas permissões em produção
2. **Business Verification**: A empresa precisa ser verificada
3. **Rate Limits**: Existem limites de requisições por hora
4. **Apenas Páginas/Business**: Não é possível publicar em perfis pessoais via API
