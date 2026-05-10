# Sprite Frame Cutter

Ferramenta de corte de spritesheets que roda direto no browser, sem instalação, sem servidor, sem dependências. Você abre o `index.html`, carrega sua spritesheet, desenha retângulos sobre os frames que quer extrair, nomeia cada um e exporta como PNGs individuais.

---

## O que ela faz

Uma spritesheet é uma imagem única que contém vários frames de animação lado a lado. Motores de jogo e bibliotecas normalmente trabalham com os frames já separados, ou precisam das coordenadas exatas de cada frame dentro da sheet. Essa ferramenta resolve esse problema visualmente:

1. Você carrega a imagem
2. Clica e arrasta para marcar cada frame como um retângulo
3. Nomeia cada frame (ex: `idle_0`, `walk_1`, `attack_3`)
4. Exporta — cada frame vira um PNG separado, nomeado e numerado

Nenhum dado sai da sua máquina. Tudo acontece dentro do browser.

---

## Como usar

**Carregar a spritesheet**

Clique no botão "Carregar Sprite" e selecione qualquer imagem (PNG, GIF, WEBP, JPG). Alternativamente, arraste o arquivo diretamente para a janela do browser.

**Ajustar o zoom**

Use o slider no topo da área de trabalho para ampliar a imagem de 1× até 6×. Útil para spritesheets com pixels pequenos onde a precisão importa. As coordenadas exibidas abaixo do canvas são sempre em pixels da imagem original, independentemente do zoom.

**Marcar um frame**

Clique e segure o mouse sobre a imagem, arraste para formar o retângulo e solte. Um frame é registrado automaticamente com o nome `frame_N`. O tamanho em pixels aparece flutuando acima do retângulo enquanto você arrasta.

**Renomear**

Na lista da sidebar, clique no campo de nome do frame e edite. Pressione Tab ou clique fora para confirmar. O nome é usado no arquivo exportado.

**Selecionar e deletar**

Clicar em qualquer item da lista seleciona o frame correspondente no canvas (fica destacado em amarelo). O botão `×` apaga o frame da lista.

**Exportar**

Clique em "Exportar Todos os Frames". O browser baixa cada frame como um PNG separado, com nome no formato `00_idle_0.png`, `01_walk_0.png`, etc. O número no prefixo garante a ordem correta ao ordenar por nome de arquivo.

---

## Por que é um arquivo só

A ferramenta inteira está em um único `index.html`. Isso foi uma decisão deliberada, não uma limitação.

A primeira versão foi escrita com ES Modules — código separado em vários arquivos `.js` com `import/export` e `<script type="module">`. O resultado foi mais organizado no papel, mas gerou um problema prático que travou o funcionamento: browsers modernos (Chrome, Firefox, Safari) bloqueiam a abertura do seletor de arquivo quando o `.click()` no `<input type="file">` é chamado de dentro de um módulo ES. Isso acontece porque módulos rodam em um contexto de execução diferente do gesto direto do usuário, e o browser interpreta esse distanciamento como um clique não-confiável.

Diversas tentativas foram feitas para contornar isso — `opacity:0` no input, `label` envolvendo o input, mover o listener para o mesmo arquivo do botão — mas o comportamento varia entre browsers e versões. A solução mais robusta foi abandonar os módulos e colocar tudo em um `<script>` clássico no mesmo documento HTML. Com isso o clique vai direto do botão para o input, sem nenhuma camada de módulo no meio, e funciona em qualquer browser sem exceção.

O código continua organizado internamente: o script é dividido em seções comentadas com responsabilidades claras (`STATE`, `IMAGE LOADING`, `CANVAS RENDERING`, `CANVAS INTERACTION`, `SIDEBAR LIST`, `ACTION BUTTONS`), exatamente como seria se estivesse em arquivos separados.

---

## Decisões técnicas

**`<input type="file">` invisível sobre um botão estilizado**

O input tem `position:absolute`, `opacity:0` e `z-index:2`, cobrindo um `<div>` que parece um botão. O clique vai direto pro input sem JavaScript intermediário. Isso é mais confiável do que chamar `.click()` programaticamente porque é o próprio elemento nativo recebendo o gesto do usuário — o browser nunca questiona a origem do clique.

**`URL.createObjectURL` + `revokeObjectURL`**

Para carregar a imagem do arquivo local sem fazer upload para nenhum servidor, o browser cria uma URL temporária apontando pro arquivo em memória. Assim que a imagem termina de carregar, a URL é revogada com `revokeObjectURL` para liberar a referência e não vazar memória.

**`imageSmoothingEnabled = false`**

Desativa a interpolação bilinear do canvas. Sem isso, o browser suavizaria os pixels ao renderizar a imagem ampliada, desfocando spritesheets pixel-art. Com essa flag, cada pixel da imagem original aparece como um quadrado nítido independentemente do zoom.

**Coordenadas em image-space, não canvas-space**

Todas as coordenadas salvas nos frames (`x`, `y`, `w`, `h`) são em pixels da imagem original. A conversão acontece na função `toImg()`, que divide a posição do mouse no canvas pelo fator de zoom atual. Isso garante que trocar o zoom não altera os frames já marcados, e os valores exportados são sempre coordenadas reais da imagem.

**Canvas offscreen para exportar**

Na hora de exportar, cada frame é desenhado em um `<canvas>` temporário com as dimensões exatas do frame (`fr.w × fr.h`). O `drawImage` recorta apenas aquela região da imagem original. O resultado é convertido para PNG via `toDataURL('image/png')` e baixado com um link `<a download>`. O canvas temporário nunca é inserido no DOM — existe só em memória durante a exportação.

**Delay de 60ms entre downloads**

Quando vários arquivos são baixados em sequência sem intervalo, alguns browsers silenciosamente bloqueiam os downloads a partir do segundo ou terceiro. O `setTimeout` de 60ms entre cada arquivo garante que o browser processe cada download antes do próximo ser disparado.

**`createElement` em vez de `innerHTML` na lista de frames**

Os nomes dos frames são definidos pelo usuário. Usar `innerHTML` para renderizar a lista colocaria esses dados diretamente como HTML, abrindo brecha para XSS caso o nome contenha caracteres como `<`, `>` ou `"`. Construir os elementos com `createElement` e atribuir via `.textContent` ou `.value` faz o browser tratar os dados como texto puro, sem interpretar HTML.

**Checkerboard no fundo do canvas**

Spritesheets normalmente têm fundo transparente. Sem o checkerboard, áreas transparentes aparecem como branco ou preto dependendo do browser, tornando difícil ver onde termina um frame e começa o fundo. O padrão xadrez cinza é a convenção universal para indicar transparência em editores de imagem.

**CSS custom properties (variáveis)**

Todas as cores e valores repetidos ficam declarados em `:root` como `--variaveis`. Isso centraliza o tema em um lugar só — trocar a paleta inteira é editar um bloco de ~15 linhas, sem busca e substituição espalhada pelo arquivo.

---

## Uso

Sem build, sem instalação:

```bash
git clone https://github.com/seu-usuario/sprite-frame-cutter.git
cd sprite-frame-cutter
# abrir index.html direto no browser
```

Ou servir localmente se preferir (não obrigatório):

```bash
npx serve .
```

---

## Licença

MIT
