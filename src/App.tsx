/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Game } from './game/main';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new Game(containerRef.current);
    return () => {
      game.dispose();
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      <div ref={containerRef} className="absolute inset-0 z-10 game-container" />
      <div className="absolute top-[10px] left-[10px] text-white pointer-events-none text-[8px] sm:text-[10px] font-mono bg-black p-[6px] rounded-[8px] z-20 opacity-70 max-w-[70%] leading-relaxed">
        <strong>Desktop:</strong> WASD to move, Mouse drag to look, Shift to run, Space to jump.<br/>
        <strong>Mobile:</strong> Left side drag to move, Right side drag to look.
      </div>
      <div className="absolute top-[10px] right-[10px] text-white pointer-events-none text-[10px] font-mono bg-black p-[6px] rounded-[8px] z-20 opacity-70">
        3D Third-Person Controller
      </div>
    </div>
  );
}

