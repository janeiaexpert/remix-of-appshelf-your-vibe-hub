# Cadastro automático por link

## Objetivo
Transformar o cadastro de aplicativos em um fluxo no qual basta colar um link para o AppShelf buscar os dados públicos, classificar e salvar o item organizado.

## O que será feito
- Simplificar o formulário de novo aplicativo para destacar um único campo de link.
- Buscar automaticamente nome, descrição e informações públicas da página.
- Inferir categoria, plataforma, situação e etiquetas com regras consistentes.
- Mostrar os dados encontrados para revisão antes de salvar, mantendo a edição manual disponível.
- Tratar links inválidos, páginas inacessíveis e páginas sem metadados com mensagens claras.
- Preservar o formulário completo atual ao editar aplicativos já cadastrados.
- Validar o fluxo completo no navegador em telas desktop e móvel.

## Detalhes técnicos
- A leitura da página acontecerá no servidor por uma função autenticada.
- A URL será validada e endereços locais/privados serão bloqueados por segurança.
- A extração usará metadados HTML padrão (`title`, description e Open Graph), sem exigir nova chave de serviço.
- O resultado será normalizado para os campos existentes no banco; nenhuma mudança de estrutura de dados será necessária.
