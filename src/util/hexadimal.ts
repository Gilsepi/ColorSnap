'use client'

export type GridColor = {
  color: string;
  isTarget: boolean;
  isClicked: boolean;
};

function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");

  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColor(hex: string, factor: number) {
  const { r, g, b } = hexToRgb(hex);

  if (factor > 0) {
    // clareia misturando com branco
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor
    );
  }

  // escurece misturando com preto
  const darkFactor = 1 + factor;

  return rgbToHex(r * darkFactor, g * darkFactor, b * darkFactor);
}

export function gerarGridComCorInicial(
  corInicial: string,
  linhas = 6,
  colunas = 6
): GridColor[][] {
  const targetLinha = Math.floor(Math.random() * linhas);
  const targetColuna = Math.floor(Math.random() * colunas);

  const MAX_VERTICAL = 0.7;
  const MAX_HORIZONTAL = 0.08;

  return Array.from({ length: linhas }, (_, linha) =>
    Array.from({ length: colunas }, (_, coluna) => {
      // --- VERTICAL (topo claro, baixo escuro)
      const distVertical = linha - targetLinha;
      const maxDistVertical = Math.max(
        targetLinha,
        linhas - 1 - targetLinha
      );

      const intensidadeVertical = distVertical / maxDistVertical;
      const factorVertical = -intensidadeVertical * MAX_VERTICAL;

      // --- HORIZONTAL
      const meioColuna = (colunas - 1) / 2;
      const distHorizontal = coluna - meioColuna;
      const intensidadeHorizontal = distHorizontal / meioColuna;

      
      const factorHorizontal = -intensidadeHorizontal * MAX_HORIZONTAL;

      const factor = factorVertical + factorHorizontal;

      return {
        color:
          linha === targetLinha && coluna === targetColuna
            ? corInicial
            : mixColor(corInicial, factor),
        isTarget: linha === targetLinha && coluna === targetColuna,
        isClicked: false
      };
    })
  );
}

export function gridToString(grid: GridColor[][]): string {
  const linhas = grid.map((linha) => {
    const itens = linha.map((celula) => {
      return `{
        color: "${celula.color}",
        isTarget: ${celula.isTarget},
        isClicked: ${celula.isClicked ?? false}
      }`;
    });

    return `[${itens.join(", ")}]`;
  });

  return `const cores = [\n  ${linhas.join(",\n  ")}\n];`;
}


