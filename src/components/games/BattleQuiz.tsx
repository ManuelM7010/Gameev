import React, { useState, useEffect } from "react";
import { Room, Player } from "../../types";
import { HelpCircle, Award, CheckCircle2, XCircle } from "lucide-react";

interface BattleQuizProps {
  room: Room;
  currentPlayer: Player;
  isPlayer1: boolean;
  onUpdateState: (stateUpdate: any) => void;
  onFinishGame: (winnerName: string, points: number) => void;
}

interface Question {
  category: string;
  question: string;
  options: string[];
  answerIndex: number;
}

const GENERAL_QUIZ_BANK: Question[] = [
  {
    category: "Pareja",
    question: "¿Cuál es la actividad ideal acordada tradicionalmente para un domingo de flojera?",
    options: ["Ver maratón de series y pedir delivery", "Ir a acampar a la montaña", "Hacer limpieza profunda de la casa", "Cocinar un banquete de 3 pasos"],
    answerIndex: 0,
  },
  {
    category: "Pareja",
    question: "Si uno de los dos se enoja, ¿cuál suele ser el remedio más efectivo?",
    options: ["Comida rica (¡pizza/dulces!)", "Darle espacio absoluto durante 3 días", "Escribirle un poema formal", "Hacerle caras graciosas hasta que se ría"],
    answerIndex: 0,
  },
  {
    category: "Memes",
    question: "¿De qué raza es el famoso perrito de los memes 'Doge' (Cheems)?",
    options: ["Shiba Inu", "Pug", "Golden Retriever", "Chihuahua"],
    answerIndex: 0,
  },
  {
    category: "Cultura",
    question: "¿Cuál es el planeta más caliente del sistema solar?",
    options: ["Venus", "Mercurio", "Marte", "Estrella de la Muerte"],
    answerIndex: 0,
  },
  {
    category: "Anime",
    question: "¿Cómo se llama la aldea secreta que protege Naruto Uzumaki?",
    options: ["Aldea de la Hoja (Konoha)", "Aldea de la Arena", "Aldea de la Lluvia", "Aldea del Sonido"],
    answerIndex: 0,
  }
];

const ROMANTIC_QUIZ_BANK: Question[] = [
  {
    category: "Romance",
    question: "Si tuviéramos que irnos de viaje de aniversario mañana, ¿qué plan suena más mágico?",
    options: ["Cabaña acogedora frente a un lago con chimenea", "Hotel VIP frente al mar en una playa tropical", "Explorar castillos antiguos en Europa medieval", "Camping salvaje bajo un cielo estrellado"],
    answerIndex: 0, // Since it's a personality match, any choice or first choice works!
  },
  {
    category: "Romance",
    question: "¿Cuál es nuestro lenguaje del amor predominante cuando estamos juntos?",
    options: ["Abrazos cariñosos y contacto constante", "Decirnos piropos sumamente cursis", "Hacer locuras/aventuras compartidas", "Regalar detalles y postres de sorpresa"],
    answerIndex: 0,
  },
  {
    category: "Romance",
    question: "¿Cuál de estas opciones describe una cita perfecta de fin de semana?",
    options: ["Cocinar pizza casera en pijama escuchando jazz", "Ir a un concierto de rock e ir a cenar tarde", "Pasear al atardecer por un parque de atracciones", "Ir al cine y después comer helado de medianoche"],
    answerIndex: 0,
  },
  {
    category: "Romance",
    question: "Si nos reencarnáramos en animales de pareja de por vida, ¿cuáles seríamos?",
    options: ["Dos pingüinitos que se dan piedras suaves", "Dos ositos panda mimados comiendo bambú", "Dos lobitos que le aúllan juntos a la luna", "Dos gatitos juguetones durmiendo siesta"],
    answerIndex: 0,
  }
];

const SPICY_QUIZ_BANK: Question[] = [
  {
    category: "Atrevido",
    question: "¿Qué tipo de caricia o mimo hace que se te erice la piel al instante?",
    options: ["Un beso suave en la nuca / cuello de sorpresa", "Deditos jugando suavemente con tu cabello", "Un susurro muy de cerca justo al oído", "Sostener firme tu cintura por detrás"],
    answerIndex: 0,
  },
  {
    category: "Atrevido",
    question: "¿Cuál es la hora perfecta del día para una sesión de caricias y mimos?",
    options: ["Apenas nos despertamos por la mañana", "A mitad de la tarde para desconectar del día", "A altas horas de la madrugada con todo en silencio", "En cualquier momento que tengamos 5 minutos libres"],
    answerIndex: 2,
  },
  {
    category: "Atrevido",
    question: "En una sesión de películas, ¿cuál es tu distracción favorita?",
    options: ["Poner la peli de excusa y terminar mimándonos", "Comer snacks dándonos bocados en la boca", "Hacer masajes de pies mutuamente", "Ver la película en completo silencio acurrucados"],
    answerIndex: 0,
  }
];

const FUNNY_QUIZ_BANK: Question[] = [
  {
    category: "Divertido",
    question: "Si uno de los dos se convierte en zombie, ¿qué haría el otro?",
    options: ["Dejarse morder para ser zombies juntos", "Encerrarlo en el sótano y alimentarlo con carne de hamburguesa", "Salir corriendo pidiendo auxilio de inmediato", "Intentar curarlo con un beso de cuento de hadas"],
    answerIndex: 0,
  },
  {
    category: "Divertido",
    question: "¿Quién de los dos es más propenso a quedarse dormido a los 10 minutos de empezar una película?",
    options: ["Eve (¡sin dudas!)", "Manu (¡completamente!)", "Ninguno, aguantamos despiertos hasta tarde", "Ambos nos dormimos juntos en la intro"],
    answerIndex: 0,
  },
  {
    category: "Divertido",
    question: "Si nos dieran 1 millón de dólares pero solo para comprar cosas inútiles, ¿qué compraríamos?",
    options: ["Un tobogán gigante desde la cama al comedor", "Un dispensador automático de pizza ilimitada", "Trajes de tiranosaurio rex inflables idénticos", "Una piscina repleta de gomitas de osito"],
    answerIndex: 2,
  }
];

export default function BattleQuiz({
  room,
  currentPlayer,
  isPlayer1,
  onUpdateState,
  onFinishGame,
 }: BattleQuizProps) {
  const gameState = room.gameState || {};
  const currentQuestionIdx = gameState.currentQuestionIdx || 0;
  const p1Answer = gameState.p1Answer !== undefined ? gameState.p1Answer : null;
  const p2Answer = gameState.p2Answer !== undefined ? gameState.p2Answer : null;
  const showResult = gameState.showResult || false;

  // Resolve quiz bank dynamically based on room mood or game type selection
  const gameMode = room.gameType || "quiz";
  let quizBank = GENERAL_QUIZ_BANK;
  if (gameMode === "quiz_romantic") quizBank = ROMANTIC_QUIZ_BANK;
  else if (gameMode === "quiz_spicy") quizBank = SPICY_QUIZ_BANK;
  else if (gameMode === "quiz_funny") quizBank = FUNNY_QUIZ_BANK;

  const currentQuestion = quizBank[currentQuestionIdx] || quizBank[0];

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return; // Answer locked

    const update: any = {};
    if (isPlayer1) {
      update.p1Answer = optionIndex;
    } else {
      update.p2Answer = optionIndex;
    }

    // If both players have answered, transmit state to showcase results
    const peerAnswer = isPlayer1 ? p2Answer : p1Answer;
    if (peerAnswer !== null) {
      update.showResult = true;
    }

    onUpdateState(update);
  };

  const nextQuestion = () => {
    // Calculate intermediate round scores
    let p1Earned = 0;
    let p2Earned = 0;

    if (p1Answer === currentQuestion.answerIndex) p1Earned = 15;
    if (p2Answer === currentQuestion.answerIndex) p2Earned = 15;

    const updatedP1Score = (room.player1?.score || 0) + p1Earned;
    const updatedP2Score = (room.player2?.score || 0) + p2Earned;

    const nextIndex = currentQuestionIdx + 1;

    if (nextIndex >= quizBank.length) {
      // Game sets over. Calculate winner
      const p1Final = updatedP1Score;
      const p2Final = updatedP2Score;
      let finalWinner = "Empate";
      if (p1Final > p2Final) finalWinner = room.player1?.name || "Player 1";
      if (p2Final > p1Final) finalWinner = room.player2?.name || "Player 2";

      onUpdateState({
        winner: finalWinner,
        p1Answer: null,
        p2Answer: null,
        showResult: false,
        currentQuestionIdx: 0
      });
      onFinishGame(finalWinner, 45);
    } else {
      onUpdateState({
        currentQuestionIdx: nextIndex,
        p1Answer: null,
        p2Answer: null,
        showResult: false,
        player1Score: updatedP1Score,
        player2Score: updatedP2Score,
      });
    }
  };

  const currentAnswer = isPlayer1 ? p1Answer : p2Answer;
  const partnerAnswer = isPlayer1 ? p2Answer : p1Answer;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-3xl border border-rose-500/20 max-w-2xl mx-auto text-white shadow-xl" id="battle-quiz">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-mono">
          {currentQuestion.category.toUpperCase()} QUIZ
        </span>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-display font-medium text-rose-200">Compatibilidad y Duelo Quiz</h3>
        <p className="text-xs text-rose-300 mt-1">
          Pregunta {currentQuestionIdx + 1} de {quizBank.length}. ¡Quien responda bien suma puntos!
        </p>
      </div>

      <div className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center mb-6">
        <p className="text-lg font-display font-medium leading-relaxed text-slate-150">
          "{currentQuestion.question}"
        </p>
      </div>

      {/* Answer grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {currentQuestion.options.map((option, idx) => {
          const isSelectedByMe = currentAnswer === idx;
          const isSelectedByPartner = partnerAnswer === idx;
          const isCorrect = idx === currentQuestion.answerIndex;

          let btnClass = "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-200";
          if (showResult) {
            if (isCorrect) {
              btnClass = "bg-green-950/80 border-green-500 text-green-200";
            } else if (isSelectedByMe) {
              btnClass = "bg-red-950/80 border-red-500 text-red-200";
            }
          } else if (isSelectedByMe) {
            btnClass = "bg-rose-950/65 border-rose-500 text-rose-200 ring-2 ring-rose-500/30";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswerSelect(idx)}
              disabled={showResult || currentAnswer !== null}
              className={`p-4 text-left rounded-xl border text-sm font-medium relative transition duration-150 cursor-pointer ${btnClass}`}
            >
              <div className="flex justify-between items-center">
                <span>{option}</span>
                <span className="flex items-center gap-1 text-[10px]">
                  {isSelectedByMe && <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5">Tú</span>}
                  {isSelectedByPartner && <span className="bg-violet-500 text-white rounded-full px-1.5 py-0.5">Partner</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Status details */}
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400 py-3 border-t border-slate-800">
          <div>
            Tu elección:{" "}
            <span className="font-semibold text-rose-300">
              {currentAnswer !== null ? currentQuestion.options[currentAnswer] : "Pensando..."}
            </span>
          </div>
          <div>
            Pareja:{" "}
            <span className="font-semibold text-violet-300">
              {partnerAnswer !== null ? "Seleccionó" : "Eligiendo..."}
            </span>
          </div>
        </div>

        {showResult && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center animate-fade-in">
            {currentAnswer === currentQuestion.answerIndex ? (
              <p className="text-green-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5" /> ¡Correcto! Sumas +15 puntos
              </p>
            ) : (
              <p className="text-red-400 font-medium flex items-center justify-center gap-1">
                <XCircle className="w-5 h-5" /> Fallaste. Era: {currentQuestion.options[currentQuestion.answerIndex]}
              </p>
            )}

            <button
              onClick={nextQuestion}
              id="quiz-next-btn"
              className="mt-3 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase rounded-lg shadow cursor-pointer transition active:scale-95"
            >
              {currentQuestionIdx + 1 === quizBank.length ? "Ver Resultados del Juego" : "Siguiente pregunta ➔"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
