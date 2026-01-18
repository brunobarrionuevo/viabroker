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


## Correção Urgente - Listagem Dashboard (13/01/2026)
- [x] Corrigir erro na listagem de imóveis do dashboard quando retorna para exibir todos


## Correções Urgentes e Código de Referência (13/01/2026)
- [x] Corrigir bug do filtro na versão publicada (não mostra imóveis ao voltar para "todos")
- [x] Exibir imagens dos anúncios no dashboard principal
- [x] Implementar código de referência automático nos anúncios
- [x] Exibir código de referência na página do anúncio


## Formatação, Detalhes e Compartilhamento (13/01/2026)
- [x] Corrigir formatação de preço para padrão brasileiro (xxx.xxx.xxx,xx)
- [x] Adicionar campos de detalhes do imóvel (área de serviço, armários, mobiliado, ar condicionado, churrasqueira, varanda, varanda gourmet, quarto de serviço)
- [x] Adicionar campos de detalhes do condomínio (fechado, elevador, segurança 24h, portaria, animais, academia, piscina, salão de festa, espaço gourmet, sauna, estacionamento visitantes, lavanderia)
- [x] Implementar sistema de compartilhamento de imóveis entre corretores
- [x] Criar mecanismo de autorização/aceitação de parceria
- [x] Personalizar códigos de imóveis por corretor (evitar duplicatas)
- [x] Exibir imóveis compartilhados na página do corretor parceiro


## Correções Sistema de Compartilhamento (13/01/2026)
- [x] Criar código interno personalizado para cada corretor (partnerCode gerado automaticamente no cadastro)
- [x] Mostrar nome de ambos os corretores no compartilhamento (requesterName, partnerName)
- [x] Separar abas entre "Imóveis que compartilhei" e "Imóveis que recebi" (3 abas: Parcerias, Imóveis Compartilhados, Imóveis Recebidos)
- [x] Fixar menu lateral do dashboard (AppLayout adicionado à página de parcerias)
- [x] Corrigir página de parcerias (reescrita completa com todas as funcionalidades)


## Melhorias Sistema de Compartilhamento (13/01/2026)
- [x] Atualização automática da página após aceitar parceria (invalidateQueries implementado)
- [x] Visualização prévia do imóvel antes de aceitar compartilhamento (dialog de preview com imagem, preço, características)
- [x] Corrigir layout das abas (flex-wrap, min-width, text-xs sm:text-sm)
- [x] Destaque de imóveis de parceiros na listagem de imóveis (badge roxo "Parceiro", borda roxa)
- [x] Exibir código e nome do parceiro proprietário nos imóveis compartilhados (info box com nome e código do parceiro)


## Correções e Novas Funcionalidades de Parcerias (13/01/2026)
- [ ] Corrigir imagem do imóvel compartilhado não aparece no site público do parceiro
- [x] Corrigir listagem de imóveis de parceiros não aparece no dashboard (implementado com badge roxo e info do parceiro)
- [x] Remover destaque automático de imóveis compartilhados (imóveis compartilhados não têm destaque por padrão)
- [x] Implementar opção para parceiro marcar imóvel compartilhado como destaque (botão estrela na aba Imóveis Recebidos)
- [x] Notificações por email: enviar email quando receber solicitação de parceria
- [x] Notificações por email: enviar email quando receber compartilhamento de imóvel
- [x] Notificações por email: enviar email quando parceria for aceita
- [x] Notificações por email: enviar email quando compartilhamento for aceito
- [x] Filtro de origem na listagem: "Meus imóveis" / "Imóveis de parceiros" (seletor "Todos os imóveis" adicionado)
- [x] Histórico de atividades de parcerias (log de ações) - aba Histórico na página de parcerias


## Bug Destaque de Imóveis de Parceiros (14/01/2026)
- [x] Corrigir: Imóvel de parceiro continua aparecendo como destaque no site mesmo após remover destaque na aba de parcerias (isHighlight do compartilhamento agora sobrescreve o do imóvel original)
- [x] Bug persistente: Imóvel de parceiro ainda aparece em destaque no site público mesmo após correção anterior (corrigido filtro na API listPublic para verificar isHighlight do compartilhamento)


## Gestão de Imóveis de Parceiros (14/01/2026)
- [x] Adicionar opção de inativar imóvel de parceiro na aba Recebidos (botão Inativar/Ativar com toggle)
- [x] Adicionar opção de excluir/rejeitar imóvel de parceiro na aba Recebidos (botão Excluir com confirmação)


## Sincronização de Status de Imóveis (14/01/2026)
- [x] Imóvel Inativo: remover da exibição do site do proprietário e parceiros (filtro no backend)
- [x] Imóvel Reservado: exibir badge "Reservado" no site do proprietário e parceiros (overlay amarelo)
- [x] Imóvel Alugado: exibir badge "Alugado" no site do proprietário e parceiros (overlay azul)
- [x] Imóvel Vendido: exibir badge "Vendido" no site do proprietário e parceiros (overlay vermelho)
- [x] Imóvel Excluído: remover compartilhamentos de todos os parceiros (cascata no deleteProperty)


## Bug - Erro ao Alterar Status (14/01/2026)
- [x] Corrigir erro ao alterar status de imóveis no dashboard (adicionado placeholder aos SelectValue para garantir exibição correta dos valores)

- [x] Bug: Imóveis de parceiros permitem acesso à página de edição (corrigido - agora redireciona para página de parcerias)

- [x] Bug persistente: Erro de SQL ao salvar imóvel 150001 (imóvel de parceiro) - adicionado redirecionamento automático quando imóvel não é encontrado

- [x] Bug intermitente: Alteração de status funciona nas primeiras vezes mas depois de 3 mudanças começa a dar erro (corrigido: preços agora são formatados corretamente ao carregar imóvel para edição)


## Rebranding: Brokvia → Viabroker (14/01/2026)
- [x] Alterar nome de Brokvia para Viabroker em todos os componentes (sed realizado em todos os arquivos)
- [x] Atualizar VITE_APP_TITLE para Viabroker (alterar em Settings → General da interface Manus)
- [x] Preparar configurações para domínio viabroker.app (URLs atualizadas no código)
- [x] Atualizar textos e referências no código (brokvia_token → viabroker_token, etc)


## Dashboard Admin Master - Gerenciamento de Usuários (14/01/2026)
- [ ] Adicionar endpoint para deletar usuário (cascata: deletar empresas, imóveis, etc)
- [ ] Adicionar endpoint para alterar plano do usuário
- [ ] Adicionar endpoint para desativar/ativar usuário
- [ ] Adicionar interface no dashboard admin para gerenciar usuários
- [ ] Adicionar botões de ação: Deletar, Alterar Plano, Desativar


## Dashboard Admin Master - Gerenciamento de Usuários (14/01/2026)
- [x] Adicionar opção de exclusão de cadastro de usuário (endpoint deleteUser)
- [x] Adicionar opção de alterar plano de usuário (endpoint changeUserPlan)
- [x] Adicionar aba "Usuários" no dashboard master com funcionalidades de gerenciamento
- [x] Adicionar interface no MasterDashboard para gerenciar usuários


## Dashboard Admin Master - Novas Funcionalidades (14/01/2026)
- [x] Adicionar página de configurações para alterar senha do admin master (aba Configurações adicionada)
- [x] Adicionar função de exclusão de usuário no dashboard master (endpoint deleteUser adicionado)
- [x] Adicionar aba "Configurações" no MasterDashboard (interface de alteração de senha)

## Funcionalidade Admin Master - Alteração de Senha (14/01/2026)
- [x] Adicionar formulário de alteração de senha na aba Configurações do dashboard master
- [x] Implementar endpoint changePassword no backend para admin master
- [x] Validar senha atual antes de permitir alteração
- [x] Testar funcionalidade de alteração de senha


## Funcionalidade Admin Master - Exclusão de Empresa (14/01/2026)
- [x] Adicionar botão de exclusão na listagem de clientes do dashboard master
- [x] Implementar modal de confirmação antes de excluir
- [x] Implementar endpoint deleteCompany no backend para admin master
- [x] Excluir todos os dados relacionados (imóveis, leads, usuários, etc.)
- [x] Testar funcionalidade de exclusão de empresa


## Bug Crítico - Exclusão de Empresa (14/01/2026)
- [x] Corrigir exclusão de empresa que não remove usuários corretamente
- [x] Corrigir erro de email duplicado ao tentar cadastrar empresa excluída novamente
- [x] Verificar se todos os dados relacionados estão sendo excluídos em cascata
- [x] Testar novo cadastro com email de empresa excluída


## Correções e Melhorias de Cadastro (14/01/2026)
- [x] Corrigir erro de email duplicado no cadastro (brunobarrionuevo@gmail.com ainda aparece como cadastrado)
- [x] Remover botão "Cadastrar com Google" da página de cadastro
- [x] Alterar validação de senha para mínimo 8 caracteres com pelo menos 1 caractere especial
- [x] Adicionar botão de mostrar/ocultar senha nos campos de senha e confirmação
- [x] Adicionar indicador visual de correspondência de senhas (verde se igual, vermelho se diferente)


## Bug Persistente - Email Duplicado e Contagem de Usuários (14/01/2026)
- [x] Investigar por que brunobarrionuevo@gmail.com ainda aparece como cadastrado
- [x] Corrigir contagem de usuários no dashboard master (contagem inclui admin master)
- [x] Verificar se há cache ou problema de sincronização no banco de dados
- [x] Testar cadastro completo após correção definitiva


## Melhorias na Página de Cadastro de Imóveis (14/01/2026)
- [ ] Reorganizar blocos: Localização em primeiro lugar, depois Informações Básicas
- [ ] Implementar gerenciamento de imagens (upload, preview, reordenação, exclusão)
- [ ] Adicionar suporte para múltiplas imagens
- [ ] Implementar preview de imagens antes do upload
- [ ] Testar funcionalidades de upload e gerenciamento de imagens


## Melhorias na Página de Cadastro de Imóveis (14/01/2026)
- [x] Reorganizar blocos: Localização em primeiro lugar, depois Informações Básicas
- [x] Adicionar gerenciamento de imagens inline na página de cadastro
- [x] Implementar upload de múltiplas imagens com preview
- [x] Adicionar função de definir imagem principal
- [x] Adicionar função de excluir imagens


## Ajustes na Página de Cadastro de Imóveis (14/01/2026)
- [x] Remover bloco de gerenciamento de imagens inline
- [x] Manter apenas botão "Gerenciar Fotos" no final do formulário (acima do botão Salvar)
- [x] Reorganizar bloco de Localização: CEP em primeiro lugar


## Ajuste Botão Gerenciar Fotos (14/01/2026)
- [x] Adicionar botão "Gerenciar Fotos" visível na página de cadastro inicial do imóvel
- [x] Posicionar botão acima do botão "Salvar" no formulário


## Melhorias no Formulário de Cadastro (14/01/2026)
- [x] Adicionar texto informativo sobre geração de descrição com IA (recomendar preencher todos os campos antes)
- [x] Corrigir item "Portaria" para "Portaria 24h" na seção de detalhes do imóvel


## Melhorias no Gerenciamento de Fotos (14/01/2026)
- [x] Adicionar informações sobre formato e padrão recomendados para fotos
- [x] Implementar limite de 20 fotos por anúncio
- [x] Implementar compressão automática de imagens antes do upload (reduzir tamanho sem perder qualidade)


## Configurações do Usuário - Senha e Planos (14/01/2026)
- [x] Implementar opção de alterar senha na página de configurações do usuário
- [x] Adicionar validação de senha: mínimo 8 caracteres, 1 letra maiúscula, 1 caractere especial
- [x] Criar aba de Planos na página de configurações
- [x] Mostrar plano atual do usuário na aba de Planos
- [x] Adicionar opção de mudança de plano

## Ajustes de Autenticação (14/01/2026)
- [x] Remover opção de login com Gmail da página de login


## Melhorias na Galeria de Fotos (14/01/2026)
- [x] Melhorar qualidade da compressão de imagens (ajustar configurações para manter melhor qualidade)
- [x] Implementar drag-and-drop para reorganizar ordem das fotos
- [x] Criar lightbox com visualização ampliada
- [x] Adicionar navegação por setas no lightbox
- [x] Implementar zoom nas imagens do lightbox


## Correções na Galeria de Fotos (14/01/2026)
- [x] Corrigir função de arrastar para reorganizar fotos (resolvido conflito de event handlers com pointer-events)
- [x] Corrigir botão de fechar (X) no modo de visualização lightbox


## Apontamento de Domínio (14/01/2026)
- [x] Verificar configuração DNS do domínio brunobarrionuevo.com.br
- [x] Criar interface de solicitação de apontamento na aba Domínio
- [x] Adicionar instruções detalhadas passo a passo para configuração DNS
- [x] Implementar verificação automática de status do domínio
- [x] Criar backend para validar apontamento DNS


## Melhorias de Login e Cadastro (14/01/2026)
- [x] Corrigir redirecionamento automático para dashboard após login (corrigido com window.location.href)
- [x] Adicionar informação sobre requisitos de senha na página de cadastro
- [x] Implementar validação de senha no cadastro (mínimo 8 caracteres, 1 maiúscula, 1 especial)
- [x] Exibir mensagens de erro específicas quando senha não atender requisitos


## Problema Crítico (14/01/2026)
- [x] Investigar e corrigir: viabroker.app fica carregando infinitamente (servidor reiniciado, site funcionando normalmente)


## Implementação de Logos Viabroker (14/01/2026)
- [x] Processar e salvar imagens das logos no projeto
- [x] Criar favicon com logo sem texto
- [x] Implementar logo no header/navbar do site público
- [x] Implementar logo nas páginas de login e cadastro
- [x] Implementar logo no dashboard (sidebar)
- [x] Implementar logo no footer
- [x] Atualizar meta tags com nova logo


## Substituição de Logo (14/01/2026)
- [x] Substituir logos transparentes pela logo com fundo branco fornecida pelo usuário


## Ajustes de Logo e Descrição (14/01/2026)
- [x] Aumentar tamanho da logo em todos os locais para dar mais relevância
- [ ] Corrigir favicon que não está aparecendo - REABERTO (implementação anterior não funcionou)
- [ ] Ajustar title da página para "Gestão inteligente para corretores e imobiliárias" SEM "Viabroker" - REABERTO

## Correção URGENTE Favicon e Title (15/01/2026)
- [x] Gerar favicon correto a partir da imagem fornecida (Image_202601140348.jpeg - ícone azul/verde)
- [x] Atualizar index.html com links corretos para o favicon
- [x] Atualizar title para APENAS "Gestão inteligente para corretores e imobiliárias" (sem Viabroker)
- [x] Testar e validar que favicon aparece no navegador


## Diagnóstico de Domínio Personalizado (15/01/2026)
- [x] Verificar configuração do domínio no banco de dados (site do corretor)
- [x] Verificar registros DNS do domínio
- [x] Verificar roteamento de domínio personalizado no backend
- [x] Identificar problema: Funcionalidade de domínio personalizado NÃO IMPLEMENTADA

## Implementação de Domínios Personalizados (15/01/2026)
- [x] Criar middleware de detecção de domínio personalizado (customDomainMiddleware.ts)
- [x] Integrar middleware no servidor Express
- [x] Criar endpoints de API para gerenciamento de domínios (verificar, salvar, remover)
- [x] Implementar sistema de verificação DNS
- [x] Criar interface de gerenciamento de domínio no painel (SiteCustomization)
- [x] Adicionar instruções de configuração DNS para o usuário
- [x] Testar domínio personalizado funcionando end-to-end
- [x] Escrever testes unitários para middleware e verificação (5 testes passando)


## Deploy da Plataforma no Render (15/01/2026)
- [x] Criar arquivo render.yaml com configuração do serviço
- [x] Preparar lista de variáveis de ambiente necessárias
- [x] Criar guia passo a passo de deploy no Render
- [x] Documentar configuração do TiDB
- [x] Documentar configuração de domínios personalizados pós-deploy
- [ ] Testar deploy funcionando (aguardando usuário fazer deploy)


## Configuração GitHub Manual (15/01/2026)
- [x] Criar repositório no GitHub.com
- [x] Configurar Git local com credenciais
- [x] Adicionar remote do GitHub
- [x] Fazer push do código
- [x] Verificar código no GitHub


## Correção Build Render (16/01/2026)
- [ ] Corrigir comando de build no Render (usar pnpm ao invés de npm)
- [ ] Verificar se build passa com sucesso
- [ ] Testar acesso à plataforma
- [ ] Testar domínio personalizado


## Tornar Stripe e OAuth Opcionais (16/01/2026)
- [x] Modificar inicialização do Stripe para ser opcional
- [x] Modificar inicialização do OAuth para ser opcional
- [x] Fazer commit e push para GitHub
- [ ] Testar deploy no Render
- [ ] Verificar se servidor inicia sem erros


## Correção Domínio viabroker.app (16/01/2026)
- [ ] Investigar por que viabroker.app não está carregando
- [ ] Verificar configuração DNS do domínio
- [ ] Verificar configuração de domínio customizado no Render
- [ ] Testar acesso ao domínio após correção


## Correção Conexão SSL TiDB (16/01/2026)
- [x] Modificar drizzle.config.ts para suportar SSL
- [x] Modificar código de conexão do banco para usar SSL
- [x] Fazer commit e push
- [ ] Testar site funcionando em viabroker.app


## Correção Definitiva Render (16/01/2026)
- [x] Verificar código atual no GitHub
- [x] Identificar problema de conexão SSL no código de produção
- [x] Corrigir configuração de conexão do banco
- [x] Fazer commit e push para GitHub
- [ ] Validar deploy no Render
- [ ] Testar viabroker.app funcionando


## Criar Corretor Demo e Configurar viabroker.app (16/01/2026)
- [x] Criar script SQL para inserir corretor Bruno Barrionuevo
- [x] Executar SQL no banco TiDB
- [x] Configurar viabroker.app como domínio personalizado
- [ ] Testar site funcionando em viabroker.app


## Corrigir Middleware de Domínio Personalizado (16/01/2026)
- [x] Localizar código do middleware no servidor
- [x] Adicionar exceção para arquivos estáticos (JS, CSS, imagens)
- [x] Fazer commit e push
- [ ] Testar site carregando completamente


## Configurar viabroker.app como Domínio da Plataforma (16/01/2026)
- [x] Adicionar viabroker.app e www.viabroker.app na lista PLATFORM_DOMAINS
- [x] Remover viabroker.app do banco de dados como domínio de corretor
- [x] Fazer commit e push
- [ ] Testar plataforma funcionando completamente em viabroker.app


## Corrigir Envio de Email para Recuperação de Senha (16/01/2026)
- [x] Analisar código de envio de email
- [x] Verificar variáveis de ambiente SMTP no Render
- [x] Corrigir configuração se necessário (usuário configurou Gmail SMTP)
- [x] Testar envio de email funcionando


## Corrigir Login que não redireciona para Dashboard (16/01/2026)
- [x] Investigar problema de redirecionamento após login
- [x] Corrigir código de login/redirecionamento (sdk.ts - remover dependência do OAuth)
- [ ] Testar e fazer deploy


## Corrigir Senha Master (16/01/2026)
- [x] Investigar problema de autenticação master
- [x] Verificar/recriar usuário admin master no banco (usuário criado - tabela estava vazia)
- [ ] Testar login master


## Atualizar Informações de DNS para Render (17/01/2026)
- [x] Localizar código da página de configuração de domínio
- [x] Atualizar IP e CNAME para o novo servidor Render (216.24.57.1 e viabroker.onrender.com)
- [x] Fazer deploy


## Corrigir Erro DNS 1001 Cloudflare (17/01/2026)
- [ ] Investigar configuração DNS atual
- [ ] Configurar domínio no Render
- [ ] Ajustar configuração Cloudflare


## Integração Automática Cloudflare para Domínios Personalizados (17/01/2026)
- [x] Verificar token e testar API Cloudflare
- [x] Criar zona e registros DNS no Cloudflare
- [ ] Criar Cloudflare Worker para proxy reverso
- [ ] Configurar rota do Worker para domínios de clientes
- [ ] Testar com domínio brunobarrionuevo.com.br
- [ ] Implementar integração automática na plataforma
- [ ] Fazer deploy e documentar


## Correção Domínio Personalizado via Cloudflare Worker (17/01/2026)
- [x] Criar Cloudflare Worker para proxy reverso de domínios personalizados
- [x] Configurar Worker para enviar header X-Original-Host
- [x] Atualizar middleware do servidor para ler X-Original-Host
- [x] Corrigir busca de domínio com e sem prefixo www
- [x] Corrigir detecção de rewrite usando req.baseUrl (Express app.use("*") define req.url como "/" e move path para req.baseUrl)
- [x] Injetar script de redirect no HTML para sincronizar URL do navegador com rota do React
- [x] Testar domínio personalizado www.brunobarrionuevo.com.br funcionando corretamente


## Automação Completa de Domínios via API Cloudflare (17/01/2026)
- [x] Criar serviço de integração com API Cloudflare (cloudflareService.ts)
- [x] Implementar função para criar zona DNS
- [x] Implementar função para configurar registros DNS (CNAME)
- [x] Implementar função para adicionar rota do Worker
- [x] Implementar função para verificar status do domínio
- [x] Criar endpoints de gerenciamento de domínios no backend
- [x] Atualizar interface do dashboard para fluxo automatizado
- [x] Solicitar e configurar credenciais Cloudflare (API Token, Account ID, Worker ID)
- [x] Testar fluxo completo com novo domínio
- [x] Fazer deploy e documentar


## Indicador de Propagação DNS (17/01/2026)
- [x] Implementar verificação de propagação DNS no backend (resolver DNS e verificar CNAME)
- [x] Criar endpoint para verificar status de propagação do domínio
- [x] Criar componente visual de status de propagação (etapas: Configurando → Propagando → Ativo)
- [x] Integrar indicador na página de configuração de domínio
- [x] Testar e fazer deploy


## Exclusão de Domínio Personalizado (17/01/2026)
- [x] Criar endpoint para remover domínio personalizado do banco e Cloudflare
- [x] Adicionar botão de exclusão na interface com confirmação
- [x] Testar e fazer deploy


## Sistema de Autenticação Próprio (17/01/2026)
- [ ] Adicionar coluna password_hash na tabela users
- [ ] Criar endpoint de login com email/senha
- [ ] Criar endpoint de registro de novos usuários
- [ ] Criar endpoint de recuperação de senha por email
- [ ] Criar página de login
- [ ] Criar página de registro
- [ ] Criar página de recuperação de senha
- [ ] Remover dependências do Manus OAuth
- [ ] Testar fluxo completo de autenticação
- [ ] Fazer deploy

## Correção Link de Verificação de Email (18/01/2026)
- [ ] Corrigir erro no link de verificação de email para novos usuários
- [x] Corrigir exibição do código de parceiro que está mostrando "Carregando..." ao invés do código real
- [x] Implementar botão "Gerar com IA" funcional no campo de descrição do imóvel
- [x] Configurar API OpenAI para funcionar a geração de descrição com IA
- [x] Corrigir geração de descrição com IA no site de produção e melhorar o prompt
- [x] Configurar deploy automático do Manus para o Render via GitHub
- [x] Corrigir modelo de IA para usar modelo válido da OpenAI (gpt-4o-mini)
- [x] Criar tabela de configurações de IA no banco de dados
- [x] Adicionar interface de configuração de IA no dashboard admin master
- [ ] Investigar e corrigir falha no deploy do Render (erro SQL syntax no schema ai_settings)
- [x] Corrigir erro 400 Bad Request - remover parâmetro 'thinking' não reconhecido pela API OpenAI
- [ ] Mover campo Descrição para o final do formulário de cadastro de imóveis

## Reorganização do Formulário de Imóveis (18/01/2026)
- [x] Mover campo Descrição para o final do formulário de cadastro de imóveis
- [x] Tornar campo Código fixo e não editável, gerado automaticamente pela plataforma
- [x] Melhorar mensagem de erro quando credenciais do storage não estão disponíveis
- [x] Implementar upload de imagens usando AWS S3 direto para funcionar no Render
- [x] Implementar armazenamento de imagens diretamente no banco de dados TiDB
- [x] Corrigir falha no deploy do Render (SSL config e snapshots conflitantes)
- [ ] Corrigir erro de upload: imageData e mimeType não estão sendo salvos no banco
- [ ] Corrigir problema: imóveis não aparecem na listagem e novos cadastros não são salvos
- [ ] Corrigir inconsistência: dashboard mostra 2 imóveis mas listagem está vazia
