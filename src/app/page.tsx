"use client";

import { useEffect, useRef, useState } from "react";
import { gerarGridAleatorio, gerarGridComCorInicial, GridColor, gridToString } from "../util/hexadimal";
import Image from "next/image";
import Cookies from "js-cookie";

type Dica = {
  linha: number;
  coluna: number;
  cor: "yellow" | "red" | "green";
};

type Estatisticas = {
  tentativa1: number;
  tentativa2: number;
  tentativa3: number;
  derrotas: number;
};

type EstadoPartida = {
  nivel: string;
  grid: GridColor[][];
  tentativas: number;
  finalizou: boolean;
  resultado: "correct" | "wrong" | null;
  dicas: Dica[];
  acertou: boolean;
};

const niveisTotais = 15;

const ESTATISTICAS_INICIAIS: Estatisticas = {
  tentativa1: 0,
  tentativa2: 0,
  tentativa3: 0,
  derrotas: 0,
};

export default function TelaJogoCores() {
  const [grid, setGrid] = useState<GridColor[][]>([]);
  const [acertou, setAcertou] = useState(false);
  const [tentativas, setTentativas] = useState(3);
  const [finalizou, setFinalizou] = useState(false);
  const [resultado, setResultado] = useState<"correct" | "wrong" | null>(null);
  const [dicas, setDicas] = useState<Dica[]>([]);

  const [novoGrid, setNovoGrid] = useState<GridColor[][]>([]);
  const [nome, setNome] = useState<any>(null);
  const [foto, setFoto] = useState<any>(null);
  const [nivel, setNivel] = useState<string>("");
  const [mode, setMode] = useState<string>("");

  const [modalAberto, setModalAberto] = useState(false);

  const [modalStatsAberto, setModalStatsAberto] = useState(false);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(
    ESTATISTICAS_INICIAIS
  );

  useEffect(() => {
    const novoGrid = gerarGridAleatorio("#C4D92A");
    setNovoGrid(novoGrid);
  }, []);

  useEffect(() => {
    const statsSalvas = Cookies.get("estatisticas");

    if (statsSalvas) {
      setEstatisticas(JSON.parse(statsSalvas));
    }
  }, []);


  function definirDificuldade(modo: string) {
    if (modo === "Normal") {
      return " text-amber-300 bg-amber-400/20"
    } else if (modo === "Easy") {
      return " text-emerald-300 bg-emerald-400/20"
    } else {
      return " text-red-300 bg-red-400/20"
    }
  }

  const salvarEstatisticas = (novasStats: Estatisticas) => {
    setEstatisticas(novasStats);

    Cookies.set("estatisticas", JSON.stringify(novasStats), {
      expires: 365,
    });
  };

  const registrarVitoria = () => {
    const tentativaUsada = 4 - tentativas;

    const novasStats = {
      ...estatisticas,
      [`tentativa${tentativaUsada}`]:
        estatisticas[`tentativa${tentativaUsada}` as keyof Estatisticas] + 1,
    } as Estatisticas;

    salvarEstatisticas(novasStats);
  };

  const registrarDerrota = () => {
    const novasStats = {
      ...estatisticas,
      derrotas: estatisticas.derrotas + 1,
    };

    salvarEstatisticas(novasStats);
  };



  useEffect(() => {
    const nivelSalvo = Cookies.get("nivel");

    if (nivelSalvo) {
      setNivel(nivelSalvo);
    } else {
      Cookies.set("nivel", "1", { expires: 365 });
      setNivel("1");
    }
  }, []);

  useEffect(() => {
    if (nivel && Number(nivel) <= niveisTotais) {
      async function carregarDados() {
        const partidaSalva = carregarPartidaSalva();

        const modulo = await import(`../nivel/${nivel}.ts`);

        setNome(modulo.nome);
        setFoto(modulo.imagem);
        setMode(modulo.mode)

        if (partidaSalva && partidaSalva.nivel === nivel) {
          setGrid(partidaSalva.grid);
          setTentativas(partidaSalva.tentativas);
          setFinalizou(partidaSalva.finalizou);
          setResultado(partidaSalva.resultado);
          setDicas(partidaSalva.dicas);
          setAcertou(partidaSalva.acertou);
          return;
        }

        setGrid(modulo.grid);
        setAcertou(false);
        setTentativas(3);
        setFinalizou(false);
        setResultado(null);
        setDicas([]);

        salvarPartida({
          nivel,
          grid: modulo.grid,
          tentativas: 3,
          finalizou: false,
          resultado: null,
          dicas: [],
          acertou: false,
        });
      }

      carregarDados();
    }
  }, [nivel]);



  console.log(gridToString(novoGrid));

  const irParaProximoNivel = () => {
    const proximoNivel = Number(nivel) + 1;

    if (proximoNivel > niveisTotais) return;

    limparPartidaSalva();

    Cookies.set("nivel", String(proximoNivel), {
      expires: 365,
    });

    setNivel(String(proximoNivel));
  };

  const buscarDica = (tipo: "linha" | "coluna", index: number) => {
    const dicasDoItem = dicas.filter((d) =>
      tipo === "linha" ? d.linha === index : d.coluna === index
    );

    if (dicasDoItem.some((d) => d.cor === "green")) return "green";
    if (dicasDoItem.some((d) => d.cor === "red")) return "red";
    if (dicasDoItem.some((d) => d.cor === "yellow")) return "yellow";

    return null;
  };

  const getClasseDica = (cor: "yellow" | "red" | "green" | null) => {
    if (cor === "green") {
      return "bg-green-500 text-white ring-4 ring-green-300";
    }

    if (cor === "yellow") {
      return "bg-yellow-400 text-slate-950 ring-4 ring-yellow-300";
    }

    if (cor === "red") {
      return "bg-red-500 text-white ring-4 ring-red-300";
    }

    return "bg-white/90 text-slate-900";
  };


  const salvarPartida = (estado: EstadoPartida) => {
    Cookies.set("partidaAtual", JSON.stringify(estado), {
      expires: 365,
    });
  };

  const carregarPartidaSalva = () => {
    const partida = Cookies.get("partidaAtual");

    if (!partida) return null;

    try {
      return JSON.parse(partida) as EstadoPartida;
    } catch {
      return null;
    }
  };

  const limparPartidaSalva = () => {
    Cookies.remove("partidaAtual");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white px-6 py-8">


      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <header className="relative w-full text-center">
          <div className="absolute right-0 top-0 flex gap-3">
            <button
              onClick={() => setModalStatsAberto(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-black text-white shadow-lg transition hover:scale-110 hover:bg-white/20"
            >
              📊
            </button>

            <button
              onClick={() => setModalAberto(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-black text-white shadow-lg transition hover:scale-110 hover:bg-white/20"
            >
              ?
            </button>
          </div>

          <h1 className="text-5xl font-black tracking-tight">
            Color<span className="text-emerald-400">Snap</span>
          </h1>

          <p className="mt-3 text-lg text-slate-300">Guess the exact color</p>
        </header>

        <section className="w-full rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <span className="rounded-full bg-emerald-400/20 px-4 py-1 text-sm font-semibold text-emerald-300">
                Level {nivel || "1"}
              </span>
              <span className={`rounded-full bg-amber-400/20 ml-2 px-4 py-1 text-sm font-semibold ${definirDificuldade(mode)}`}>
                Difficulty {mode}
              </span>

              <h2 className="mt-3 text-2xl font-bold">
                What color is{" "}
                <span className="text-emerald-300">{nome || "..."}</span>?
              </h2>

              <p className="mt-2 text-slate-300">
                Attempts left:{" "}
                <span className="font-bold text-white">{tentativas}</span>
              </p>
            </div>

            {resultado && (
              <div
                className={`
                  rounded-2xl px-6 py-3 text-lg font-bold text-white shadow-lg
                  ${resultado === "correct"
                    ? "bg-emerald-500 shadow-emerald-500/30"
                    : "bg-red-500 shadow-red-500/30"
                  }
                `}
              >
                {resultado === "correct" ? "Correct!" : "Wrong!"}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start justify-center gap-10 lg:flex-row">
            <div className="flex h-[420px] w-full max-w-[420px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60 p-8 shadow-inner">
              {foto && (
                <Image
                  alt={nome || "foto"}
                  src={foto}
                  priority
                  className={`
                    max-h-full max-w-full object-contain pointer-events-none
                    transition-all duration-[3s] ease-in-out
                    ${acertou
                      ? "opacity-100 scale-100 grayscale-0"
                      : "opacity-35 scale-95 grayscale blur-[1px]"
                    }
                  `}
                />
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl">
              <h3 className="mb-4 text-center text-2xl font-extrabold">
                Pick a color
              </h3>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: "36px repeat(6, minmax(52px, 80px))",
                }}
              >
                <div />

                {["A", "B", "C", "D", "E", "F"].map((coluna, index) => {
                  const corColuna = buscarDica("coluna", index);

                  return (
                    <div
                      key={coluna}
                      className={`
                        flex h-9 items-center justify-center rounded-lg text-sm font-black shadow transition-all
                        ${getClasseDica(corColuna)}
                      `}
                    >
                      {coluna}
                    </div>
                  );
                })}

                {grid.map((linha, i) => {
                  const corLinha = buscarDica("linha", i);

                  return (
                    <div key={i} className="contents">
                      <div
                        className={`
                          flex h-16 w-9 items-center justify-center rounded-lg text-sm font-black shadow transition-all
                          ${getClasseDica(corLinha)}
                        `}
                      >
                        {i + 1}
                      </div>

                      {linha.map((celula, j) => (
                        <button
                          key={`${i}-${j}`}
                          className={`
                            h-16 w-20 rounded-xl border border-white/20
                            shadow-lg transition-all duration-300
                            hover:-translate-y-1 hover:scale-105 hover:ring-4 hover:ring-white/30
                            active:scale-95
                            ${celula.isTarget && finalizou
                              ? "-translate-y-3 ring-4 ring-white/70"
                              : ""
                            }
                          `}
                          style={{ backgroundColor: celula.color }}
                          onClick={() => {
                            if (celula.isClicked || finalizou) return;

                            const targetLinha = grid.findIndex((linha) =>
                              linha.some((c) => c.isTarget)
                            );

                            const targetColuna = grid[targetLinha].findIndex(
                              (c) => c.isTarget
                            );

                            if (celula.isTarget) {
                              const novasDicas = [
                                ...dicas,
                                {
                                  linha: i,
                                  coluna: j,
                                  cor: "green",
                                },
                              ] as Dica[];

                              setAcertou(true);
                              setResultado("correct");
                              setFinalizou(true);
                              setDicas(novasDicas);

                              registrarVitoria();

                              salvarPartida({
                                nivel,
                                grid,
                                tentativas,
                                finalizou: true,
                                resultado: "correct",
                                dicas: novasDicas,
                                acertou: true,
                              });

                              return;
                            }

                            const mesmaLinhaOuColuna =
                              targetLinha === i || targetColuna === j;

                            const novasTentativas = tentativas - 1;


                            const novoGridAtualizado = grid.map((linhaAtual, rowIndex) =>
                              linhaAtual.map((celulaAtual, colIndex) => {
                                if (rowIndex === i && colIndex === j) {
                                  return {
                                    ...celulaAtual,
                                    color: "#64748b",
                                    isClicked: true,
                                  };
                                }

                                return celulaAtual;
                              })
                            );

                            const novasDicas = [
                              ...dicas,
                              {
                                linha: i,
                                coluna: j,
                                cor: mesmaLinhaOuColuna ? "yellow" : "red",
                              },
                            ] as Dica[];

                            setGrid(novoGridAtualizado);
                            setDicas(novasDicas);
                            setTentativas(novasTentativas);

                            if (novasTentativas === 0) {
                              setResultado("wrong");
                              setFinalizou(true);
                              setAcertou(true);

                              salvarPartida({
                                nivel,
                                grid: novoGridAtualizado,
                                tentativas: novasTentativas,
                                finalizou: true,
                                resultado: "wrong",
                                dicas: novasDicas,
                                acertou: true,
                              });

                              return;
                            }

                            salvarPartida({
                              nivel,
                              grid: novoGridAtualizado,
                              tentativas: novasTentativas,
                              finalizou: false,
                              resultado: null,
                              dicas: novasDicas,
                              acertou: false,
                            });
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

              {finalizou && (
                <button
                  onClick={irParaProximoNivel}
                  className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
                >
                  {nivel === String(niveisTotais) ? "Thanks for playing" : "Next level"}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-8 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black">How to play</h2>

              <button
                onClick={() => setModalAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-slate-300">
              <p>
                Look at the hidden image and try to guess the exact color that
                represents it.
              </p>

              <p>
                You have <strong className="text-white">3 attempts</strong> to pick
                the correct square in the color grid.
              </p>

              <p>
                If your guess is in the same row or column as the correct answer, the
                row and column will turn{" "}
                <strong className="text-yellow-300">yellow</strong>.
              </p>

              <p>
                If your guess is not in the same row or column, they will turn{" "}
                <strong className="text-red-400">red</strong>.
              </p>

              <p>
                If you find the right color, the row and column turn{" "}
                <strong className="text-emerald-400">green</strong> and you can go to
                the next level.
              </p>
            </div>

            <button
              onClick={() => setModalAberto(false)}
              className="mt-8 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {modalStatsAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950 p-8 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black">Statistics</h2>

              <button
                onClick={() => setModalStatsAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold transition hover:bg-white/20"
              >
                ×
              </button>
            </div>

            {(() => {
              const dados = [
                { label: "1", valor: estatisticas.tentativa1, cor: "from-emerald-400 to-emerald-600" },
                { label: "2", valor: estatisticas.tentativa2, cor: "from-blue-400 to-blue-600" },
                { label: "3", valor: estatisticas.tentativa3, cor: "from-yellow-300 to-yellow-500" },
                { label: "X", valor: estatisticas.derrotas, cor: "from-red-400 to-red-600" },
              ];

              const total =
                estatisticas.tentativa1 +
                estatisticas.tentativa2 +
                estatisticas.tentativa3 +
                estatisticas.derrotas;

              const maiorValor = Math.max(...dados.map((d) => d.valor), 1);

              return (
                <>
                  <div className="mb-8 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-3xl font-black">{total}</p>
                      <p className="text-sm text-slate-400">Games</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-3xl font-black">
                        {total === 0
                          ? 0
                          : Math.round(
                            ((estatisticas.tentativa1 +
                              estatisticas.tentativa2 +
                              estatisticas.tentativa3) /
                              total) *
                            100
                          )}
                        %
                      </p>
                      <p className="text-sm text-slate-400">Win rate</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-3xl font-black">
                        {estatisticas.derrotas}
                      </p>
                      <p className="text-sm text-slate-400">Losses</p>
                    </div>
                  </div>

                  <div className="flex h-56 items-end justify-center gap-5 rounded-3xl bg-white/10 p-6">
                    {dados.map((item) => {
                      const altura =
                        item.valor === 0 ? 8 : (item.valor / maiorValor) * 140;

                      const porcentagem =
                        total === 0 ? 0 : Math.round((item.valor / total) * 100);

                      return (
                        <div
                          key={item.label}
                          className="flex flex-col items-center gap-2"
                        >
                          <span className="text-sm font-bold text-white">
                            {porcentagem}%
                          </span>

                          <div
                            className={`w-12 rounded-xl bg-gradient-to-t ${item.cor} shadow-lg transition-all`}
                            style={{ height: `${altura}px` }}
                          />

                          <span className="text-sm font-black text-slate-300">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setModalStatsAberto(false)}
                    className="mt-8 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-400 active:scale-95"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
      <footer className="mt-16 w-full border-t border-white/10 pt-6 text-center text-sm text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <p>
            Created by{" "}
            <span className="font-semibold text-white">
              Gilsepi Luiz Rampinelli de Lira
            </span>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Gilsepi"
              target="_blank"
              className="transition hover:text-emerald-400"
            >
              GitHub
            </a>

            <span>•</span>

            <a
              href="https://www.linkedin.com/in/gilsepi-luiz-rampinelli-lira-6165a8234/"
              target="_blank"
              className="transition hover:text-emerald-400"
            >
              LinkedIn
            </a>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            © {new Date().getFullYear()} ColorSnap
          </p>
        </div>
      </footer>
    </main>
  );
}