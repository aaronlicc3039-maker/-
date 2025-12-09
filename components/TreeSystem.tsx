import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instance, Instances, Float } from '@react-three/drei';
import { AppState } from '../types';
import { 
  FOLIAGE_COUNT, ORNAMENT_COUNT, TREE_HEIGHT, TREE_RADIUS_BASE, CHAOS_RADIUS, LERP_SPEED,
  COLOR_GOLD_METALLIC, COLOR_EMERALD_DEEP, COLOR_RED_VELVET, COLOR_WARM_WHITE
} from '../constants';

// ---- Utils for Shapes ----

const getRandomSpherePos = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; // Uniform distribution
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

const getTreeConePos = (height: number, baseRadius: number) => {
  const y = (Math.random() * height) - (height / 2); // Center Y
  const normalizedY = (y + height / 2) / height; // 0 to 1
  const currentRadius = baseRadius * (1 - normalizedY);
  
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * currentRadius; // Uniform disk
  
  return new THREE.Vector3(
    r * Math.cos(angle),
    y,
    r * Math.sin(angle)
  );
};

// ---- Components ----

// 1. FOLIAGE (Points)
const Foliage = ({ state }: { state: AppState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positionsChaos, positionsFormed, colors } = useMemo(() => {
    const pChaos = new Float32Array(FOLIAGE_COUNT * 3);
    const pFormed = new Float32Array(FOLIAGE_COUNT * 3);
    const cols = new Float32Array(FOLIAGE_COUNT * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // Chaos
      const c = getRandomSpherePos(CHAOS_RADIUS);
      pChaos[i * 3] = c.x;
      pChaos[i * 3 + 1] = c.y;
      pChaos[i * 3 + 2] = c.z;

      // Formed
      const f = getTreeConePos(TREE_HEIGHT, TREE_RADIUS_BASE);
      pFormed[i * 3] = f.x;
      pFormed[i * 3 + 1] = f.y;
      pFormed[i * 3 + 2] = f.z;

      // Color (Mix of Deep Emerald and Gold)
      if (Math.random() > 0.8) {
        colorObj.set(COLOR_GOLD_METALLIC);
      } else {
        colorObj.set(COLOR_EMERALD_DEEP).lerp(new THREE.Color('#0f3d30'), Math.random());
      }
      cols[i * 3] = colorObj.r;
      cols[i * 3 + 1] = colorObj.g;
      cols[i * 3 + 2] = colorObj.b;
    }
    return { positionsChaos: pChaos, positionsFormed: pFormed, colors: cols };
  }, []);

  useFrame((stateThree, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    
    // Lerp factor
    const targetFactor = state === AppState.FORMED ? 1 : 0;
    // Store current factor in userData to smooth transition
    const currentFactor = pointsRef.current.userData.factor ?? 0;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * 2.0); // Smooth ease
    pointsRef.current.userData.factor = newFactor;

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      const ix = i * 3;
      const x = THREE.MathUtils.lerp(positionsChaos[ix], positionsFormed[ix], newFactor);
      const y = THREE.MathUtils.lerp(positionsChaos[ix + 1], positionsFormed[ix + 1], newFactor);
      const z = THREE.MathUtils.lerp(positionsChaos[ix + 2], positionsFormed[ix + 2], newFactor);

      // Add slight "breathing" noise when formed
      const noise = newFactor > 0.9 ? Math.sin(stateThree.clock.elapsedTime + i) * 0.05 : 0;

      positionAttribute.setXYZ(i, x + noise, y + noise, z + noise);
    }
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={FOLIAGE_COUNT}
          array={positionsChaos.slice()} // Init with Chaos
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={FOLIAGE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

// 2. ORNAMENTS (InstancedMesh)
const Ornaments = ({ state }: { state: AppState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const data = useMemo(() => {
    return Array.from({ length: ORNAMENT_COUNT }).map(() => ({
      chaos: getRandomSpherePos(CHAOS_RADIUS * 0.8),
      formed: getTreeConePos(TREE_HEIGHT - 1, TREE_RADIUS_BASE * 0.9), // Slightly inside
      color: Math.random() > 0.5 ? COLOR_RED_VELVET : (Math.random() > 0.5 ? COLOR_GOLD_METALLIC : COLOR_WARM_WHITE),
      scale: 0.2 + Math.random() * 0.3,
      speed: 0.5 + Math.random(),
    }));
  }, []);

  const tempObj = new THREE.Object3D();

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const targetFactor = state === AppState.FORMED ? 1 : 0;
    const currentFactor = meshRef.current.userData.factor ?? 0;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * 1.5);
    meshRef.current.userData.factor = newFactor;

    data.forEach((d, i) => {
      const pos = new THREE.Vector3().lerpVectors(d.chaos, d.formed, newFactor);
      
      // Floating effect when chaos
      if (newFactor < 0.5) {
         pos.y += Math.sin(stateThree.clock.elapsedTime * d.speed + i) * 0.05;
         tempObj.rotation.set(
            stateThree.clock.elapsedTime * d.speed * 0.2,
            stateThree.clock.elapsedTime * d.speed * 0.1,
            0
         );
      } else {
        // Stabilize rotation when formed
        tempObj.rotation.set(0, 0, 0);
      }

      tempObj.position.copy(pos);
      tempObj.scale.setScalar(d.scale * (0.5 + 0.5 * newFactor)); // Grow slightly when forming
      tempObj.updateMatrix();
      meshRef.current?.setMatrixAt(i, tempObj.matrix);
      meshRef.current?.setColorAt(i, d.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ORNAMENT_COUNT]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        emissive={new THREE.Color('#440000')} 
        emissiveIntensity={0.2} 
      />
    </instancedMesh>
  );
};

// 3. POLAROIDS (Floating Photos)
interface PolaroidProps {
  textureUrl: string;
  initialPos: THREE.Vector3;
  chaosPos: THREE.Vector3;
  state: AppState;
  delay: number;
}

const Polaroid: React.FC<PolaroidProps> = ({ 
  textureUrl, 
  initialPos, 
  chaosPos, 
  state, 
  delay 
}) => {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => new THREE.TextureLoader().load(textureUrl), [textureUrl]);

  useFrame((stateThree, delta) => {
    if (!mesh.current) return;
    
    const targetFactor = state === AppState.FORMED ? 1 : 0;
    // Individual lerp tracking for staggered effect could be added here
    const currentFactor = mesh.current.userData.factor ?? 0;
    const newFactor = THREE.MathUtils.lerp(currentFactor, targetFactor, delta * 1.2);
    mesh.current.userData.factor = newFactor;

    const pos = new THREE.Vector3().lerpVectors(chaosPos, initialPos, newFactor);
    
    // Luxury floating animation
    const t = stateThree.clock.elapsedTime;
    pos.y += Math.sin(t + delay) * 0.2;
    
    mesh.current.position.copy(pos);
    
    // Look at center-ish but keep upright mostly
    mesh.current.lookAt(0, pos.y, 0);
    mesh.current.rotation.z = Math.sin(t * 0.5 + delay) * 0.1; // Gentle sway
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1.5, 1.8]} />
      {/* Front: Image */}
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} side={THREE.FrontSide} />
      {/* Back: Paper */}
      <meshStandardMaterial color="#f0f0f0" side={THREE.BackSide} />
    </mesh>
  );
};

// 4. MAIN TREE SYSTEM
const TreeSystem = ({ state }: { state: AppState }) => {
  // Polaroids setup
  const polaroids = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      // Spiral placement around tree
      const angle = (i / 8) * Math.PI * 2;
      const y = -4 + i * 1.5;
      const r = TREE_RADIUS_BASE * 1.2 * (1 - (y + 4) / 14) + 2; // Slightly outside foliage
      
      return {
        id: i,
        url: `https://picsum.photos/300/400?random=${i + 100}`,
        formedPos: new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)),
        chaosPos: getRandomSpherePos(CHAOS_RADIUS * 1.2),
        delay: i * 0.5
      };
    });
  }, []);

  return (
    <group>
      <Foliage state={state} />
      <Ornaments state={state} />
      {polaroids.map(p => (
        <Polaroid 
          key={p.id} 
          textureUrl={p.url} 
          initialPos={p.formedPos} 
          chaosPos={p.chaosPos}
          state={state} 
          delay={p.delay}
        />
      ))}
      {/* Star on top */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         <mesh position={[0, TREE_HEIGHT / 2 + 0.5, 0]} scale={state === AppState.FORMED ? 1 : 0.01}>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial 
              color={COLOR_GOLD_METALLIC} 
              emissive={COLOR_GOLD_METALLIC}
              emissiveIntensity={2}
              roughness={0}
              metalness={1}
            />
         </mesh>
      </Float>
    </group>
  );
};

export default TreeSystem;