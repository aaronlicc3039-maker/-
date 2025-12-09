import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import TreeSystem from './TreeSystem';
import { AppState } from '../types';

interface SceneProps {
  appState: AppState;
}

const Scene: React.FC<SceneProps> = ({ appState }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
      shadows
    >
      <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
      
      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={40} 
        autoRotate={appState === AppState.CHAOS} // Spin slowly when in Chaos
        autoRotateSpeed={0.5}
      />

      {/* Lighting: Luxury Lobby Vibe */}
      <Environment preset="lobby" background={false} />
      <ambientLight intensity={0.2} color="#001100" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#fffaea" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ffd700" />

      {/* Main Content */}
      <Suspense fallback={null}>
        <TreeSystem state={appState} />
      </Suspense>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#000500', 10, 50]} />
    </Canvas>
  );
};

export default Scene;
