import React from "react";
import { Room, Player } from "../types";
import RacerGame from "./games/RacerGame";
import SmashArena from "./games/SmashArena";
import BattleQuiz from "./games/BattleQuiz";
import DrawingDuel from "./games/DrawingDuel";
import CoupleModes from "./games/CoupleModes";
import BoardGames from "./games/BoardGames";
import SpicyDice from "./games/SpicyDice";
import MemoryMatch from "./games/MemoryMatch";
import TruthOrDare from "./games/TruthOrDare";
import PongGame from "./games/PongGame";
import { ArrowLeft, Gamepad2 } from "lucide-react";

interface GameHostProps {
  room: Room;
  currentPlayer: Player;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
  onBackToLobby: () => void;
}

export default function GameHost({
  room,
  currentPlayer,
  onUpdateState,
  onFinishGame,
  onBackToLobby,
}: GameHostProps) {
  const isPlayer1 = room.player1?.uid === currentPlayer.uid;

  // Decide what game screen to show
  const renderActiveGame = () => {
    switch (room.gameType) {
      case "race":
        return (
          <RacerGame
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "smash":
        return (
          <SmashArena
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "quiz":
      case "quiz_romantic":
      case "quiz_spicy":
      case "quiz_funny":
        return (
          <BattleQuiz
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "drawing":
        return (
          <DrawingDuel
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "couple":
        return (
          <CoupleModes
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "spicy_dice":
        return (
          <SpicyDice
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "memory_match":
        return (
          <MemoryMatch
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "truth_or_dare":
        return (
          <TruthOrDare
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "board":
        return (
          <BoardGames
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      case "pong":
        return (
          <PongGame
            room={room}
            currentPlayer={currentPlayer}
            isPlayer1={isPlayer1}
            onUpdateState={onUpdateState}
            onFinishGame={onFinishGame}
          />
        );
      default:
        return (
          <div className="text-center p-8 bg-slate-950 rounded-2xl border border-slate-800">
            <Gamepad2 className="w-12 h-12 text-rose-500 mx-auto animate-bounce mb-3" />
            <h4 className="text-base font-bold font-display uppercase tracking-wider text-rose-300">
              Cargando Mini-juego...
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Tu pareja está seleccionando un desafío en la sala principal.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" id="game-host-wrapper">
      {/* Mini Bar Header */}
      <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={onBackToLobby}
          id="back-to-lobby-header-btn"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition cursor-pointer font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Lobby
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
          <span className="font-semibold text-rose-300">{currentPlayer.name}</span>
          <span className="text-slate-500 font-mono">| Código: </span>
          <strong className="text-white font-mono tracking-wide bg-slate-900 border border-slate-800 px-2 py-0.5 rounded uppercase">
            {room.roomId}
          </strong>
        </div>
      </div>

      {/* Render subcomponents */}
      <div>{renderActiveGame()}</div>
    </div>
  );
}
