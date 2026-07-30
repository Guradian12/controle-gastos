# controle-gastos

CONTEXTO DO PROJETO - CONTROLE FINANCEIRO
Objetivo

Desenvolver um aplicativo financeiro completo, inicialmente Web (HTML, CSS e JavaScript puro), pensado para posteriormente evoluir para um sistema profissional e eventualmente um aplicativo mobile.

O projeto não é apenas um controle de gastos.

A proposta é criar um verdadeiro centro de gerenciamento financeiro pessoal, unindo:

receitas
despesas
metas
limites
investimentos
controle de banca de poker
controle de banca de apostas esportivas (bets)
histórico financeiro
relatórios
gráficos
dashboard profissional

A inspiração visual é um dashboard moderno, semelhante a sistemas SaaS.

REFERÊNCIA VISUAL

Toda a interface deve seguir a imagem de referência enviada pelo usuário.

Características obrigatórias:

fundo azul marinho quase preto
menu lateral fixo
cards escuros
detalhes em azul, roxo, rosa e amarelo
gráficos modernos
dashboard semelhante a softwares empresariais
design minimalista
responsividade completa
experiência semelhante a aplicativos profissionais

O CSS foi desenvolvido para reproduzir exatamente esse estilo.

ORGANIZAÇÃO DO PROJETO
controle-gastos/

assets/
    icons/
    logo
    favicon

components/
    sidebar
    header
    cards
    charts
    modal

css/
    style.css
    sidebar.css
    dashboard.css
    cards.css
    charts.css

js/
    utils.js
    storage.js
    categories.js
    expenses.js
    dashboard.js
    charts.js
    ui.js
    app.js

libs/

index.html

A estrutura deve permanecer modular.

Cada arquivo possui apenas uma responsabilidade.

O QUE JÁ FOI CONCLUÍDO
Estrutura completa das pastas

Toda organização criada.

Layout principal

Index praticamente completo.

Menu lateral.

Dashboard.

Páginas.

Cards.

Responsividade.

CSS

Tema escuro completo.

Sidebar.

Dashboard.

Cards.

Gráficos.

Formulários.

Poker.

Bets.

Limites.

Responsividade.

Utils

Arquivo utils.js criado.

Contém:

formatação de moeda
formatação de datas
geração de ids
cálculos de porcentagem
funções auxiliares
clone
escapeHTML
soma
etc.
FILOSOFIA DO PROJETO

O sistema deve parecer um software comercial.

Nada de código improvisado.

Tudo deve ser organizado.

Comentários claros.

Código reutilizável.

Arquivos pequenos.

Responsabilidade única.

Preparado para expansão futura.

MÓDULOS DO SISTEMA

O aplicativo possuirá os seguintes módulos principais.

DASHBOARD

A primeira tela.

Ela mostra um resumo financeiro.

Cards:

Saldo

Receitas

Despesas

Economia

Resultado Poker

Resultado Bets

Também possuirá:

gráfico mensal

gráfico anual

gráfico por categoria

últimos lançamentos

alertas

limites

resumo das metas

RECEITAS

Cadastro de receitas.

Cada receita terá:

id

data

descrição

categoria

origem

valor

observação

Categorias:

Salário

Freelancer

Renda Extra

Investimentos

Poker

Bets

Outros

GASTOS

Cadastro completo de despesas.

Cada gasto possuirá:

id

data

valor

categoria

descrição

forma de pagamento

tipo

parcelamento (futuramente)

observação

Categorias padrão:

Alimentação

Transporte

Moradia

Casa

Saúde

Estudos

Lazer

Compras

Assinaturas

Outros

Categorias deverão ser totalmente personalizáveis.

SISTEMA DE LIMITES

Esse é um dos módulos mais importantes.

O usuário poderá cadastrar:

Limite diário geral

Exemplo

Posso gastar até

R$150 por dia.

Ao atingir:

80%

fica amarelo.

100%

fica vermelho.

Acima disso

gera alerta.

Limite mensal geral

Exemplo

Posso gastar

R$2.000

por mês.

O dashboard mostra:

valor utilizado

valor restante

porcentagem

previsão até o fim do mês

Limite por categoria

Cada categoria terá seu próprio teto.

Exemplo

Alimentação

R$600

Transporte

R$300

Lazer

R$250

Saúde

R$150

etc.

Cada uma terá:

barra de progresso

porcentagem

status

alerta

Limite Poker

O usuário define quanto da renda mensal pode ser destinado ao poker.

Exemplo

Poker

Limite

R$500

O sistema informa:

utilizado

restante

resultado

ROI

lucro

prejuízo

Limite Bets

Mesmo conceito.

Define o orçamento máximo para apostas.

Nunca mistura com despesas pessoais.

SISTEMA DE POKER

O Poker não será tratado como gasto comum.

Ele terá uma banca própria.

Cadastro:

data

modalidade

local

buy-in

reentrada

cash-out

lucro

tempo jogado

observações

Resultados:

lucro acumulado

prejuízo

ROI

bankroll

gráfico

histórico

sessões positivas

sessões negativas

maior lucro

maior perda

lucro mensal

lucro anual

SISTEMA DE BETS

Mesmo conceito.

Controle da banca.

Cadastro:

data

casa

evento

mercado

odd

stake

retorno

status

cash-out

lucro

Resumo:

lucro

prejuízo

ROI

yield

stake média

odd média

acertos

erros

histórico

gráfico

MOVIMENTAÇÕES ENTRE BANCAS

Esse ponto é extremamente importante.

Depósitos em Poker e Bets NÃO serão considerados gasto.

Serão tratados como transferência financeira.

Exemplo:

Carteira Principal

↓

Banca Poker

↓

Sessão

↓

Resultado

↓

Retorno

Da mesma forma para Bets.

Assim os relatórios permanecem corretos.

RELATÓRIOS

O sistema possuirá:

gráfico mensal

gráfico anual

gastos por categoria

receitas

evolução patrimonial

evolução da banca

ranking de categorias

ranking de despesas

comparação mensal

comparação anual

METAS

O usuário poderá cadastrar:

meta de economia

meta de patrimônio

meta de banca poker

meta de banca bets

meta mensal

meta anual

Todas terão:

barra

porcentagem

estimativa

DASHBOARD FUTURO

No dashboard existirão diversos cards.

Saldo.

Receitas.

Despesas.

Economia.

Limite restante.

Meta.

Poker.

Bets.

Últimos lançamentos.

Resumo mensal.

Resumo anual.

Indicadores circulares.

Gráficos.

DADOS

Todos os dados serão armazenados inicialmente em LocalStorage.

Estrutura preparada para migrar posteriormente para:

Firebase

Supabase

Node

API própria

Banco SQL

Sem alterar a arquitetura.

ORDEM DE DESENVOLVIMENTO

Jamais alterar esta sequência.

1
utils.js

2
storage.js

3
categories.js

4
expenses.js

5
dashboard.js

6
charts.js

7
ui.js

8
app.js

Cada etapa depende da anterior.

Não inverter.

PADRÃO DE CÓDIGO

Sempre:

indentação consistente

nomes claros

comentários explicativos

funções pequenas

uma responsabilidade por função

uma responsabilidade por arquivo

sem duplicação

código preparado para manutenção

STATUS ATUAL

Concluído:

✅ Estrutura completa do projeto

✅ Estrutura das pastas

✅ HTML principal

✅ Layout do Dashboard

✅ CSS completo

✅ Responsividade

✅ Menu lateral

✅ Dashboard

✅ Páginas

✅ Estrutura de Poker

✅ Estrutura de Bets

✅ Estrutura de Limites

✅ utils.js

Próximo arquivo:

storage.js

Eu acrescentaria apenas uma regra de desenvolvimento que considero muito importante:

Nenhuma funcionalidade será implementada de forma rápida apenas para "funcionar". Cada módulo deve ser desenvolvido pensando em escalabilidade, reutilização e evolução futura. O objetivo final é que este projeto tenha qualidade suficiente para se tornar um produto real, com código organizado, arquitetura modular e possibilidade de migração para frameworks como React, Next.js ou um aplicativo mobile, sem necessidade de reescrever toda a lógica.

Esse documento passa a ser o "manual" do projeto. Mesmo que você precise abrir um chat novo no futuro, basta colar esse texto e informar o último arquivo desenvolvido para que eu consiga retomar o desenvolvimento praticamente do mesmo ponto, mantendo a mesma arquitetura e as mesmas decisões de projeto.