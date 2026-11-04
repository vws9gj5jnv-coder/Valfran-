'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EngineScene, ENGINE_DURATION, type EngineLabel } from './EngineScene';

function Ticker({ timeRef, running, freezeAt }: { timeRef: React.MutableRefObject<number>; running: boolean; freezeAt?: number }) {
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [running, invalidate]);
  useFrame((_, delta) => {
    if (freezeAt !== undefined) { timeRef.current = freezeAt; return; }
    if (!running) return;
    timeRef.current += Math.min(delta, 1 / 20);
    if (timeRef.current < ENGINE_DURATION) invalidate();
  });
  return null;
}

export default function EngineCanvas({ running, freezeAt, labels, onReady, onError, quality }: {
  running: boolean; freezeAt?: number; labels: EngineLabel[]; onReady: () => void; onError: () => void; quality: 'high' | 'medium';
}) {
  const timeRef = useRef(freezeAt ?? 0);
  return (
    <Canvas
      frameloop="demand"
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: freezeAt !== undefined }}
      camera={{ fov: 30, near: 0.5, far: 80, position: [-12, 7, 14] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onError(); }, { once: true });
      }}
      aria-hidden="true"
    >
      <Ticker timeRef={timeRef} running={running} freezeAt={freezeAt} />
      <EngineScene timeRef={timeRef} labels={labels} onFirstFrame={onReady} />
    </Canvas>
  );
}
