# Plataforma Imobiliária - TODO

## Fase 1: Estrutura de Banco de Dados
- [x] Tabela de Imobiliárias/Empresas (tenants)
- [x] Tabela de Corretores (usuários do sistema)
- [x] Tabela de Imóveis
- [x] Tabela de Leads/Clientes
- [x] Tabela de Interações (histórico de contatos)
- [x] Tabela de Agendamentos (visitas)
- [ ] Tabela de Planos de Assinatura
- [x] Tabela de Configurações do Site

## Fase 2: Backend - APIs
- [x] CRUD de Imóveis (criar, listar, editar, excluir)
- [x] CRUD de Leads/Clientes
- [x] CRUD de Agendamentos
- [x] API de Busca de Imóveis (filtros avançados)
- [x] API de Dashboard (estatísticas)
- [x] API de Upload de Imagens (S3)
- [x] Geração de Descrições com IA

## Fase 3: Frontend - Painel do Cliente (Dashboard/CRM)
- [x] Layout do Dashboard com sidebar
- [x] Página de Listagem de Imóveis
- [x] Formulário de Cadastro/Edição de Imóvel
- [x] Página de Leads/CRM
- [x] Página de Agendamentos/Calendário
- [x] Dashboard com métricas e gráficos
- [x] Configurações do Site/Perfil

## Fase 4: Frontend - Site Público do Corretor
- [x] Landing Page pública do corretor/imobiliária
- [x] Página de listagem de imóveis (com filtros)
- [x] Página de detalhes do imóvel
- [x] Formulário de contato/lead capture
- [ ] Integração WhatsApp

## Fase 5: Funcionalidades Avançadas
- [x] Integração com portais imobiliários (XML)
- [ ] Geração automática de posts para redes sociais
- [ ] Relatórios avançados
- [ ] Multi-idioma

## Testes
- [x] Testes unitários das APIs (properties, leads, appointments, company, siteSettings)

## Correções Solicitadas
- [x] Cadastro flexível: pessoa física (CPF) ou pessoa jurídica (CNPJ)
- [x] Corrigir bug que impede finalizar o cadastro

## Melhorias Solicitadas (Nova Iteração)
- [x] Validação completa de CPF com algoritmo de dígitos verificadores
- [x] Validação completa de CNPJ com algoritmo de dígitos verificadores
- [x] Rejeição de números inválidos conhecidos (sequências repetidas)
- [x] Formatação de moedas para preços (R$ 1.234.567,89)
- [x] Integração com API dos Correios (ViaCEP) para preenchimento automático de endereço
- [x] Armazenar CPF/CNPJ apenas com dígitos no banco de dados

## Correções e Melhorias (Nova Iteração)
- [x] Corrigir erro de inserção de imóveis (valores monetários formatados não aceitos pelo banco)
- [x] Criar tabela de fotos de imóveis (property_images)
- [x] Implementar upload de até 20 fotos por imóvel
- [x] Implementar campo de vídeo do imóvel (URL do YouTube/Vimeo)
- [x] Exibir galeria de fotos na página de detalhes do imóvel

## Galeria Pública de Imóveis
- [x] API pública para buscar imagens do imóvel
- [x] Carrossel de fotos com navegação e miniaturas
- [x] Player de vídeo incorporado (YouTube/Vimeo)
- [x] Exibição responsiva da galeria

## Correções Urgentes
- [x] Botão de incluir fotos não aparece no formulário de cadastro (corrigido - link para gerenciar fotos aparece na edição)
- [x] Erro ao finalizar o cadastro de imóveis (corrigido - valores monetários e videoUrl)

## Página de Exibição do Imóvel
- [x] Redesenhar página pública de detalhes do imóvel
- [x] Galeria de fotos com navegação e zoom
- [x] Player de vídeo incorporado
- [x] Informações detalhadas do imóvel (características, valores, localização)
- [x] Mapa de localização integrado (link para Google Maps)
- [x] Formulário de contato/interesse
- [x] Botão de WhatsApp
- [x] Design responsivo e profissional
## Melhorias de Listagem e Integração

- [x] Exibir foto principal na listagem de imóveis (cards com imagem)
- [x] Integração com portais imobiliários (geração de XML)
- [x] Formato XML compatível com ZAP, Viva Real, OLX
- [x] Endpoint para download do XML
- [x] Página de Integrações no dashboard

## Correções Urgentes (Nova Iteração)
- [x] Página de visualização do imóvel não exibe fotos e detalhes profissionais (verificado - está funcionando)

- [x] Imagem de capa não aparece na listagem de imóveis (verificado - imóvel não tem fotos cadastradas, sistema funciona corretamente)

## Correções Urgentes (Site Publicado)
- [x] Imagem de capa não aparece na listagem de imóveis do dashboard (corrigido - API atualizada para retornar mainImageUrl)
- [x] Página de exibição do imóvel não funciona corretamente (verificado - está funcionando)


## Site Externo Personalizado do Corretor/Imobiliária
- [x] Atualizar schema do banco para campos de personalização (cores, logo, favicon, capa, domínio)
- [x] Criar API para salvar e buscar configurações de personalização
- [x] Página de configurações de personalização no dashboard (cores, logo, favicon, capa)
- [x] Sistema de domínio personalizado (slug gratuito + opção de domínio próprio)
- [x] Filtros avançados de busca (tipo, finalidade, preço, quartos, bairro, cidade)
- [x] Layout do site público com cores e imagens personalizáveis
- [x] Aplicar tema dinâmico baseado nas configurações do corretor
- [x] Header com logo e navegação personalizados
- [x] Hero section com imagem de capa personalizada
- [x] Seção de busca com filtros avançados
- [x] Listagem de imóveis com paginação
- [x] Footer com informações de contato do corretor


## Upload de Imagens para Personalização do Site
- [x] Criar endpoint de upload para logo do site
- [x] Criar endpoint de upload para favicon
- [x] Criar endpoint de upload para imagem de capa (hero)
- [x] Atualizar página de personalização com componentes de upload
- [x] Preview das imagens após upload


## Correções Site do Corretor
- [x] Favicon não aparece na aba do site do corretor (corrigido - useEffect para atualizar favicon dinamicamente)
- [x] Slug do domínio temporário deve usar o nome da imobiliária/corretor (corrigido - slug gerado automaticamente a partir do nome)
- [x] Implementar captura de leads no site público do corretor (implementado - formulário completo com nome, email, telefone e mensagem)


## Rebranding: ImobiPro para Brokvia
- [x] Copiar logo para o projeto
- [x] Substituir todas as referências de ImobiPro por Brokvia
- [x] Atualizar logo em todos os componentes
- [x] Atualizar título e metadados da aplicação


## Painel Administrador Master
- [x] Criar tabela de administradores master no banco de dados
- [x] Criar tabela de assinaturas com status e histórico
- [x] Implementar autenticação master independente (senha master)
- [x] Dashboard master com métricas gerais (total clientes, assinaturas ativas, receita)
- [x] Listagem de todos os clientes (corretores/imobiliárias)
- [x] Ativar/desativar clientes
- [x] Gerenciamento de planos e preços
- [x] Visualização e controle de assinaturas
- [x] Histórico de pagamentos
- [x] Integração com Stripe para pagamentos recorrentes
- [x] Logs de atividades do sistema


## Configuração Inicial Admin Master
- [x] Criar script para gerar usuário admin master inicial


## Sistema de Autenticação Própria
- [x] Atualizar schema do banco para usuários próprios (email, senha hash, confirmação)
- [x] Adicionar campos de trial (trialStartDate, trialEndDate, isTrialExpired)
- [x] Criar sistema de envio de emails (confirmação de conta)
- [x] Implementar endpoint de registro manual
- [x] Implementar endpoint de login com email/senha
- [x] Implementar login com Google OAuth
- [x] Criar página de confirmação de email
- [x] Criar página de login personalizada
- [x] Criar página de cadastro personalizada
- [x] Implementar lógica de 7 dias de trial gratuito
- [x] Bloquear acesso após expiração do trial sem assinatura
- [x] Criar página de escolha de plano após trial


## Correção de Links de Cadastro/Login
- [x] Corrigir botão "Começar Gratuitamente" na Home para ir para /cadastro
- [x] Corrigir botão "Acessar Dashboard" para ir para /login
- [x] Verificar outros links que redirecionam para OAuth da Manus


## Configuração de Email SMTP
- [x] Implementar serviço de email com Nodemailer
- [x] Criar templates de email HTML para confirmação
- [x] Solicitar credenciais SMTP ao usuário
- [x] Testar envio de emails de confirmação


## Reenvio de Email de Confirmação
- [x] Criar endpoint de reenvio de email de confirmação
- [x] Adicionar botão/link de reenvio na página de login
- [x] Criar página dedicada para solicitar reenvio


## Correção da Verificação de Email
- [x] Diagnosticar problema na confirmação de email (colunas faltando no banco + URL errada)
- [x] Corrigir endpoint/página de verificação (adicionadas colunas + URL corrigida)


## Correção do Redirecionamento Após Login
- [x] Corrigir fluxo de login para redirecionar ao dashboard após autenticação bem-sucedida (integrado cookie de sessão com sistema existente)


## Melhorias Painel Master e Correção de Vídeos
- [x] Acesso completo aos dados pessoais dos clientes (PF e PJ)
- [x] Visualização de todos os imóveis cadastrados por cliente
- [x] Visualização de todos os leads de cada cliente
- [x] Funcionalidade de migração de planos no painel master
- [x] Corrigir erro de salvamento de links YouTube/Vimeo nos imóveis (adicionado videoUrl ao endpoint update)
- [x] Testar exibição de vídeos na página de demonstração do imóvel (componente suporta YouTube e Vimeo)


## Correções Urgentes Reportadas
- [x] Erro ao salvar link do vídeo YouTube no formulário de imóveis (verificado - está funcionando)
- [x] Painel master não exibe alterações/dados dos clientes corretamente (implementado MasterClientDetail)
- [x] Login com Google dando erro 404 - implementar OAuth direto na plataforma (implementado Google OAuth)


## Correções Painel Master (Nova Iteração)
- [x] Corrigir visualização de dados dos clientes no painel master
- [x] Adicionar ações para consultar todos os dados do cliente (imóveis, leads, etc.)
- [x] Melhorar contraste de cores para facilitar leitura
- [x] Organizar exibição dos dados de forma clara e estruturada


## Correção Urgente - Edição de Imóveis
- [x] Corrigir erro ao acessar página de edição de imóveis (/dashboard/properties/:id)


## Correções e Melhorias (12/01/2026)
- [x] Corrigir erro ao salvar descrição gerada com IA no formulário de imóveis (campo estado não carregava corretamente)
- [x] Corrigir exibição de finalidade no painel master (mostra "aluguel" ao invés de "venda")
- [x] Criar plano de cortesia no painel admin master (funcionalidades completas, tempo indeterminado, controlável pelo admin)


## Correção Vídeo YouTube (13/01/2026)
- [x] Corrigir exibição do vídeo do YouTube na página de detalhes do imóvel (só aparece galeria de fotos)

## Ajustes Galeria de Imóveis (13/01/2026)
- [x] Mover botão de vídeo para última posição na barra de thumbnails
- [x] Corrigir navegação lateral das imagens com clique (setas sempre visíveis)

## Gestos de Swipe na Galeria (13/01/2026)
- [x] Implementar navegação por gestos de swipe na galeria de imóveis para dispositivos móveis

## Melhorias Galeria e Validações (13/01/2026)
- [x] Navegação por setas do teclado na galeria de imóveis
- [x] Modal de imagem com swipe e setas do teclado
- [x] Indicador visual de swipe na galeria
- [x] Zoom com pinça nas imagens da galeria
- [x] Formatação de telefone (xx) XXXXX-XXXX em todo o site
- [x] Validação de CPF/CNPJ no cadastro inicial com mensagem de erro


## Mapa, Filtros e Correções (13/01/2026)
- [x] Adicionar campo para ocultar/mostrar endereço do imóvel no cadastro
- [x] Implementar mapa do Google com localização do imóvel na página de exibição
- [x] Adicionar filtros avançados: quartos, banheiros, vagas, bairro, cidade, estado, área
- [x] Corrigir bug do filtro que não mostra imóveis ao voltar para "todos"
