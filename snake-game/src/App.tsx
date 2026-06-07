/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Gamepad2, 
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Cpu
} from "lucide-react";

// Grid config
const GRID_SIZE = 20;

interface Particle {
  id: number;
  x: number;
  y: number;
}

export default function App() {
  // Game states
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 9, y: 10 },
  ]);
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("panaversity_snake_highscore");
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  
  // Game Speed presets (ticks in ms)
  const [speed, setSpeed] = useState<number>(95); 
  const [difficulty, setDifficulty] = useState<"Zen" | "Classic" | "Swift">("Classic");
  
  const [collisionType, setCollisionType] = useState<"WALL" | "SELF" | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Direction refs
  const directionRef = useRef<"UP" | "DOWN" | "LEFT" | "RIGHT" | null>(null);
  const nextDirectionRef = useRef<"UP" | "DOWN" | "LEFT" | "RIGHT" | null>(null);

  // High score synchronizer
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("panaversity_snake_highscore", score.toString());
    }
  }, [score, highScore]);

  // Spawn food at valid random screen coord
  const spawnFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    let onSnake = true;
    while (onSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      onSnake = currentSnake.some(
        (segment) => segment.x === newFood!.x && segment.y === newFood!.y
      );
    }
    setFood(newFood!);
  }, []);

  // Set initial game states
  const startGame = () => {
    const initialSnake = [{ x: 9, y: 10 }];
    setSnake(initialSnake);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setCollisionType(null);
    setParticles([]);
    directionRef.current = "UP";
    nextDirectionRef.current = "UP";
    spawnFood(initialSnake);
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setSnake([{ x: 9, y: 10 }]);
    setCollisionType(null);
    setParticles([]);
    directionRef.current = null;
    nextDirectionRef.current = null;
  };

  // Main game core logic loop
  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      if (isGameOver || isPaused || !gameStarted) return prevSnake;
      
      const currentDir = nextDirectionRef.current;
      if (!currentDir) return prevSnake;

      const head = prevSnake[0];
      const newHead = { ...head };

      switch (currentDir) {
        case "LEFT":
          newHead.x -= 1;
          break;
        case "RIGHT":
          newHead.x += 1;
          break;
        case "UP":
          newHead.y -= 1;
          break;
        case "DOWN":
          newHead.y += 1;
          break;
      }

      // Check boundary walls hit
      if (
        newHead.x < 0 ||
        newHead.y < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        setCollisionType("WALL");
        return prevSnake;
      }

      // Check eating self segment loop hit
      const hitSelf = prevSnake.some(
        (segment) => segment.x === newHead.x && segment.y === newHead.y
      );
      if (hitSelf) {
        setIsGameOver(true);
        setCollisionType("SELF");
        return prevSnake;
      }

      // Register step dir transition success
      directionRef.current = currentDir;

      // Check eating Red apple
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const newSnake = [newHead, ...prevSnake];

      if (ateFood) {
        // Trigger particle feedback
        const newParticle = {
          id: Date.now(),
          x: food.x,
          y: food.y,
        };
        setParticles((prev) => [...prev, newParticle]);
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        }, 800);

        setScore((s) => s + 1);
        spawnFood(newSnake);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isGameOver, isPaused, gameStarted, spawnFood]);

  // Ticker timer trigger
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const interval = setInterval(() => {
      moveSnake();
    }, speed);
    return () => clearInterval(interval);
  }, [gameStarted, isPaused, isGameOver, speed, moveSnake]);

  // Keyboard listeners
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === " " || e.key === "Spacebar") {
      if (gameStarted && !isGameOver) {
        setIsPaused((prev) => !prev);
      } else if (!gameStarted) {
        startGame();
      }
      return;
    }

    if (e.key.toLowerCase() === "r") {
      resetGame();
      return;
    }

    if (!gameStarted || isPaused || isGameOver) return;

    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (directionRef.current !== "DOWN") nextDirectionRef.current = "UP";
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (directionRef.current !== "UP") nextDirectionRef.current = "DOWN";
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        if (directionRef.current !== "RIGHT") nextDirectionRef.current = "LEFT";
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (directionRef.current !== "LEFT") nextDirectionRef.current = "RIGHT";
        break;
    }
  }, [gameStarted, isPaused, isGameOver]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const touchMove = (dir: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    if (!gameStarted || isPaused || isGameOver) return;
    if (dir === "UP" && directionRef.current !== "DOWN") nextDirectionRef.current = "UP";
    if (dir === "DOWN" && directionRef.current !== "UP") nextDirectionRef.current = "DOWN";
    if (dir === "LEFT" && directionRef.current !== "RIGHT") nextDirectionRef.current = "LEFT";
    if (dir === "RIGHT" && directionRef.current !== "LEFT") nextDirectionRef.current = "RIGHT";
  };

  const handleDifficulty = (diff: "Zen" | "Classic" | "Swift") => {
    setDifficulty(diff);
    if (diff === "Zen") setSpeed(140);
    if (diff === "Classic") setSpeed(95);
    if (diff === "Swift") setSpeed(60);
  };

  // Pre-generate grid matrices coords
  const gridCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      gridCells.push({ x, y });
    }
  }

  // Formatting helpers for classic score tickers
  const formatScore = (val: number) => {
    return val.toString().padStart(3, "0");
  };

  const difficultyLevels = {
    Zen: { lvl: "02", mult: "0.8x" },
    Classic: { lvl: "05", mult: "1.2x" },
    Swift: { lvl: "09", mult: "1.8x" }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center py-4 px-2 sm:px-6 md:py-10 select-none">
      
      {/* Outer container applying the brutalist "Bold Typography" design */}
      <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-800/80 text-white flex flex-col md:flex-row p-4 sm:p-8 xl:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative gap-4 md:gap-8 rounded-none">
        
        {/* Left Panel: Bold Brand Name & Metrics Block */}
        <div className="w-full md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-805 border-zinc-900 pb-6 md:pb-0 pr-0 md:pr-8 gap-6 md:gap-12">
          
          <div>
            {/* Extremely bold display title */}
            <h1 className="text-[75px] md:text-[90px] xl:text-[110px] font-black leading-[0.8] tracking-tighter text-emerald-500 mb-2">
              SNAKE
            </h1>
            <p className="text-zinc-500 text-[10px] xl:text-xs uppercase tracking-[0.3em] font-bold font-mono">
              Neural Version 2.0.5
            </p>
          </div>

          <div className="space-y-6 xl:space-y-10">
            {/* Live Score Block */}
            <div className="space-y-1">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Current Score</p>
              <p className="text-6xl xl:text-7xl font-mono font-black text-white leading-none">
                {formatScore(score)}
              </p>
            </div>

            {/* High Score Block */}
            <div className="space-y-1">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono">High Score</p>
              <p className="text-3xl xl:text-4xl font-mono font-bold text-zinc-400">
                {formatScore(highScore)}
              </p>
            </div>

            {/* Tactical Game Metrics Grids */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-zinc-900 bg-zinc-900/40 rounded-none">
                <p className="text-zinc-650 text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-1">Level</p>
                <p className="text-xl font-black font-mono">{difficultyLevels[difficulty].lvl}</p>
              </div>
              <div className="p-4 border border-zinc-900 bg-zinc-900/40 rounded-none col-span-1">
                <p className="text-zinc-650 text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-1">Speed</p>
                <p className="text-xl font-black font-mono text-emerald-400">{difficultyLevels[difficulty].mult}</p>
              </div>
            </div>
          </div>

          {/* Quick instructions indicator */}
          <div className="hidden md:flex flex-col gap-2 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="px-2 py-0.5 border border-zinc-800 text-[9px] font-mono text-zinc-300">W-A-S-D</div>
              <span className="text-[10px] uppercase font-mono tracking-wider">To steering</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="px-2 py-0.5 border border-zinc-800 text-[9px] font-mono text-zinc-300">SPACE</div>
              <span className="text-[10px] uppercase font-mono tracking-wider">To Pause/Run</span>
            </div>
          </div>

        </div>

        {/* Right Panel: Active Arcade Screen Frame & Action Footer controls */}
        <div className="w-full md:w-2/3 flex flex-col pl-0 md:pl-2 justify-between">
          
          {/* Main Visual monitor Frame */}
          <div className="flex-1 relative border-[12px] border-zinc-900 bg-[#070b12] shadow-[0_0_50px_rgba(16,185,129,0.02)] min-h-[340px] md:min-h-[440px] aspect-square w-full rounded-none overflow-hidden flex flex-col items-center justify-center p-2">
            
            {/* Fine high-tech radial grid backdrop texture */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none z-0" 
              style={{ 
                backgroundImage: "radial-gradient(#34d399 1px, transparent 1px)", 
                backgroundSize: "20px 20px" 
              }} 
            />

            {/* Interactive Grid Map */}
            <div 
              className="w-full h-full grid gap-[1px] bg-transparent rounded-none overflow-hidden relative"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` 
              }}
            >
              {gridCells.map((cell) => {
                const headSegment = snake[0];
                const isHead = headSegment && headSegment.x === cell.x && headSegment.y === cell.y;
                const isBody = snake.slice(1).some(
                  (segment) => segment.x === cell.x && segment.y === cell.y
                );
                const isFood = food.x === cell.x && food.y === cell.y;
                const cellParticle = particles.find((p) => p.x === cell.x && p.y === cell.y);

                return (
                  <div
                    id={`cell-${cell.x}-${cell.y}`}
                    key={`${cell.x}-${cell.y}`}
                    className={`relative rounded-none flex items-center justify-center ${
                      isHead
                        ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] z-20"
                        : isBody
                        ? "bg-emerald-600/70"
                        : ""
                    }`}
                  >
                    {/* Tiny particle animation */}
                    {cellParticle && (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 1, y: 0 }}
                        animate={{ scale: 1.6, opacity: 0, y: -25 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="absolute inset-x-0 -top-4 flex items-center justify-center text-emerald-300 font-extrabold text-[12px] font-mono z-30 pointer-events-none"
                      >
                        +1
                      </motion.div>
                    )}

                    {/* Bold design food node */}
                    {isFood && (
                      <motion.div
                        animate={{ scale: [0.85, 1.1, 0.85] }}
                        transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                        className="absolute inset-1 bg-gradient-to-tr from-rose-500 to-red-600 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.7)] z-10 flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </motion.div>
                    )}

                    {/* Flat brutal eyes on snake head segment */}
                    {isHead && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`flex gap-[2px] ${
                          directionRef.current === "UP" || directionRef.current === "DOWN" ? "flex-row" : "flex-col"
                        }`}>
                          <div className="w-[3px] h-[3px] bg-black rounded-none" />
                          <div className="w-[3px] h-[3px] bg-black rounded-none" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Display overlay screens matching original exact mechanics */}
            <AnimatePresence>
              
              {/* 1. Launcher State Screen */}
              {!gameStarted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/95 z-30 flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative">
                      <Gamepad2 className="w-7 h-7 text-emerald-400" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-widest font-mono text-zinc-100">
                        Select Core Speed
                      </h2>
                    </div>

                    {/* Brutalist Speed tab selectors */}
                    <div className="bg-zinc-900 border border-zinc-800 p-1 flex gap-1 w-full max-w-[280px]">
                      {(["Zen", "Classic", "Swift"] as const).map((diff) => (
                        <button
                          id={`diff-btn-${diff}`}
                          key={diff}
                          onClick={() => handleDifficulty(diff)}
                          className={`flex-1 py-1.5 px-3 font-bold font-mono text-xs tracking-wider transition-colors uppercase ${
                            difficulty === diff
                              ? "bg-white text-black"
                              : "text-zinc-550 text-zinc-500 hover:text-white"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>

                    <button
                      id="start-game-btn"
                      onClick={startGame}
                      className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                      <Play className="w-4 h-4 fill-current text-black" />
                      BOOT EMULATOR
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* 2. Game-Over Screen */}
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/95 z-30 flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-4 max-w-sm"
                  >
                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter font-mono">
                        TERMINATED
                      </h2>
                      <p className="text-[10px] text-zinc-400/80 mt-1 font-mono tracking-widest">
                        {collisionType === "WALL" 
                          ? "💥 CORE BOUNDARY IMPACT" 
                          : "🌀 MATRIX FEEDBACK LOOP"}
                      </p>
                    </div>

                    <div className="flex gap-4 w-full bg-zinc-900 border border-zinc-800 p-4 my-2 text-left">
                      <div className="flex-1 text-center border-r border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">SCORE</p>
                        <p className="text-3xl font-black text-emerald-400 font-mono mt-0.5">{formatScore(score)}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">BEST RECORD</p>
                        <p className="text-3xl font-black text-zinc-300 font-mono mt-0.5">{formatScore(highScore)}</p>
                      </div>
                    </div>

                    <button
                      id="restart-game-btn"
                      onClick={startGame}
                      className="w-full bg-white hover:bg-emerald-400 hover:text-black text-black font-black text-xs py-3.5 tracking-wider transition-colors uppercase"
                    >
                      REBOOT STREAM
                    </button>

                    <button
                      id="back-menu-btn"
                      onClick={resetGame}
                      className="text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest font-mono mt-1"
                    >
                      Return to console settings
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* 3. Paused Screen */}
              {isPaused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/90 z-30 flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-white/5 border border-zinc-800 flex items-center justify-center animate-pulse">
                      <Pause className="w-5 h-5 text-white fill-current" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-100 font-mono">Stream On Hold</h2>
                    </div>
                    <button
                      id="resume-game-btn"
                      onClick={() => setIsPaused(false)}
                      className="bg-white hover:bg-emerald-400 hover:text-black text-black font-bold text-xs px-6 py-2.5 tracking-wider uppercase transition-colors"
                    >
                      Resume Stream
                    </button>
                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Micro active layout specs text */}
            <div className="absolute top-4 right-4 flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500/20"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500/50"></div>
              <div className="w-1.5 h-1.5 bg-emerald-500"></div>
            </div>
            
            <div className="absolute bottom-4 left-4 pointer-events-none">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-tighter">
                Buffer Stream: OK // Active Rendering 60FPS
              </p>
            </div>

          </div>

          {/* Quick Steering D-Pad Controllers for Mobile/Touch Frame accessibility */}
          <div className="flex md:hidden flex-col items-center justify-center p-3 mt-4 bg-zinc-900/50 border border-zinc-900 gap-4">
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              
              <div className="absolute w-10 h-10 bg-zinc-950 border border-zinc-800" />

              {/* UP */}
              <button
                id="pad-up-btn"
                onClick={() => touchMove("UP")}
                className="absolute top-0 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:bg-emerald-500 active:text-black transition-all"
                aria-label="Move Up"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* DOWN */}
              <button
                id="pad-down-btn"
                onClick={() => touchMove("DOWN")}
                className="absolute bottom-0 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:bg-emerald-500 active:text-black transition-all"
                aria-label="Move Down"
              >
                <ChevronDown className="w-5 h-5" />
              </button>

              {/* LEFT */}
              <button
                id="pad-left-btn"
                onClick={() => touchMove("LEFT")}
                className="absolute left-0 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:bg-emerald-500 active:text-black transition-all"
                aria-label="Move Left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* RIGHT */}
              <button
                id="pad-right-btn"
                onClick={() => touchMove("RIGHT")}
                className="absolute right-0 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-white active:bg-emerald-500 active:text-black transition-all"
                aria-label="Move Right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 w-full">
              <button
                id="mobile-pause-btn"
                onClick={() => {
                  if (gameStarted && !isGameOver) {
                    setIsPaused(prev => !prev);
                  }
                }}
                disabled={!gameStarted || isGameOver}
                className="flex-1 py-2 text-xs font-mono border border-zinc-800 text-zinc-400 capitalize bg-zinc-950"
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                id="mobile-reset-btn"
                onClick={resetGame}
                className="flex-1 py-2 text-xs font-mono border border-zinc-800 text-zinc-400 capitalize bg-zinc-950"
              >
                Reset
              </button>
            </div>

          </div>

          {/* Action Footer console panel matching exact design specs */}
          <div className="h-auto md:h-20 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Reset/Pause Play Buttons on web layout */}
              <button 
                id="bar-pause-btn"
                onClick={() => {
                  if (gameStarted && !isGameOver) {
                    setIsPaused(prev => !prev);
                  }
                }}
                disabled={!gameStarted || isGameOver}
                className="flex-1 sm:flex-none px-8 py-3 bg-white text-black font-black uppercase tracking-tighter hover:bg-emerald-400 hover:text-black transition-colors rounded-none text-xs disabled:opacity-30 disabled:pointer-events-none"
              >
                {isPaused ? "RESUME" : "PAUSE GAME"}
              </button>
              
              <button 
                id="bar-reset-btn"
                onClick={resetGame}
                className="flex-1 sm:flex-none px-8 py-3 border border-zinc-800 text-zinc-400 hover:text-white font-bold uppercase tracking-tighter hover:border-zinc-650 transition-colors rounded-none text-xs"
              >
                RESET
              </button>
            </div>

            <div className="flex items-center gap-6 justify-end w-full sm:w-auto">
              <div className="text-right font-mono">
                <p className="text-[10px] text-zinc-500 uppercase">Theme</p>
                <p className="text-xs font-bold text-emerald-400">MONOKAI NEON</p>
              </div>
              <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Small design credits */}
      <div className="text-center mt-6">
        <p className="text-[10px] text-zinc-655 text-zinc-600 font-mono tracking-widest uppercase">
          PANAVERSITY DESIGN LAB • POWERED BY GOOGLE AI STUDIO
        </p>
      </div>

    </div>
  );
}
