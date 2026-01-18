# Análise do Sistema de Domínios Personalizados - Viabroker

## Resumo Executivo

O sistema de domínios personalizados da Viabroker está **parcialmente automatizado**. O fluxo funciona corretamente para o domínio `brunobarrionuevo.com.br`, mas existem **etapas manuais** que precisam ser executadas para cada novo cliente.

---

## Fluxo Atual (Para Cada Novo Cliente)

### Etapas Automatizadas ✅

1. **Interface de Configuração no Dashboard**
   - Cliente acessa: Dashboard → Personalização → Aba "Domínio"
   - Cliente digita seu domínio personalizado (ex: `www.meusite.com.br`)
   - Sistema salva no banco de dados (`site_settings.customDomain`)

2. **Verificação de DNS**
   - Botão "Verificar Status" consulta DNS via API pública do Cloudflare
   - Se registros DNS existem, marca `domainVerified = true`
   - Limpa cache do middleware automaticamente

3. **Middleware de Roteamento**
   - Detecta domínio via header `X-Original-Host` (enviado pelo Cloudflare Worker)
   - Busca empresa correspondente no banco de dados
   - Redireciona internamente para `/site/:slug`
   - Cache de 5 minutos para evitar consultas repetidas

4. **Renderização do Site**
   - Injeta script de redirect no HTML para sincronizar URL do navegador
   - Carrega configurações personalizadas (cores, logo, etc.)
   - Exibe imóveis do corretor

### Etapas MANUAIS ❌ (Requerem Intervenção)

1. **Configuração DNS no Cloudflare**
   - Cada novo domínio precisa ter uma zona criada no Cloudflare
   - Registros DNS precisam ser configurados manualmente
   - Atualmente feito via painel do Cloudflare

2. **Configuração do Cloudflare Worker**
   - O Worker precisa ter a rota configurada para cada novo domínio
   - Atualmente: `brunobarrionuevo.com.br/*` → Worker
   - Cada novo domínio precisa de uma nova rota

3. **Certificado SSL**
   - Cloudflare gera automaticamente, mas precisa da zona configurada

---

## Arquitetura Atual

```
Cliente (navegador)
       │
       ▼
┌──────────────────┐
│ Cloudflare DNS   │ ◄── Zona configurada manualmente
│ (brunobarrionuevo│
│  .com.br)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Cloudflare Worker│ ◄── Rota configurada manualmente
│ (proxy reverso)  │
│ Adiciona header: │
│ X-Original-Host  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Render           │
│ (viabroker.      │
│  onrender.com)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Express Server   │
│ customDomain     │
│ Middleware       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ React App        │
│ /site/:slug      │
└──────────────────┘
```

---

## O Que Precisa Ser Automatizado

### Opção 1: API do Cloudflare (Recomendado)

Criar endpoints na plataforma que usam a API do Cloudflare para:

1. **Criar zona DNS automaticamente**
   ```
   POST /api/admin/domains/create-zone
   - Cria zona no Cloudflare
   - Configura registros DNS (CNAME para viabroker.onrender.com)
   - Ativa SSL
   ```

2. **Configurar rota do Worker automaticamente**
   ```
   POST /api/admin/domains/configure-worker
   - Adiciona rota: dominio.com.br/* → Worker
   ```

3. **Verificar e ativar domínio**
   ```
   POST /api/admin/domains/activate
   - Verifica propagação DNS
   - Marca como verificado no banco
   ```

### Opção 2: Wildcard Domain (Alternativa)

Usar um domínio wildcard no Cloudflare:
- `*.clientes.viabroker.app` → Worker
- Cada cliente recebe: `empresa.clientes.viabroker.app`
- Não requer configuração manual por cliente

**Desvantagem:** Clientes não podem usar domínio próprio

### Opção 3: Cloudflare for SaaS (Enterprise)

Solução enterprise do Cloudflare para multi-tenant:
- Automatiza tudo via API
- Custo: ~$2/mês por domínio ativo

---

## Status Atual por Componente

| Componente | Status | Automatizado? |
|------------|--------|---------------|
| Interface de configuração | ✅ Funcionando | ✅ Sim |
| Salvamento no banco | ✅ Funcionando | ✅ Sim |
| Verificação DNS | ✅ Funcionando | ✅ Sim |
| Middleware de roteamento | ✅ Funcionando | ✅ Sim |
| Renderização do site | ✅ Funcionando | ✅ Sim |
| Criação de zona Cloudflare | ⚠️ Manual | ❌ Não |
| Configuração de registros DNS | ⚠️ Manual | ❌ Não |
| Rota do Worker | ⚠️ Manual | ❌ Não |
| Certificado SSL | ✅ Auto (Cloudflare) | ✅ Sim |

---

## Recomendação

Para **automatizar completamente** o fluxo, implementar:

1. **Endpoint de criação de zona** usando API Cloudflare
2. **Endpoint de configuração de Worker** usando API Cloudflare
3. **Fluxo no dashboard** que chama esses endpoints quando cliente salva domínio

**Credenciais necessárias:**
- `CLOUDFLARE_API_TOKEN` - Token com permissões de Zone e Worker
- `CLOUDFLARE_ACCOUNT_ID` - ID da conta Cloudflare
- `CLOUDFLARE_WORKER_ID` - ID do Worker de proxy

---

## Conclusão

O sistema está **80% automatizado**. As partes que funcionam automaticamente são:
- Configuração pelo cliente
- Verificação de DNS
- Roteamento e renderização

As partes que ainda precisam de intervenção manual são:
- Criação de zona no Cloudflare
- Configuração de rota do Worker

Para cada novo cliente que quiser usar domínio próprio, você (admin) precisa:
1. Criar zona no Cloudflare para o domínio
2. Adicionar rota do Worker para o domínio
3. Instruir cliente a apontar DNS para Cloudflare (nameservers)

