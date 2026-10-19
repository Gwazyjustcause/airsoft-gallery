# Winnie — Airsoft Photography

Galeria pública em português, com pesquisa por jogo/campo, filtros de ano, visualização ampliada, download individual e download do álbum em ZIP. Adaptada a computador e telemóvel.

## Adicionar fotografias

Carrega uma pasta por jogo no repositório. Estrutura recomendada:

```
fotos/
  2026/
    2026-10-18 - Nome do jogo/
      DSC_001.jpg
      DSC_002.jpg
```

A pasta torna-se um álbum automaticamente. A data é lida do formato `AAAA-MM-DD` no nome da pasta e o texto seguinte torna-se o nome do jogo. São aceites JPG, JPEG, PNG, WebP e AVIF, incluindo extensões em maiúsculas. Mantém cada jogo numa única pasta para evitar álbuns separados. Não precisas de alterar HTML ou listas de ficheiros.

Para acrescentar o campo, escolher uma capa ou personalizar o nome, cria um ficheiro **opcional** `album.json` dentro da pasta do jogo:

```json
{
  "title": "Operation Black Mountain",
  "date": "2026-10-18",
  "location": "Lousã",
  "cover": "DSC_002.jpg"
}
```

Após cada upload, o GitHub Actions reconstrói e publica o site. No primeiro lançamento, se for necessário, abre **Settings → Pages → Source → GitHub Actions** e volta a executar **Actions → Publicar galeria → Run workflow**.

## Disponibilidade e espaço

Os álbuns de cada ano são publicados até ao último dia de fevereiro do ano seguinte (inclusive). Uma publicação agendada em 1 de março retira automaticamente os álbuns expirados do site. Esse processo **não apaga os ficheiros do repositório**. Para eliminar as fotografias e recuperar o espaço do histórico Git é necessária manutenção separada; remover ficheiros num commit normal mantém as versões anteriores no histórico.

A galeria publicada tem de caber no limite de 1 GB do GitHub Pages. A compilação avisa aos 950 MB e falha acima de 1 000 MB. Atenção à sobreposição de dois anos em janeiro e fevereiro.

Os ZIP são gerados no navegador quando pedidos, sem guardar uma segunda cópia das fotografias no site. Em álbuns muito grandes, o download individual é mais leve para telemóveis. As imagens de grelha usam os próprios ficheiros com carregamento diferido, sem duplicação de miniaturas. Não há compressão ou alteração de qualidade na compilação.

Não são incluídas fotografias fictícias nem dados de demonstração. As fontes Google são opcionais; existem fontes de sistema de reserva.

## Desenvolvimento

Executa `python scripts/build.py` para criar `dist/`. Serve essa pasta com qualquer servidor estático para testar.
