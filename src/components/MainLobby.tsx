import React, { useState, useEffect } from "react";
import { Room, Player } from "../types";
import {
  Gamepad2,
  ListFilter,
  UserPlus,
  Trophy,
  Heart,
  Flame,
  Layers,
  Smile,
  Copy,
  Check,
  Zap,
  BookOpen,
  PlusCircle,
  Sparkles,
  Award,
  Lock,
  Compass,
  MapPin,
  Camera,
  Coffee,
  HelpCircle,
  X,
  Plus,
  CheckSquare,
  Sparkle,
  Key
} from "lucide-react";
import CredentialsSafe from "./CredentialsSafe";

interface MainLobbyProps {
  room: Room | null;
  currentPlayer: Player | null;
  onSetUser: (user: Player) => void;
  onCreateRoom: (mood: "romantic" | "spicy" | "funny" | "intellectual") => void;
  onJoinRoom: (roomId: string) => void;
  onStartGame: (gameType: string) => void;
  onLeaveRoom: () => void;
  onSyncChallenges: (updatedScore: any) => void;
}

const AVATAR_PRESETS = ["🤖", "🐱", "🦊", "🐻", "🐨", "🐸", "🐷", "🦁", "🐰", "🐼", "🐙", "❤️", "💖", "🔥", "🦄"];

interface StaticChallenge {
  id: string;
  text: string;
  points: number;
}
const DAILY_CHALLENGES: StaticChallenge[] = [
  { id: "ch1", text: "Darle un beso largo (10 seg) o abrazo sorpresa a tu pareja justo ahora.", points: 20 },
  { id: "ch2", text: "Dile un cumplido/piropo sumamente cursi y sincero sin reírte.", points: 15 },
  { id: "ch3", text: "Cuéntale un recuerdo vergonzoso que nunca le habías compartido.", points: 25 },
  { id: "ch4", text: "Hacer un duelo de miradas serias de 20 segundos. ¡El que parpadee pierde!", points: 15 }
];

export interface CatalogGame {
  id: string;
  mood: "romantic" | "spicy" | "funny" | "intellectual";
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  type: "integrated" | "auxiliary" | "external";
  gameType?: string;
  externalUrl?: string;
  auxData?: {
    type: "vote" | "list" | "deck";
    subtitle: string;
    content: string[];
  };
}

const GAMES_CATALOG: CatalogGame[] = [
  // --- ROMANTIC 💕 (11 Games) ---
  {
    id: "r1",
    mood: "romantic",
    title: "🏎️ Duo Kart: Carrera Cariñosa",
    description: "¡Estilo Mario Kart! Elige tu kart especial, asesta caparazones, plátanos u hongos para ganarle a tu pareja.",
    badge: "ARCADE MULTIPLAYER",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "race"
  },
  {
    id: "r2",
    mood: "romantic",
    title: "🧠 Duelo del Amor & Compatibilidad",
    description: "Test sincronizado en tiempo real de preguntas de alta sintonía afectiva para ver sus compatibilidades.",
    badge: "QUIZ DUO",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "quiz_romantic"
  },
  {
    id: "r3",
    mood: "romantic",
    title: "🎨 Pintura y Arte del Corazón",
    description: "Dibuja un sentimiento, idea o recuerdo de forma abstracta e interactiva, y adivinen lo que el otro plasmó.",
    badge: "CO-OP ART",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "drawing"
  },
  {
    id: "r4",
    mood: "romantic",
    title: "❌ Tres en Raya Romántico",
    description: "La clásica rejilla pero adaptada. Cada que coloques o ganes, se revela un piropo o confesión obligatoria.",
    badge: "MESA TURNOS",
    badgeColor: "bg-violet-500/20 text-violet-350 border-violet-500/20",
    type: "integrated",
    gameType: "board"
  },
  {
    id: "r5",
    mood: "romantic",
    title: "♟️ Damas y Conexión de Almas",
    description: "Conecta 4 en línea. Al bloquear o alinear fichas, charlarán sobre metas de vida, viajes y vuestros sueños de casados.",
    badge: "TÁCTICO ROMÁNTICO",
    badgeColor: "bg-violet-500/20 text-violet-350 border-violet-500/20",
    type: "integrated",
    gameType: "board"
  },
  {
    id: "r6",
    mood: "romantic",
    title: "💖 Cofre de Confesiones Profundas",
    description: "Saca cartas virtuales con preguntas íntimas y románticas cuidadosamente seleccionadas para hablar horas.",
    badge: "CARTAS CHARLA",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Preguntas para un café íntimo",
      content: [
        "¿Cuál fue el preciso instante en el que supiste que te encanto?",
        "¿Qué pequeño detalle tonto mío te hace sonreír cuando no estoy cerca?",
        "Si pudieras revivir un día entero de nuestra relación, ¿cuál elegirías?",
        "¿Cuál es el piropo o mimo que más te gusta recibir de mi parte?",
        "¿Qué sueño o meta loca te gustaría que logremos juntos en los próximos 2 años?"
      ]
    }
  },
  {
    id: "r7",
    mood: "romantic",
    title: "🐰 Jardín de Mimos Exprés",
    description: "Checklist interactivo compartido de gestos dulces inmediatos. ¡Vayan cumpliéndolos y márquenlos como hechos!",
    badge: "TAREAS DULCES",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "list",
      subtitle: "Desafíos cariñosos sincronizados",
      content: [
        "Darle un beso suave de 10 segundos en la mejilla o frente",
        "Hacerle un masaje de cuello o hombros durante 2 minutos",
        "Dedicarle un susurro dulce o poema gracioso",
        "Escribirle en el chat 'Eres mi persona favorita en el universo'",
        "Darle un abrazo de oso largo y tierno en silencio"
      ]
    }
  },
  {
    id: "r8",
    mood: "romantic",
    title: "💑 Sintonía: ¿Quién Es Más Propenso?",
    description: "Encuesta de 5 rondas para votar quién de los dos es el autor definitivo de vuestros hábitos de pareja.",
    badge: "VOTACIÓN CO-OP",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "vote",
      subtitle: "Sondeo de sintonía en pareja",
      content: [
        "¿Quién es más cursi o meloso de los dos en el día a día?",
        "¿Quién se duerme antes viendo una serie en pijama?",
        "¿Quién tarda más vistiéndose y listando su outfit para salir?",
        "¿Quién tiene la risa más ruidosa o contagiosa?",
        "¿Quién planifica los mejores planes o citas sorpresa?"
      ]
    }
  },

  // --- SPICY 🔥 (11 Games) ---
  {
    id: "s1",
    mood: "spicy",
    title: "🎲 Dados de Deseo Coquetos",
    description: "Dúo dinámico de dados virtuales. Combina partes del cuerpo y acciones sensuales para juguetear con picardía.",
    badge: "FIRE DICES",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "spicy_dice"
  },
  {
    id: "s2",
    mood: "spicy",
    title: "🌶️ Verdad o Reto Íntimo",
    description: "Desafía a tu pareja a confesar vuestros gustos más salvajes o cometer retos ardientes en tiempo real.",
    badge: "RETO CALIENTE",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "truth_or_dare"
  },
  {
    id: "s3",
    mood: "spicy",
    title: "🧠 Test Coquetón Sincronizado",
    description: "Quiz ardiente de pareja. Responde preguntas sugerentes y descubre qué tan en sintonía están vuestros impulsos pícantes.",
    badge: "HOT QUIZ",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "quiz_spicy"
  },
  {
    id: "s4",
    mood: "spicy",
    title: "🎮 Damas 4 con Castigos Picantes",
    description: "Alineen sus fichas. Quien reciba un bloqueo de Connect 4 debe cumplir un reto sensual dictado por la pantalla.",
    badge: "MESA COQUETONA",
    badgeColor: "bg-violet-500/20 text-violet-350 border-violet-500/25",
    type: "integrated",
    gameType: "board"
  },
  {
    id: "s5",
    mood: "spicy",
    title: "💋 Cartas Sensuales y Deseos",
    description: "Deck sensual con mandatos sugerentes para poner a prueba vuestra audacia. ¡Toma un naipe prohibido!",
    badge: "CARTAS ERÓTICAS",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Retos íntimos y provocativos",
      content: [
        "Susurrar un deseo íntimo al oído de tu pareja de forma muy lenta.",
        "Darle un beso de telenovela (mínimo 15 seg) con total pasión.",
        "Describir detalladamente una fantasía o lugar loco donde te gustaría estar solitos.",
        "Hacerle un masaje lento en los hombros y cuello soplando suavemente.",
        "Sostenerle la mirada fija y seductora durante 20 segundos sin emitir una palabra."
      ]
    }
  },
  {
    id: "s6",
    mood: "spicy",
    title: "🍒 Sondeo: Quién es Más Atrevido",
    description: "Voten en secreto sobre sus facetas más sensuales y descubran quién gana en audacia íntima.",
    badge: "VOTACIÓN CALIENTE",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "vote",
      subtitle: "Votación íntima de pasiones",
      content: [
        "¿Quién es más propenso a mandar un mensaje pícaro por chat?",
        "¿Quién toma más rápido la iniciativa para los caricias calientes?",
        "¿Quién se distrae más fácil con un roce intencional de manos?",
        "¿Quién tiene las ocurrencias y sueños más atrevidos?",
        "¿Quién prefiere los mimos de noche en vez de mimos de mañana?"
      ]
    }
  },
  {
    id: "s7",
    mood: "spicy",
    title: "🍫 Lista del Termostato",
    description: "Checklist privado de retos y dinámicas sugerentes para realizar en sintonía esta noche. ¡Atrévanse!",
    badge: "CHECKLIST COMPARTIDO",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "list",
      subtitle: "Termostato nocturno",
      content: [
        "Apagar todas las pantallas secundarias y dejar luces tenues",
        "Poner de fondo una playlist sensual o romántica suave",
        "Hacer un masaje en la espalda con crema o aceite oloroso",
        "Hacer cosquillas impredecibles al otro por 30 segundos",
        "Escribirle un mensaje caliente al oído"
      ]
    }
  },
  {
    id: "s8",
    mood: "spicy",
    title: "🧖 Ruleta de las Prendas Virtuales",
    description: "Un deck interactivo de retos graciosos de prendas y bromas sensuales de castigo por jugar.",
    badge: "CARTAS JUEGO",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Castigos de prendas rápidas",
      content: [
        "¡Retírate un calcetín de inmediato de forma graciosa!",
        "Habla con un acento sumamente seductor las próximas dos rondas.",
        "Déjate hacer cosquillas en los pies por 10 segundos enteros.",
        "Baila de forma sensual y ridícula por 15 segundos."
      ]
    }
  },

  // --- FUNNY 🤪 (11 Games) ---
  {
    id: "f1",
    mood: "funny",
    title: "⚔️ Smash Arena: Duelo de Luchadores",
    description: "¡Estilo Smash Bros! Elige tu personaje, lanza bolas de fuego u huevos y lánzalo del ring a mayor % de daño.",
    badge: "SMASH 1V1 ARCADE",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "smash"
  },
  {
    id: "f2",
    mood: "funny",
    title: "🏎️ Duo Kart: Copa Champaña",
    description: "Compite veloz en un circuito loco de velocidad y rebotes. Arroja cáscaras de plátano, estrellas y rayos encogedores.",
    badge: "SPEED RACING",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "race"
  },
  {
    id: "f3",
    mood: "funny",
    title: "🎨 Garabato Loco & Adivinanza",
    description: "Dibuja alocadas consignas humorísticas y haz que tu pareja descifre los bocetos más ridículos posibles.",
    badge: "PINTA Y ADIVINA",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "drawing"
  },
  {
    id: "f4",
    mood: "funny",
    title: "🧠 Quiz de Memes de Novios",
    description: "Divertido duelo de preguntas sobre memes clásicos de la vida, chistes de pareja y situaciones cómicas.",
    badge: "QUIZ GRACIOSO",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "quiz_funny"
  },
  {
    id: "f5",
    mood: "funny",
    title: "💣 Conecta4 Explosión de Bombas",
    description: "Fichas de Damas 4 pero con casillas donde yacen dinamitas virtuales sorpresa. ¿Podrás conectar 4 sin volar?",
    badge: "MESA ACCIÓN",
    badgeColor: "bg-violet-500/20 text-violet-350 border-violet-500/20",
    type: "integrated",
    gameType: "board"
  },
  {
    id: "f6",
    mood: "funny",
    title: "🎤 Deck del que se ríe, ¡Pierde!",
    description: "Muestra chistes cortos y tontos de internet. ¡El primero de los dos que haga un gesto de risa cede 10 puntos!",
    badge: "CONCURSO CHISTES",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Chistes ultra cortos para aguantar la risa",
      content: [
        "¿Qué hace una abeja en el gimnasio?... ¡Zumba! JAJAJA.",
        "¿Qué le dice un jaguar a otro jaguar?... Jaguar you! (How are you).",
        "¿Por qué los pájaros no usan Facebook?... ¡Porque ya tienen Twitter!",
        "¿Cómo se llama el primo vegetariano e intelectual de Bruce Lee?... ¡Broco Lee! 🌱",
        "¿De qué se ríen los programadores informáticos?... De los chistes de 'cookies' tontas."
      ]
    }
  },
  {
    id: "f7",
    mood: "funny",
    title: "🍌 Duelo de Retos Locos Exprés",
    description: "Desafíos delirantes e inesperados en tiempo real. Marque cada reto verificado por vuestra cámara o audio.",
    badge: "CHECKLIST GRACIOSO",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "list",
      subtitle: "Retos de risas inmediatas",
      content: [
        "Hablar simulando un acento extranjero loco los siguientes 3 minutos",
        "Hacer la mueca más ridícula y espantosa frente al otro sin reírte",
        "Cantar una canción infantil imitando a un cantante de ópera trágica",
        "Intentar lamerse el propio codo durante 10 segundos",
        "Completar 5 giros rápidos sobre ti mismo e intentar caminar derecho"
      ]
    }
  },
  {
    id: "f8",
    mood: "funny",
    title: "🫨 Boletas de la Vergüenza Humana",
    description: "Votación de hábitos divertidos y ridículos para delatar las mañas más curiosas de tu ser amado.",
    badge: "ENCUESTA DE COMPLICIDAD",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "vote",
      subtitle: "Votaciones locas de hábitos",
      content: [
        "¿Quién emite los ronquidos o suspiros más graciosos al soñar?",
        "¿Quién hace los berrinches más tiernos cuando no consigue un antojo?",
        "¿Quién se tropieza de la nada con sus propios zapatos en público?",
        "¿Quién se asusta con ruidos pequeños o sombras nocturnas?",
        "¿Quién hace las mejores imitaciones de gatos o perritos tiernos?"
      ]
    }
  },
  {
    id: "f9",
    mood: "funny",
    title: "🏓 Pong Star: Copa Champaña",
    description: "¡Fiebre de Paletas Estilo Nintendo! Elige a tu avatar de Reino Champiñón, adquiere cajas de misiones y desata poderes retro en un enfrentamiento rítmico frenético.",
    badge: "ARCADE DE REBOTE",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "pong"
  },

  // --- INTELLECTUAL 🧠 (11 Games) ---
  {
    id: "i1",
    mood: "intellectual",
    title: "🃏 Memory Match: Parejas del Corazón",
    description: "Clásico juego de memoria de cartas virtuales. Revelen emojis idénticos en el menor número de turnos.",
    badge: "MEMORIA RETO",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "memory_match"
  },
  {
    id: "i2",
    mood: "intellectual",
    title: "🧠 Quiz Táctico de Cultura General",
    description: "Desafío de preguntas estructuradas de ciencias, arte, geografía e historia. ¿Quién comandará la tabla?",
    badge: "BATTLE QUIZ",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    type: "integrated",
    gameType: "quiz"
  },
  {
    id: "i3",
    mood: "intellectual",
    title: "♟️ Damas de Estrategia",
    description: "La cuadrícula estándar de Damas 4 libre de aditamentos, ideal para los amantes del cálculo metódico.",
    badge: "TABLERO PURO",
    badgeColor: "bg-violet-500/20 text-violet-350 border-violet-500/20",
    type: "integrated",
    gameType: "board"
  },
  {
    id: "i5",
    mood: "intellectual",
    title: "🧩 Acertijos Enigmáticos del Detective",
    description: "Baraja con misterios de lógica deducción con respuestas ocultas que deben resolver interactuando.",
    badge: "ACERTIJOS LÓGICA",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Gimnasia cerebral compartida",
      content: [
        "Pregunta: Tengo agujeros pero sigo conteniendo agua de forma estable. ¿Qué soy? (Respuesta: Una Esponja!)",
        "Pregunta: Cuánto más quitas o remueves de mí, más me agrando. ¿Qué soy? (Respuesta: Un hoyo o agujero!)",
        "Pregunta: Si me posees, querrás compartirme. Si me compartes, ya dejas de tenerme. ¿Qué soy? (Respuesta: Un Secreto!)",
        "Pregunta: Corro de día y de noche pero nunca me canso, ni tengo pies. ¿Qué soy? (Respuesta: Un Río!)"
      ]
    }
  },
  {
    id: "i6",
    mood: "intellectual",
    title: "✏️ Tutti Frutti / Stop! Digital",
    description: "Generador de listados de letra aleatoria papel-y-lápiz para una entretenida batalla intelectual de vocabulario.",
    badge: "VOCABULARIO RÁPIDO",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "list",
      subtitle: "Categorías Tutti Frutti de hoy",
      content: [
        "País o Ciudad con la letra 'M' o 'B'",
        "Comida o Fruta con la letra 'P' o 'A'",
        "Profesión u Oficio con la letra 'A' o 'C'",
        "Animal salvaje con la letra 'T' o 'E'",
        "Marca de producto famoso con la letra 'S' o 'L'"
      ]
    }
  },
  {
    id: "i7",
    mood: "intellectual",
    title: "🧭 Duelo Analítico de Personalidad",
    description: "Vota quién es más propenso a resolver problemas lógicos y comparen vuestras capacidades de deducción.",
    badge: "VOTACIÓN CO-OP",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "vote",
      subtitle: "Encuesta de coeficiente mental",
      content: [
        "¿Quién es mejor desarmando y reparando cosas técnicas en casa?",
        "¿Quién tiene mejor orientación espacial y mapas al viajar?",
        "¿Quién ganaría un debate sobre hechos históricos o científicos?",
        "¿Quién lee más libros o noticias analíticas en la semana?",
        "¿Quién descifra acertijos de películas antes de que terminen?"
      ]
    }
  },
  {
    id: "i11",
    mood: "intellectual",
    title: "🧭 Escape Room de Manu & Eve",
    description: "Deck con una serie de enigmas encadenados. Resuélvanlos juntos para poder escapar virtualmente de la recámara de lógica.",
    badge: "ACERTIJOS GRUPALES",
    badgeColor: "bg-emerald-500/20 text-emerald-350 border-emerald-500/25",
    type: "auxiliary",
    auxData: {
      type: "deck",
      subtitle: "Enigmas de salida",
      content: [
        "Tengo 4 patas pero no puedo caminar de ninguna manera. ¿Qué soy? (Respuesta: Una hermosa mesa!)",
        "La persona que lo fabrica no lo necesita. La persona que lo adquiere no lo utiliza. Quien lo usa, nunca se da cuenta. ¿Qué es? (Respuesta: Un ataúd!)"
      ]
    }
  }
];

export default function MainLobby({
  room,
  currentPlayer,
  onSetUser,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  onSyncChallenges,
}: MainLobbyProps) {
  const [nameInput, setNameInput] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("❤️");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomError, setRoomError] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [selectedMood, setSelectedMood] = useState<"romantic" | "spicy" | "funny" | "intellectual">("romantic");
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  
  // Custom states for credentials tab & auxiliary games
  const [activeTab, setActiveTab] = useState<"games" | "safe">("games");
  const [auxGame, setAuxGame] = useState<{ id: string; title: string; subtitle: string; contentList: string[]; type: "vote" | "list" | "deck" } | null>(null);
  const [auxVotes, setAuxVotes] = useState<Record<string, string>>({}); // { questionIndex: playerName }
  const [auxChecklist, setAuxChecklist] = useState<string[]>([]); // list of custom item strings
  const [deckIndex, setDeckIndex] = useState(0);

  // Parse room from URL parameters instantly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setRoomIdInput(roomParam.toUpperCase());
    }
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newPlayer: Player = {
      uid: `player-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: nameInput.trim(),
      avatar: selectedAvatar,
      score: 0,
    };
    onSetUser(newPlayer);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    setRoomError("");
    onJoinRoom(roomIdInput.trim().toUpperCase());
  };

  const copyInviteLink = () => {
    if (!room) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markChallengeCompleted = (challenge: StaticChallenge) => {
    if (completedChallenges.includes(challenge.id) || !room || !currentPlayer) return;

    setCompletedChallenges((prev) => [...prev, challenge.id]);
    const isPlayer1 = room.player1?.uid === currentPlayer.uid;
    const scoreUpdateField = isPlayer1 ? "player1Score" : "player2Score";
    const currentScore = isPlayer1 ? (room.player1?.score || 0) : (room.player2?.score || 0);

    onSyncChallenges({
      [scoreUpdateField]: currentScore + challenge.points,
    });
  };

  const triggerSabotage = (type: "spider" | "shake" | "crack") => {
    if (!room || !currentPlayer) return;

    onSyncChallenges({
      gameState: {
        ...room.gameState,
        sabotageType: type,
        sabotageSender: currentPlayer.name,
        sabotageTime: Date.now(),
      }
    });

    // Play visual feedback trigger sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  // CALCULATE TOTAL COMBINED SCORE FOR MANU & EVE
  const p1S = room?.player1?.score || 0;
  const p2S = room?.player2?.score || 0;
  const combinedScore = p1S + p2S;

  let relationshipLabel = "Nivel: Chispa Inicial";
  let relationshipText = "Sigan jugando minijuegos para encender la sintonía absoluta entre ustedes.";
  if (combinedScore >= 100) {
    relationshipLabel = "Nivel: Almas Gemelas Cómplices";
    relationshipText = "¡Wow! Eve y Manu demuestran una química increíble. ¡Compitiendo y cooperando de maravilla!";
  }
  if (combinedScore >= 300) {
    relationshipLabel = "Nivel: Amor Mítico Legendario 🔥❤️";
    relationshipText = "¡Eve y Manu han superado todos los límites! Su entendimiento, risas y conexión son indestructibles.";
  }

  // Render registration screen
  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto p-8 glass-morphism rounded-3xl text-white shadow-2xl mt-4 relative overflow-hidden group" id="registration-card">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-rose-500/15 blur-3xl rounded-full group-hover:bg-rose-500/25 transition-all"></div>
        <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-violet-500/10 blur-3xl rounded-full"></div>

        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex p-3.5 bg-rose-500/10 text-rose-500 rounded-full animate-pulse-heart mb-3">
            <Heart className="w-8 h-8 fill-rose-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-rose-100">DúoPlay en Pareja</h2>
          <p className="text-xs text-rose-300 mt-1">Regístrate para conectar y jugar en directo</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 tracking-wider uppercase mb-1.5 font-sans">
              Tu Apodo / Nickname
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Escribe tu nombre... Ej. Manu o Eve"
              className="w-full glass-input text-sm px-4 py-3 rounded-xl text-white outline-none font-medium transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 tracking-wider uppercase mb-2 font-sans">
              Elige tu Avatar Emoji
            </label>
            <div className="grid grid-cols-5 gap-2 bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
              {AVATAR_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-2xl p-2 rounded-xl cursor-pointer hover:bg-white/10 transition active:scale-90 ${
                    selectedAvatar === emoji ? "bg-rose-500 border border-rose-400" : "bg-transparent border border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-550 text-white font-display text-sm font-bold uppercase rounded-xl cursor-pointer transition shadow-md hover:shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Ingresar a Jugar
          </button>
        </form>
      </div>
    );
  }

  // If room is not generated yet (Not joined or hosted)
  if (!room) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" id="welcome-lobby">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create room card */}
          <div className="p-6 glass-morphism rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full group-hover:bg-rose-500/25 transition-all"></div>
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-violet-500/5 blur-2xl rounded-full"></div>

            <div className="relative z-10">
              <div className="flex gap-2 items-center mb-4">
                <PlusCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-display font-medium text-rose-100">Crear Sala Privada Eve & Manu</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Inicia una sesión privada sincronizada. Generaremos un código PIN secreto para que tu pareja se conecte en tiempo real contigo desde su dispositivo.
              </p>

              {/* Mood options for lobby initialization */}
              <div className="space-y-2 mb-6">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 block mb-1">
                  Elige la atmósfera / Mood del rincón:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "romantic", label: "Romántico 💕", icon: <Heart className="w-3.5 h-3.5 text-pink-400" /> },
                    { id: "spicy", label: "Coqueto 🔥", icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
                    { id: "funny", label: "Divertido 🤪", icon: <Smile className="w-3.5 h-3.5 text-amber-400" /> },
                    { id: "intellectual", label: "Intelectual 🧠", icon: <Layers className="w-3.5 h-3.5 text-violet-400" /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id as any)}
                      className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer transition ${
                        selectedMood === m.id
                          ? "bg-rose-500/20 border-rose-500 text-rose-100 font-bold"
                          : "bg-black/20 border-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {m.icon}
                      {m.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onCreateRoom(selectedMood)}
              id="create-room-btn"
              className="w-full py-3 bg-rose-600 hover:bg-rose-550 text-white font-display text-xs font-bold uppercase rounded-xl shadow-lg hover:shadow-rose-500/10 cursor-pointer transition active:scale-95 relative z-10"
            >
              🚀 CREAR NUESTRA SALA
            </button>
          </div>

          {/* Join room card */}
          <div className="p-6 glass-morphism rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full group-hover:bg-violet-500/25 transition-all"></div>
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full"></div>

            <form onSubmit={handleJoin} className="space-y-4 relative z-10 w-full">
              <div className="flex gap-2 items-center mb-2">
                <Gamepad2 className="w-5 h-5 text-violet-400 animate-pulse" />
                <h3 className="text-lg font-display font-medium text-rose-100">Unirse con Código</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                ¿Tu pareja ya inició la sala en su pantalla? Escribe el código PIN de 6 letras para unirte a su juego en un par de segundos.
              </p>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 tracking-wider uppercase mb-1 font-mono">
                  Introducir PIN De Sala
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="Ej. AX5T2Z"
                  className="w-full glass-input text-sm font-mono tracking-widest text-center py-3 rounded-xl uppercase outline-none text-white transition"
                />
              </div>

              {roomError && <p className="text-xs text-red-500 font-medium">{roomError}</p>}

              <button
                type="submit"
                id="join-room-btn"
                className="w-full py-3 bg-violet-600 hover:bg-violet-550 text-white font-display text-xs font-bold uppercase rounded-xl cursor-pointer transition active:scale-95"
              >
                Unirse a Mi Pareja ➔
              </button>
            </form>

            <div className="text-[10px] leading-relaxed text-slate-300 p-2.5 border border-white/5 rounded-xl bg-black/20 mt-4 relative z-10">
              💡 **Acceso Rápido**: También puedes pinchar de forma directa en el link que te hayan compartido.
            </div>
          </div>
        </div>

        {/* CUSTOM EXCLUSIVE DASHBOARD OF EVE & MANU (Replaced rankings completely) */}
        <div className="p-6 glass-morphism rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-36 h-36 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse-heart" />
            <h3 className="text-lg font-display font-medium text-rose-100">Rincón Privado de Eve & Manu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-center">
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider">Estado de Conexión Activo 🌸</h4>
              <p className="text-xs text-slate-200 leading-relaxed max-w-xl">
                Este espacio está dedicado en exclusiva para el diario y juegos sincronizados entre <strong>Manu</strong> y <strong>Eve</strong>. No hay tablas de puntuación globales ni extraños, ¡aquí solo compiten el uno contra el otro para avivar la llama de la diversión!
              </p>
              <div className="p-3 bg-black/35 rounded-xl border border-white/10 text-[11px] text-slate-300">
                ⭐ <strong className="text-slate-100">Tip de hoy:</strong> Exploren la atmósfera <strong>Divertido (Funny)</strong> para jugarse sabotajes en la pantalla, o el modo <strong>Coqueto (Spicy)</strong> para poner a prueba los dados coquetos íntimos.
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-rose-500/20 rounded-2xl text-center space-y-2">
              <div className="text-[10px] uppercase font-mono tracking-widest text-rose-400">Total Sincronizado</div>
              <div className="text-3xl font-mono font-bold text-white flex items-center justify-center gap-1.5">
                <span>Manu</span>
                <span className="text-rose-500">💕</span>
                <span>Eve</span>
              </div>
              <p className="text-[10px] text-slate-400">¡Creación constante de bellas memorias!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected lobby layout state
  const isOpponentConnected = !!room.player2;

  // DYNAMIC MOOD DEPENDENT GRAPHICS & SETS
  const renderDynamicGamesDirectory = () => {
    const currentMoodGames = GAMES_CATALOG.filter(g => g.mood === room.mood);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in" id="modular-games-grid">
        {currentMoodGames.map((game) => {
          const isAuxiliary = game.type === "auxiliary";

          return (
            <div
              key={game.id}
              className="p-5 bg-gradient-to-br from-slate-950/90 to-slate-905 border border-white/5 hover:border-rose-500/30 rounded-2xl flex flex-col justify-between hover:shadow-lg hover:shadow-rose-500/5 transition duration-250 relative overflow-hidden group"
            >
              {/* Corner Glow Accents */}
              <div className="absolute -right-6 -top-6 w-16 h-16 bg-rose-500/5 blur-xl rounded-full pointer-events-none group-hover:bg-rose-500/10 transition"></div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide border ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-rose-100 group-hover:text-rose-350 transition leading-snug">
                    {game.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-serif col-span-2">
                    {game.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                {isAuxiliary ? (
                  <button
                    onClick={() => {
                      setAuxGame({
                        id: game.id,
                        title: game.title,
                        subtitle: game.description,
                        contentList: game.auxData?.content || [],
                        type: game.auxData?.type || "deck"
                      });
                    }}
                    className="w-full py-2 bg-emerald-600/25 hover:bg-emerald-600 text-emerald-350 hover:text-white rounded-xl text-center text-xs font-semibold uppercase tracking-wider block transition cursor-pointer"
                  >
                    🎲 Lanzar Desafío Sincro
                  </button>
                ) : (
                  <button
                    disabled={!isOpponentConnected}
                    onClick={() => onStartGame(game.gameType || "race")}
                    className="w-full py-2 bg-rose-600/25 hover:bg-rose-600 disabled:opacity-40 text-rose-300 hover:text-white rounded-xl text-center text-xs font-semibold uppercase tracking-wider block transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isOpponentConnected ? "🎮 Compartir & Iniciar" : "⌛ Esperando Conexión"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isLobbyHost = room.player1?.uid === currentPlayer.uid;
  const moodLabel =
    room.mood === "romantic"
      ? "Romántico 💕"
      : room.mood === "spicy"
      ? "Coqueto / Spicy 🔥"
      : room.mood === "funny"
      ? "Divertido 🤪"
      : "Intelectual 🧠";

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white" id="connected-lobby">
      {/* Code Link banner */}
      <div className="p-4 glass-morphism rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3 relative overflow-hidden group">
        <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-rose-500/10 blur-2xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-2.5 relative z-10">
          <Heart className="w-5 h-5 text-rose-450 animate-pulse-heart fill-rose-500/20" />
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold text-rose-100">
              {isOpponentConnected ? "¡Eve y Manu conectados en tiempo real!" : "Esperando a mi pareja..."}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              Comparte el PIN de acceso o copia el enlace directo para jugar.
            </p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10">
          <div className="bg-black/30 px-3.5 py-1.5 border border-white/10 rounded-xl font-mono text-center">
            <span className="text-[9px] text-slate-300 uppercase block">Sala: {moodLabel}</span>
            <strong className="text-sm tracking-widest text-white uppercase">{room.roomId}</strong>
          </div>

          <button
            onClick={copyInviteLink}
            id="copy-link-btn"
            className="px-3 py-1.5 bg-white/5 hover:bg-white/12 border border-white/10 rounded-xl flex items-center gap-1.5 text-xs text-rose-300 font-semibold cursor-pointer transition active:scale-95 shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "¡Listo!" : "Copiar Enlace"}
          </button>

          <button
            onClick={onLeaveRoom}
            id="leave-lobby-btn"
            className="px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Connection states (2 users view) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Host card */}
        <div className="p-4 glass-morphism rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-rose-500/5 blur-xl rounded-full"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="text-4xl p-2 bg-black/30 rounded-2xl border border-white/10">
              {room.player1?.avatar || "❤️"}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-300">{room.player1?.name} (Host)</h4>
              <p className="text-[10px] text-white/50 font-mono mt-0.5">Jugador 1</p>
            </div>
          </div>
          <div className="text-right relative z-10">
            <span className="text-[9px] text-white/40 block uppercase font-mono">Puntaje</span>
            <strong className="text-lg font-mono text-white">{room.player1?.score || 0} pts</strong>
          </div>
        </div>

        {/* Partner card */}
        <div className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-305 ${
          isOpponentConnected ? "glass-morphism text-white" : "bg-black/30 border border-dashed border-white/10 text-white/45"
        }`}>
          {isOpponentConnected ? (
            <>
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="text-4xl p-2 bg-black/30 rounded-2xl border border-white/10">
                  {room.player2?.avatar || "💖"}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-rose-300">{room.player2?.name}</h4>
                  <p className="text-[10px] text-white/50 font-mono mt-0.5">Jugadora 2 | Partner</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-white/40 block uppercase font-mono">Puntaje</span>
                <strong className="text-lg font-mono text-white">{room.player2?.score || 0} pts</strong>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-white/50 py-2.5 mx-auto animate-pulse">
              <span className="text-2xl">⏳</span>
              <p className="text-xs font-mono">Esperando a que Eve se una...</p>
            </div>
          )}
        </div>
      </div>

      {/* TABS SELECTOR FOR GAMES AND SAFEKEEPER */}
      <div className="flex border-b border-white/10 gap-2 mb-2 p-1 bg-black/25 rounded-2xl max-w-md mx-auto" id="lobby-tabs-bar">
        <button
          onClick={() => setActiveTab("games")}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "games"
              ? "bg-rose-600 text-white shadow-md shadow-rose-650/15"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          Directorio de Juegos
        </button>
        <button
          onClick={() => setActiveTab("safe")}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "safe"
              ? "bg-rose-600 text-white shadow-md shadow-rose-650/15"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Bóveda y Cuentas Sincro
        </button>
      </div>

      {activeTab === "games" ? (
        /* GAMES SECTOR DIRECTORY */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-white/60">
                Juegos recomendados para el Mood: <strong className="text-rose-200">{moodLabel}</strong>
              </h4>
            </div>
          </div>
          {renderDynamicGamesDirectory()}
        </div>
      ) : (
        /* CREDENTIALS/SAFE SECTOR */
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-rose-200" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-white/60">
                Bóveda Segura de Cuentas Sincronizadas
              </h4>
            </div>
          </div>
          <CredentialsSafe
            room={room!}
            currentPlayerName={currentPlayer.name}
            onUpdateRoomState={onSyncChallenges}
          />
        </div>
      )}

      {/* PERSONALIZED DUO PROGRESS CARD */}
      <div className="p-5 glass-morphism rounded-3xl text-white shadow-md relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-white/10 relative z-10">
          <Award className="w-4 h-4 text-rose-450" />
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300">
            Nuestros Logritos de Pareja Sincronizada 🏆
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="inline-block px-3 py-1 bg-rose-500/15 text-rose-300 text-xs rounded-full border border-rose-500/20 font-bold">
              {relationshipLabel}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {relationshipText}
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">SCORE COMBINADO</span>
            <span className="text-2xl font-bold font-mono text-rose-400">{combinedScore} Puntos</span>
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-rose-500 to-violet-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (combinedScore / 400) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-slate-500 mt-1 block">Meta de Sintonía: 400 Pts</span>
          </div>
        </div>
      </div>

      {/* DAILY CHALLENGES CARD */}
      <div className="p-5 glass-morphism rounded-3xl text-white shadow-md relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-white/10 relative z-10">
          <BookOpen className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-300">
            Retos Rápidos Diarios (Comprometerse)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          {DAILY_CHALLENGES.map((ch) => {
            const completed = completedChallenges.includes(ch.id);
            return (
              <div
                key={ch.id}
                className="p-3 bg-black/20 border border-white/10 rounded-xl flex justify-between items-center text-xs"
              >
                <div className="pr-4 leading-relaxed text-slate-300">
                  {ch.text}
                </div>

                <button
                  onClick={() => markChallengeCompleted(ch)}
                  disabled={completed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition ${
                    completed
                      ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                      : "bg-rose-500 hover:bg-rose-600 text-white active:scale-95 shadow"
                  }`}
                >
                  {completed ? "✓ Hecho" : `Cumplir (+${ch.points})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AUXILIARY DETAILED MODAL GAME */}
      {auxGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in" id="auxiliary-game-modal">
          <div className="bg-slate-950 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-5 text-white">
            <button
              onClick={() => {
                setAuxGame(null);
                setAuxVotes({});
                setAuxChecklist([]);
                setDeckIndex(0);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
              id="close-aux-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-mono rounded font-bold uppercase tracking-wider">
                🎲 Mini Desafío Sincronizado
              </span>
              <h3 className="text-xl font-display font-semibold text-rose-250">{auxGame.title}</h3>
              <p className="text-xs text-slate-400 font-serif leading-relaxed">{auxGame.subtitle}</p>
            </div>

            {/* VOTE MODE */}
            {auxGame.type === "vote" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-350 bg-white/5 p-2 rounded-lg leading-normal">
                  Responde las preguntas votando por ti o tu pareja en voz alta y registren sus votos aquí:
                </p>
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {auxGame.contentList.map((q, idx) => (
                    <div key={idx} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                      <p className="text-xs font-semibold leading-normal text-slate-200">{idx + 1}. {q}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {["Manu", "Eve"].map((name) => (
                          <button
                            key={name}
                            onClick={() => setAuxVotes(prev => ({ ...prev, [idx]: name }))}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              auxVotes[idx] === name
                                ? "bg-rose-600 border-rose-550 text-white"
                                : "bg-white/5 border-white/10 text-slate-350 hover:bg-white/10"
                            }`}
                          >
                            👉 Voto por {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/25 text-[11px] text-rose-200 text-center leading-normal">
                  Sincronización de votos: ¡Abran vuestros micrófonos y debatan por qué!
                </div>
              </div>
            )}

            {/* CHECKLIST MODE */}
            {auxGame.type === "list" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-350 bg-white/5 p-2 rounded-lg leading-normal">
                  Retos acumulativos rápidos. Rétalo y márcalo aquí cuando lo complete:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {auxGame.contentList.map((item, idx) => {
                    const isChecked = auxChecklist.includes(item);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isChecked) {
                            setAuxChecklist(prev => prev.filter(i => i !== item));
                          } else {
                            setAuxChecklist(prev => [...prev, item]);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                          isChecked
                            ? "bg-emerald-950/35 border-emerald-500/40 text-emerald-300"
                            : "bg-black/30 border-white/5 text-slate-350 hover:bg-white/5"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isChecked ? 'bg-emerald-600 border-emerald-500' : 'border-white/20'}`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs leading-snug">{item}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 text-center font-mono uppercase tracking-wide">
                  ¡Hitos logrados: {auxChecklist.length} de {auxGame.contentList.length}!
                </p>
              </div>
            )}

            {/* DECK FLASHCARD MODE */}
            {auxGame.type === "deck" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-rose-950/20 to-slate-950 p-6 rounded-2xl border border-rose-500/20 text-center min-h-[160px] flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                  <div className="absolute right-3 top-3"><Sparkles className="w-4 h-4 text-rose-450 animate-pulse" /></div>
                  <p className="text-sm font-semibold max-w-xs leading-relaxed text-rose-100">{auxGame.contentList[deckIndex]}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={deckIndex === 0}
                    onClick={() => setDeckIndex(prev => prev - 1)}
                    className="flex-1 py-2 bg-slate-800 disabled:opacity-50 text-xs rounded-xl cursor-pointer hover:bg-slate-700 transition"
                  >
                    ◀ Carta Previa
                  </button>
                  <button
                    disabled={deckIndex === auxGame.contentList.length - 1}
                    onClick={() => setDeckIndex(prev => prev + 1)}
                    className="flex-1 py-2 bg-rose-600 disabled:opacity-50 text-xs rounded-xl text-white cursor-pointer font-bold hover:bg-rose-700 transition"
                  >
                    Siguiente Carta ▶
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center block font-mono">
                  Naipe virtual: {deckIndex + 1} de {auxGame.contentList.length}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setAuxGame(null);
                setAuxVotes({});
                setAuxChecklist([]);
                setDeckIndex(0);
              }}
              className="w-full py-2.5 bg-rose-600/35 hover:bg-rose-600 text-xs font-semibold rounded-xl text-center cursor-pointer transition text-white"
            >
              Listo, Guardar Mini-Juego
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
