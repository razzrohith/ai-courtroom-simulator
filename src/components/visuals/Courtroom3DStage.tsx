/**
 * Courtroom3DStage — Procedural Three.js 3D Courtroom Stage
 * Uses React Three Fiber and @react-three/drei
 */

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentRole } from '../../types/courtroom';

interface Courtroom3DStageProps {
  currentSpeaker: AgentRole | null;
  isSpeaking: boolean;
  isActive: boolean;
  judgeName?: string;
  prosecutorName?: string;
  defenseName?: string;
}

// -------------------------------------------------------------
// Stylized 3D Avatar Component
// -------------------------------------------------------------
function StylizedAvatar({ 
  role, 
  isSpeaking, 
  position 
}: { 
  role: AgentRole; 
  isSpeaking: boolean; 
  position: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Design colors
  const bodyColor = role === 'judge' ? '#18181b' : role === 'prosecutor' ? '#0f172a' : '#27272a';
  const headColor = '#e8be91'; // Skin tone
  const hairColor = role === 'judge' ? '#94a3b8' : role === 'prosecutor' ? '#020617' : '#3b2314';
  const highlightColor = role === 'judge' ? '#eab308' : role === 'prosecutor' ? '#3b82f6' : '#22c55e';

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Subtle breathing animation
    groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.015;

    // Active speaking animation
    if (isSpeaking) {
      // Bobbing, slight roll, and scaling pulse
      groupRef.current.position.y = position[1] + Math.sin(time * 12) * 0.05;
      groupRef.current.rotation.y = Math.sin(time * 8) * 0.08;
      groupRef.current.rotation.z = Math.sin(time * 5) * 0.03;
      
      // Make mouth/head bob
      const head = groupRef.current.children[3]; // head is 4th child
      if (head) {
        head.position.y = 1.45 + Math.sin(time * 15) * 0.02;
      }
    } else {
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
      const head = groupRef.current.children[3];
      if (head) {
        head.position.y = 1.45;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Body/Torso (Stylized Coat/Robe Capsule) */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.22, 0.38, 1.2, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* 2. White Collar Neck bands */}
      <mesh position={[0, 1.15, 0.16]}>
        <boxGeometry args={[0.12, 0.06, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      
      {/* Advocate Bands (Double strip) */}
      <mesh position={[-0.04, 0.98, 0.22]}>
        <boxGeometry args={[0.03, 0.18, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.04, 0.98, 0.22]}>
        <boxGeometry args={[0.03, 0.18, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 3. Neck */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 12]} />
        <meshStandardMaterial color={headColor} roughness={0.6} />
      </mesh>

      {/* 4. Head */}
      <mesh castShadow position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={headColor} roughness={0.5} />
      </mesh>

      {/* 5. Hair */}
      <mesh position={[0, 1.55, -0.05]}>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {/* Role Color Badge (underneath pedestal) */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.03, 16]} />
        <meshStandardMaterial color={highlightColor} emissive={highlightColor} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Interactive Camera Controller
// -------------------------------------------------------------
function CameraController({ 
  currentSpeaker, 
  freeLook 
}: { 
  currentSpeaker: AgentRole | null;
  freeLook: boolean;
}) {
  const { camera } = useThree();
  const currentSpeakerRef = useRef<AgentRole | null>(null);

  useFrame(() => {
    if (freeLook) return;

    let targetPos = new THREE.Vector3(0, 3.8, 6.5);
    let targetLook = new THREE.Vector3(0, 1.2, -1.5);

    if (currentSpeaker === 'judge') {
      targetPos.set(0, 2.2, 0.5); // Close-up on Judge Bench
      targetLook.set(0, 1.4, -4.0);
    } else if (currentSpeaker === 'prosecutor') {
      targetPos.set(-1.8, 1.8, 1.2); // Focused left
      targetLook.set(-3.0, 1.2, -1.0);
    } else if (currentSpeaker === 'defense') {
      targetPos.set(1.8, 1.8, 1.2); // Focused right
      targetLook.set(3.0, 1.2, -1.0);
    }

    // Smooth camera transition (lerp)
    camera.position.lerp(targetPos, 0.04);
    
    // Smoothly interpolate lookAt
    // Calculate current look target by projection if needed, or simply apply
    camera.lookAt(targetLook);
  });

  useEffect(() => {
    currentSpeakerRef.current = currentSpeaker;
  }, [currentSpeaker]);

  return null;
}

// -------------------------------------------------------------
// 3D Scene Assets (Procedural Mesh Courtroom)
// -------------------------------------------------------------
function CourtroomScene({ 
  currentSpeaker, 
  isSpeaking 
}: { 
  currentSpeaker: AgentRole | null; 
  isSpeaking: boolean;
}) {
  const spotlightRef = useRef<THREE.SpotLight>(null);

  // Position targets for speaker spotlight
  const speakerPositions: Record<AgentRole, [number, number, number]> = {
    judge: [0, 1.45, -4.0],
    prosecutor: [-3.0, 1.1, -1.0],
    defense: [3.0, 1.1, -1.0]
  };

  useFrame(() => {
    if (spotlightRef.current && currentSpeaker) {
      const pos = speakerPositions[currentSpeaker];
      spotlightRef.current.target.position.set(pos[0], pos[1], pos[2]);
      spotlightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 3]} 
        intensity={0.6} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <pointLight position={[0, 4, -4]} intensity={0.5} color="#ffd700" />
      <pointLight position={[-3, 3, 0]} intensity={0.3} color="#90caf9" />
      <pointLight position={[3, 3, 0]} intensity={0.3} color="#a5d6a7" />

      {/* Active Speaker Spotlight */}
      {currentSpeaker && isSpeaking && (
        <spotLight
          ref={spotlightRef}
          position={[0, 6, 1]}
          angle={0.35}
          penumbra={0.6}
          intensity={9}
          color={currentSpeaker === 'judge' ? '#ffd700' : currentSpeaker === 'prosecutor' ? '#60a5fa' : '#34d399'}
          castShadow
        />
      )}

      {/* Floor - Teak Wood Look */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#3e2723" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Back Wall - Indian Sandstone Beige & Pillars */}
      <mesh position={[0, 3.5, -6]} receiveShadow>
        <boxGeometry args={[16, 7, 0.2]} />
        <meshStandardMaterial color="#d7bf9d" roughness={0.8} />
      </mesh>

      {/* Mahogany Paneling Lower Back Wall */}
      <mesh position={[0, 1, -5.85]}>
        <boxGeometry args={[16, 2, 0.1]} />
        <meshStandardMaterial color="#2d1b10" roughness={0.5} />
      </mesh>

      {/* Columns / Pillars */}
      {[-7, -4.5, 4.5, 7].map((x, idx) => (
        <group key={idx} position={[x, 3.5, -5.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.25, 7, 16]} />
            <meshStandardMaterial color="#eed9be" roughness={0.7} />
          </mesh>
          {/* Gold Capitals/Bases */}
          <mesh position={[0, 3.4, 0]}>
            <cylinderGeometry args={[0.3, 0.25, 0.2, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -3.4, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#3a2512" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Center Law Wheel Emblem - Dharma Chakra */}
      <group position={[0, 4.5, -5.75]}>
        {/* Emblem outer ring */}
        <mesh castShadow rotation={[0, 0, 0]}>
          <torusGeometry args={[0.9, 0.07, 12, 48]} />
          <meshStandardMaterial color="#8d5b27" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Emblem inner circle */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.25, 0.04, 8, 24]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} />
        </mesh>
        {/* Spokes */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI) / 6;
          return (
            <mesh 
              key={i} 
              position={[0.45 * Math.cos(angle), 0.45 * Math.sin(angle), 0]} 
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[0.9, 0.03, 0.03]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} />
            </mesh>
          );
        })}
      </group>

      {/* Side Wall Left */}
      <mesh position={[-8, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 7]} />
        <meshStandardMaterial color="#d7bf9d" roughness={0.8} />
      </mesh>
      
      {/* Side Wall Right */}
      <mesh position={[8, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 7]} />
        <meshStandardMaterial color="#d7bf9d" roughness={0.8} />
      </mesh>

      {/* ========================================================= */}
      {/* 3D FURNITURE (Procedural meshes) */}
      {/* ========================================================= */}
      
      {/* 1. Elevated Judge Bench platform */}
      <mesh position={[0, 0.25, -4.5]} receiveShadow castShadow>
        <boxGeometry args={[4.5, 0.5, 2.5]} />
        <meshStandardMaterial color="#3a2512" roughness={0.7} />
      </mesh>
      {/* Judge Bench front desk */}
      <mesh position={[0, 1.0, -3.8]} receiveShadow castShadow>
        <boxGeometry args={[4.0, 1.0, 0.6]} />
        <meshStandardMaterial color="#5a3b1f" roughness={0.5} />
      </mesh>
      {/* Judge Chair Back */}
      <mesh position={[0, 1.5, -4.9]}>
        <boxGeometry args={[0.7, 1.3, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* 2. Prosecution Counsel Station */}
      <group position={[-3.0, 0, -1.0]}>
        {/* Table */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.8, 0.1, 1.0]} />
          <meshStandardMaterial color="#462d19" roughness={0.5} />
        </mesh>
        {/* Table Legs */}
        {[-0.8, 0.8].map((x, idx) => (
          <mesh key={idx} position={[x, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
        ))}
        {/* Chair */}
        <mesh position={[0, 0.7, 0.7]}>
          <boxGeometry args={[0.5, 0.8, 0.1]} />
          <meshStandardMaterial color="#2d2d30" />
        </mesh>
      </group>

      {/* 3. Defense Counsel Station */}
      <group position={[3.0, 0, -1.0]}>
        {/* Table */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.8, 0.1, 1.0]} />
          <meshStandardMaterial color="#462d19" roughness={0.5} />
        </mesh>
        {/* Table Legs */}
        {[-0.8, 0.8].map((x, idx) => (
          <mesh key={idx} position={[x, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
        ))}
        {/* Chair */}
        <mesh position={[0, 0.7, 0.7]}>
          <boxGeometry args={[0.5, 0.8, 0.1]} />
          <meshStandardMaterial color="#2d2d30" />
        </mesh>
      </group>

      {/* 4. Witness Stand Podium */}
      <group position={[-2.4, 0, -3.2]}>
        <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 1.0, 0.8]} />
          <meshStandardMaterial color="#5a3b1f" roughness={0.6} />
        </mesh>
        {/* Tiny Microphone stand */}
        <mesh position={[0.1, 1.05, 0.1]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
          <meshStandardMaterial color="#222" metalness={0.9} />
        </mesh>
        <mesh position={[0.15, 1.15, 0.15]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </group>

      {/* 5. Evidence Board / Easel Display Stand */}
      <group position={[2.6, 0, -3.4]}>
        {/* Tripod frame */}
        <mesh position={[-0.3, 0.75, 0]} rotation={[0, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.3, 0.75, 0]} rotation={[0, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0, 0.75, -0.3]} rotation={[0.15, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {/* Glow Display Screen */}
        <mesh position={[0, 1.1, 0.05]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial color="#111827" roughness={0.2} />
        </mesh>
        {/* Glowing chart surface */}
        <mesh position={[0, 1.1, 0.08]}>
          <planeGeometry args={[1.1, 0.75]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.15} roughness={0.9} />
        </mesh>
      </group>

      {/* 6. Audience Placeholder Benches (Wood planks in back) */}
      {[-2, 0, 2].map((zOffset) => (
        <group key={zOffset} position={[0, 0, 2.5 + zOffset]}>
          {/* Bench Row Left */}
          <group position={[-3.5, 0, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.5, 0.08, 0.4]} />
              <meshStandardMaterial color="#4a301a" roughness={0.6} />
            </mesh>
            {/* Support legs */}
            {[-1.5, 1.5].map((xOffset) => (
              <mesh key={xOffset} position={[xOffset, 0.12, 0]} castShadow>
                <boxGeometry args={[0.1, 0.24, 0.35]} />
                <meshStandardMaterial color="#3a2512" />
              </mesh>
            ))}
          </group>
          
          {/* Bench Row Right */}
          <group position={[3.5, 0, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.5, 0.08, 0.4]} />
              <meshStandardMaterial color="#4a301a" roughness={0.6} />
            </mesh>
            {/* Support legs */}
            {[-1.5, 1.5].map((xOffset) => (
              <mesh key={xOffset} position={[xOffset, 0.12, 0]} castShadow>
                <boxGeometry args={[0.1, 0.24, 0.35]} />
                <meshStandardMaterial color="#3a2512" />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Spectator/Audience stylized placeholder spheres */}
      {[-3.0, -1.8, 1.8, 3.0].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 2.5]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      ))}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 4.5]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

// -------------------------------------------------------------
// Main 3D Courtroom Stage Component
// -------------------------------------------------------------
export default function Courtroom3DStage({
  currentSpeaker,
  isSpeaking,
  isActive,
  judgeName = 'Judge',
  prosecutorName = 'Prosecutor',
  defenseName = 'Defense'
}: Courtroom3DStageProps) {
  const [freeLook, setFreeLook] = useState(false);

  return (
    <div className="relative w-full h-[400px] bg-[#110803] select-none">
      {/* 3D Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={45} position={[0, 3.8, 6.5]} />
        
        {/* Procedural Scene Objects */}
        <CourtroomScene currentSpeaker={currentSpeaker} isSpeaking={isSpeaking} />

        {/* 3D Stylized Avatars */}
        {/* Judge - Elevated, sitting behind bench */}
        <StylizedAvatar 
          role="judge" 
          isSpeaking={currentSpeaker === 'judge' && isSpeaking} 
          position={[0, 0.75, -4.5]} 
        />
        
        {/* Prosecutor - Left Station */}
        <StylizedAvatar 
          role="prosecutor" 
          isSpeaking={currentSpeaker === 'prosecutor' && isSpeaking} 
          position={[-3.0, 0.45, -1.0]} 
        />
        
        {/* Defense - Right Station */}
        <StylizedAvatar 
          role="defense" 
          isSpeaking={currentSpeaker === 'defense' && isSpeaking} 
          position={[3.0, 0.45, -1.0]} 
        />

        {/* Camera Tracking Controls */}
        <CameraController currentSpeaker={currentSpeaker} freeLook={freeLook} />
        
        {/* Orbit Controls (Only effective if freeLook is enabled) */}
        {freeLook && (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={2}
            maxDistance={9}
            target={[0, 1.2, -1.5]}
          />
        )}
      </Canvas>

      {/* Floating Labels overlay for 3D speakers */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setFreeLook(!freeLook)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md active:scale-95 ${
            freeLook 
              ? 'bg-yellow-600 text-white border-yellow-500 shadow-yellow-950/20' 
              : 'bg-gray-900/80 text-gray-300 border-gray-800 backdrop-blur-sm'
          }`}
          title={freeLook ? "Cinematic tracking is disabled. Drag to orbit." : "Click to look around freely."}
        >
          {freeLook ? '🎥 Camera: Free Look' : '🎥 Camera: Cinematic'}
        </button>
      </div>

      {/* Small floating HUD showing the active speaker name */}
      {isActive && currentSpeaker && (
        <div className="absolute bottom-4 right-4 bg-gray-950/90 border border-gray-800 backdrop-blur-md px-3 py-2 rounded-xl flex items-center gap-2.5 shadow-2xl animate-scale-in text-left">
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
            currentSpeaker === 'judge' ? 'bg-yellow-500' : currentSpeaker === 'prosecutor' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <div>
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Speaking</div>
            <div className="text-xs font-extrabold text-white mt-1 leading-none">
              {currentSpeaker === 'judge' ? judgeName : currentSpeaker === 'prosecutor' ? prosecutorName : defenseName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
