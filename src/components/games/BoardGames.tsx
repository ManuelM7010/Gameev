import React, { useState, useEffect } from "react";
import { Room, Player } from "../../types";
import { Grid, Circle, Trophy, RefreshCw } from "lucide-react";

interface BoardGamesProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

export default function BoardGames({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
}: BoardGamesProps) {
  const gameState = room.gameState || {};
  const gameMode = gameState.boardGameMode || "tictactoe"; // tictactoe or connect4
  const grid = gameState.boardGrid || []; // Array matching the grid cells
  const currentTurn = gameState.currentTurn || "p1"; // p1 or p2
  const winner = gameState.boardWinner || null; // p1, p2, or draw

  // Check if it is current player's turn
  const isMyTurn = (isPlayer1 && currentTurn === "p1") || (!isPlayer1 && currentTurn === "p2");

  // Re-initialize board based on game mode selection
  const initBoard = (mode: string) => {
    let newGrid: Array<string | null> = [];
    if (mode === "tictactoe") {
      newGrid = Array(9).fill(null);
    } else if (mode === "connect4") {
      newGrid = Array(42).fill(null); // 7 columns x 6 rows
    }

    onUpdateState({
      boardGameMode: mode,
      boardGrid: newGrid,
      currentTurn: "p1",
      boardWinner: null,
    });
  };

  // On initial render, setup Tic-tac-toe if empty
  useEffect(() => {
    if (grid.length === 0) {
      initBoard("tictactoe");
    }
  }, []);

  // Check Tic Tac Toe Victory
  const checkTicTacToeWinner = (cells: Array<string | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diag
    ];
    for (const [a, b, c] of lines) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a]; // 'p1' or 'p2'
      }
    }
    if (cells.every((cell) => cell !== null)) return "draw";
    return null;
  };

  // Check Connect 4 Victory
  const checkConnect4Winner = (cells: Array<string | null>) => {
    const cols = 7;
    const rows = 6;

    // Helper to get element index
    const getIdx = (c: number, r: number) => r * cols + c;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const player = cells[getIdx(c, r)];
        if (!player) continue;

        // Check horizontal right
        if (c + 3 < cols &&
            player === cells[getIdx(c + 1, r)] &&
            player === cells[getIdx(c + 2, r)] &&
            player === cells[getIdx(c + 3, r)]) {
          return player;
        }
        // Check vertical down
        if (r + 3 < rows &&
            player === cells[getIdx(c, r + 1)] &&
            player === cells[getIdx(c, r + 2)] &&
            player === cells[getIdx(c, r + 3)]) {
          return player;
        }
        // Check diagonal down-right
        if (c + 3 < cols && r + 3 < rows &&
            player === cells[getIdx(c + 1, r + 1)] &&
            player === cells[getIdx(c + 2, r + 2)] &&
            player === cells[getIdx(c + 3, r + 3)]) {
          return player;
        }
        // Check diagonal down-left
        if (c - 3 >= 0 && r + 3 < rows &&
            player === cells[getIdx(c - 1, r + 1)] &&
            player === cells[getIdx(c - 2, r + 2)] &&
            player === cells[getIdx(c - 3, r + 3)]) {
          return player;
        }
      }
    }

    if (cells.every((cell) => cell !== null)) return "draw";
    return null;
  };

  // Handle cell click (Tic Tac Toe)
  const handleTicTacToeCell = (index: number) => {
    if (!isMyTurn || grid[index] || winner) return;

    const nextGrid = [...grid];
    nextGrid[index] = isPlayer1 ? "p1" : "p2";
    
    const outcome = checkTicTacToeWinner(nextGrid);
    const nextTurn = currentTurn === "p1" ? "p2" : "p1";

    const update: any = {
      boardGrid: nextGrid,
      currentTurn: nextTurn,
    };

    if (outcome) {
      update.boardWinner = outcome;
      if (outcome === "draw") {
        onFinishGame("Empate", 20);
      } else {
        const winName = outcome === "p1" ? (room.player1?.name || "Player 1") : (room.player2?.name || "Player 2");
        onFinishGame(winName, 35);
      }
    }

    onUpdateState(update);
  };

  // Handle column drop (Connect 4)
  const handleConnect4Col = (colIndex: number) => {
    if (!isMyTurn || winner) return;

    const cols = 7;
    const rows = 6;
    let targetRow = -1;

    // Find the bottom-most empty index in that column
    for (let r = rows - 1; r >= 0; r--) {
      const idx = r * cols + colIndex;
      if (!grid[idx]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column is full

    const targetIdx = targetRow * cols + colIndex;
    const nextGrid = [...grid];
    nextGrid[targetIdx] = isPlayer1 ? "p1" : "p2";

    const outcome = checkConnect4Winner(nextGrid);
    const nextTurn = currentTurn === "p1" ? "p2" : "p1";

    const update: any = {
      boardGrid: nextGrid,
      currentTurn: nextTurn,
    };

    if (outcome) {
      update.boardWinner = outcome;
      if (outcome === "draw") {
        onFinishGame("Empate", 20);
      } else {
        const winName = outcome === "p1" ? (room.player1?.name || "Player 1") : (room.player2?.name || "Player 2");
        onFinishGame(winName, 45);
      }
    }

    onUpdateState(update);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white" id="board-games-arena">
      <div className="flex justify-between items-center w-full mb-4">
        <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-mono">
          JUEGOS DE MESA CLÁSICOS
        </span>

        {/* Game mode selector */}
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => initBoard("tictactoe")}
            disabled={grid.length === 0}
            className={`px-3 py-1 text-xs rounded-md cursor-pointer font-medium transition ${
              gameMode === "tictactoe" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Tres en Raya (3x3)
          </button>
          <button
            onClick={() => initBoard("connect4")}
            disabled={grid.length === 0}
            className={`px-3 py-1 text-xs rounded-md cursor-pointer font-medium transition ${
              gameMode === "connect4" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Damas4 (Conecta 4)
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-2xl font-display font-medium text-rose-200">
          {gameMode === "tictactoe" ? "Tres En Raya Cariñoso" : "Damas4 En Pareja"}
        </h3>
        <p className="text-xs text-rose-300 mt-1">
          {winner
            ? "¡Juego Terminado!"
            : isMyTurn
            ? "🟢 ¡Es tu turno de mover!"
            : "🔴 Esperando el turno de tu pareja..."}
        </p>
      </div>

      {/* RENDER TIC TAC TOE BOARD */}
      {gameMode === "tictactoe" && (
        <div className="w-56 h-56 grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/85">
          {grid.map((cellValue, idx) => {
            const label = cellValue === "p1" ? (room.player1?.avatar || "❤️") : cellValue === "p2" ? (room.player2?.avatar || "💖") : "";
            return (
              <button
                key={idx}
                onClick={() => handleTicTacToeCell(idx)}
                disabled={cellValue !== null || !isMyTurn || !!winner}
                className="bg-slate-900 hover:bg-slate-800 text-2xl h-16 w-16 rounded-xl flex items-center justify-center transition focus:outline-none cursor-pointer border border-slate-800/30 active:scale-95"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* RENDER CONNECT 4 BOARD */}
      {gameMode === "connect4" && (
        <div className="flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800/85 w-full max-w-[340px]">
          {/* Drop helper buttons columns */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 w-full">
            {[0, 1, 2, 3, 4, 5, 6].map((colIdx) => (
              <button
                key={colIdx}
                onClick={() => handleConnect4Col(colIdx)}
                disabled={!isMyTurn || !!winner}
                className="bg-slate-800 hover:bg-rose-500 hover:text-white text-[11px] font-mono py-1 rounded cursor-pointer text-slate-400 transition"
              >
                ↓
              </button>
            ))}
          </div>

          {/* Table display */}
          <div className="grid grid-cols-7 gap-1.5 bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/40 w-full">
            {grid.map((cellValue, idx) => {
              const label = cellValue === "p1" ? (room.player1?.avatar || "🔴") : cellValue === "p2" ? (room.player2?.avatar || "🟡") : "";
              return (
                <div
                  key={idx}
                  className="bg-slate-900 h-8 rounded-full border border-slate-950 flex items-center justify-center text-sm"
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="w-full mt-6 space-y-3">
        {winner && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/20 text-center animate-bounce flex flex-col items-center gap-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <p className="text-sm font-semibold font-display text-rose-300">
              {winner === "draw"
                ? "¡Es un digno empate!"
                : `🎉 ¡Victoria para ${winner === "p1" ? room.player1?.name : room.player2?.name}!`}
            </p>
            <button
              onClick={() => initBoard(gameMode)}
              className="mt-2 text-xs text-rose-400 hover:text-white flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Jugar de nuevo
            </button>
          </div>
        )}

        <div className="flex justify-between items-center text-xs py-2.5 border-t border-slate-800/60 text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>P1 ({room.player1?.avatar}): {room.player1?.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
            <span>P2 ({room.player2?.avatar || "💖"}): {room.player2?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
