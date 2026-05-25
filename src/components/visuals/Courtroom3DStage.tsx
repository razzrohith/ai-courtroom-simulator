/**
 * Courtroom3DStage — Procedural Three.js 3D Courtroom Stage
 * Uses React Three Fiber and @react-three/drei
 */

import { useRef, useState } from 'react';
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
  admittedEvidenceCount?: number;
  evidenceRef?: string | null;
  isRuling?: boolean;
  isVerdictActive?: boolean;
  verdictDecision?: string | null;
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
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const speechGroupRef = useRef<THREE.Group>(null);
  
  // Design colors
  const bodyColor = role === 'judge' ? '#18181b' : role === 'prosecutor' ? '#1e293b' : '#3f3f46';
  const headColor = '#e8be91'; // Skin tone
  const hairColor = role === 'judge' ? '#a1a1aa' : role === 'prosecutor' ? '#09090b' : '#543d2b';
  const highlightColor = role === 'judge' ? '#eab308' : role === 'prosecutor' ? '#3b82f6' : '#22c55e';

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Subtle breathing animation
    groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.012;

    // Active speaking animations
    if (isSpeaking) {
      // Bobbing, slight roll, and scaling pulse
      groupRef.current.position.y = position[1] + Math.sin(time * 12) * 0.045;
      groupRef.current.rotation.y = Math.sin(time * 8) * 0.06;
      groupRef.current.rotation.z = Math.sin(time * 5) * 0.02;
      
      // Make head bob
      const head = groupRef.current.getObjectByName('head-mesh');
      if (head) {
        head.position.y = 1.45 + Math.sin(time * 15) * 0.015;
      }

      // Animate mouth opening (scaling Y)
      const mouth = groupRef.current.getObjectByName('mouth-mesh');
      if (mouth) {
        const mouthScale = 1.0 + Math.abs(Math.sin(time * 20)) * 2.5;
        mouth.scale.set(1.0, mouthScale, 1.0);
        mouth.position.y = 1.38 - Math.abs(Math.sin(time * 20)) * 0.015;
      }
    } else {
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
      const head = groupRef.current.getObjectByName('head-mesh');
      if (head) {
        head.position.y = 1.45;
      }
      const mouth = groupRef.current.getObjectByName('mouth-mesh');
      if (mouth) {
        mouth.scale.set(1.0, 1.0, 1.0);
        mouth.position.y = 1.38;
      }
    }

    // Pulse Ring animation
    if (pulseRingRef.current) {
      if (isSpeaking) {
        const pulseCycle = (time * 1.8) % 1.0;
        const scale = 1.0 + pulseCycle * 0.8;
        pulseRingRef.current.scale.set(scale, 1, scale);
        // @ts-ignore
        if (pulseRingRef.current.material) {
          // @ts-ignore
          pulseRingRef.current.material.opacity = (1.0 - pulseCycle) * 0.7;
        }
        pulseRingRef.current.visible = true;
      } else {
        pulseRingRef.current.visible = false;
      }
    }

    // Speech Visualizer Waves above head
    if (speechGroupRef.current) {
      if (isSpeaking) {
        speechGroupRef.current.visible = true;
        speechGroupRef.current.children.forEach((child, idx) => {
          const offset = idx * 1.5;
          child.scale.setScalar(0.7 + Math.sin(time * 15 + offset) * 0.3);
          child.position.y = 1.9 + Math.sin(time * 12 + offset) * 0.08;
        });
      } else {
        speechGroupRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Torso/Shoulders (Dignified Suit/Robe Outline) */}
      <group>
        {/* Torso core */}
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.22, 0.36, 1.1, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        {/* Shoulders plate */}
        <mesh castShadow position={[0, 0.95, 0]}>
          <boxGeometry args={role === 'judge' ? [0.65, 0.25, 0.36] : [0.54, 0.2, 0.32]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        
        {/* Sleeves */}
        {/* Left Sleeve */}
        <mesh castShadow position={[-0.26, 0.58, 0.02]} rotation={[0, 0, 0.12]}>
          <cylinderGeometry args={[0.08, 0.05, 0.55, 12]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        {/* Left Cuff & Hand */}
        <mesh position={[-0.29, 0.28, 0.03]}>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh castShadow position={[-0.29, 0.22, 0.03]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={headColor} roughness={0.4} />
        </mesh>

        {/* Right Sleeve */}
        <mesh castShadow position={[0.26, 0.58, 0.02]} rotation={[0, 0, -0.12]}>
          <cylinderGeometry args={[0.08, 0.05, 0.55, 12]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        {/* Right Cuff & Hand */}
        <mesh position={[0.29, 0.28, 0.03]}>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh castShadow position={[0.29, 0.22, 0.03]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={headColor} roughness={0.4} />
        </mesh>
      </group>

      {/* 2. White Collar Neck bands */}
      <mesh position={[0, 1.15, 0.16]}>
        <boxGeometry args={[0.12, 0.06, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      
      {/* Advocate Bands (Double white strip) */}
      <mesh position={[-0.04, 0.98, 0.22]}>
        <boxGeometry args={[0.03, 0.18, 0.015]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.04, 0.98, 0.22]}>
        <boxGeometry args={[0.03, 0.18, 0.015]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 3. Neck */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.15, 12]} />
        <meshStandardMaterial color={headColor} roughness={0.6} />
      </mesh>

      {/* 4. Head */}
      <mesh name="head-mesh" castShadow position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={headColor} roughness={0.5} />
      </mesh>

      {/* Mouth */}
      <mesh name="mouth-mesh" position={[0, 1.38, 0.21]}>
        <boxGeometry args={[0.07, 0.02, 0.025]} />
        <meshStandardMaterial color="#2d0505" roughness={0.95} />
      </mesh>

      {/* 5. Hair */}
      <mesh position={[0, 1.55, -0.05]}>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>

      {/* Role Color Badge Pedestal */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.03, 16]} />
        <meshStandardMaterial color={highlightColor} emissive={highlightColor} emissiveIntensity={0.25} />
      </mesh>

      {/* Pulsing base highlight ring (Only active when speaking) */}
      <mesh ref={pulseRingRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.42, 0.58, 32]} />
        <meshBasicMaterial color={highlightColor} transparent={true} opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Active speaker speech visualizer waves (floating above head) */}
      <group ref={speechGroupRef} visible={false}>
        {[-0.15, 0, 0.15].map((xOffset, idx) => (
          <mesh key={idx} position={[xOffset, 1.9, 0]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial 
              color={highlightColor} 
              emissive={highlightColor} 
              emissiveIntensity={0.8} 
              roughness={0.1} 
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// Stylized Seated Audience Figure Component
// -------------------------------------------------------------
function SeatedAudienceFigure({ 
  position, 
  color 
}: { 
  position: [number, number, number]; 
  color: string;
}) {
  const headColor = '#e8be91'; // Skin tone
  
  return (
    <group position={position}>
      {/* 1. Torso core */}
      <mesh castShadow receiveShadow position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.11, 0.14, 0.32, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* 2. Shoulders */}
      <mesh castShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[0.26, 0.08, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* 3. Neck */}
      <mesh castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 8]} />
        <meshStandardMaterial color={headColor} roughness={0.6} />
      </mesh>
      {/* 4. Head */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={headColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Interactive Camera Controller
// -------------------------------------------------------------
function CameraController({ 
  currentSpeaker, 
  freeLook,
  isRuling,
  isVerdictActive
}: { 
  currentSpeaker: AgentRole | null;
  freeLook: boolean;
  isRuling?: boolean;
  isVerdictActive?: boolean;
}) {
  const { camera } = useThree();

  useFrame((state) => {
    if (freeLook) return;

    const time = state.clock.getElapsedTime();

    // Default broad view of deeper courtroom
    let targetPos = new THREE.Vector3(0, 4.4, 8.5);
    let targetLook = new THREE.Vector3(0, 1.3, -2.5);

    if (isVerdictActive) {
      // Slow majestic panning orbit view for verdict ceremony
      const x = Math.sin(time * 0.12) * 4.0;
      const z = 7.8 + Math.cos(time * 0.12) * 1.4;
      targetPos.set(x, 4.4 + Math.sin(time * 0.25) * 0.3, z);
      targetLook.set(0, 1.35, -2.5);
    } else if (isRuling) {
      // Focus intensely on Judge Bench during ruling
      targetPos.set(0, 2.3, -1.8);
      targetLook.set(0, 1.55, -5.5);
    } else if (currentSpeaker === 'judge') {
      targetPos.set(0, 2.3, -1.6); // Close-up on elevated Judge Bench
      targetLook.set(0, 1.55, -5.5);
    } else if (currentSpeaker === 'prosecutor') {
      targetPos.set(-1.6, 1.9, 0.2); // Focused left desk
      targetLook.set(-3.0, 1.25, -2.0);
    } else if (currentSpeaker === 'defense') {
      targetPos.set(1.6, 1.9, 0.2); // Focused right desk
      targetLook.set(3.0, 1.25, -2.0);
    }

    // Smooth camera transition (lerp)
    camera.position.lerp(targetPos, 0.045);
    
    // Smoothly apply camera look target
    const currentLook = new THREE.Vector3(0, 0, -1);
    currentLook.applyQuaternion(camera.quaternion);
    const lookSpeed = 0.05;
    
    const targetDirection = new THREE.Vector3().subVectors(targetLook, camera.position).normalize();
    const resultDirection = currentLook.lerp(targetDirection, lookSpeed).normalize();
    
    const targetTarget = new THREE.Vector3().addVectors(camera.position, resultDirection);
    camera.lookAt(targetTarget);
  });

  return null;
}

// -------------------------------------------------------------
// Reusable Procedural Props
// -------------------------------------------------------------

function LawBooks({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const bookColors = ['#7f1d1d', '#1e3a8a', '#14532d', '#451a03'];
  return (
    <group position={position} rotation={rotation}>
      {/* Book 1 - Standing vertical */}
      <mesh position={[-0.1, 0.1, 0]} castShadow>
        <boxGeometry args={[0.04, 0.18, 0.14]} />
        <meshStandardMaterial color={bookColors[0]} roughness={0.7} />
      </mesh>
      {/* Spine Accent */}
      <mesh position={[-0.1, 0.1, 0.071]}>
        <boxGeometry args={[0.042, 0.035, 0.004]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Book 2 - Leaning slightly */}
      <mesh position={[0, 0.095, 0.015]} rotation={[0, 0, -0.16]} castShadow>
        <boxGeometry args={[0.04, 0.18, 0.14]} />
        <meshStandardMaterial color={bookColors[1]} roughness={0.6} />
      </mesh>
      {/* Leaning spine Accent */}
      <group position={[0, 0.095, 0.015]} rotation={[0, 0, -0.16]}>
        <mesh position={[0, 0, 0.071]}>
          <boxGeometry args={[0.042, 0.035, 0.004]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
      </group>
      
      {/* Book 3 - Flat Stack of 2 books */}
      <group position={[0.16, 0.02, -0.01]}>
        {/* Bottom book */}
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.16, 0.025, 0.2]} />
          <meshStandardMaterial color={bookColors[2]} roughness={0.7} />
        </mesh>
        {/* Top book */}
        <mesh position={[0.01, 0.033, 0.005]} rotation={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.15, 0.025, 0.19]} />
          <meshStandardMaterial color={bookColors[3]} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function DocumentStack({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stack of sheets */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.26]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
      {/* Manila folder jacket on top */}
      <mesh position={[0.01, 0.032, 0.005]} rotation={[0, -0.08, 0]} castShadow>
        <boxGeometry args={[0.21, 0.006, 0.27]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
    </group>
  );
}

function TableMicrophone({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.012, 10]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>
      {/* Flex neck stem */}
      <mesh position={[0, 0.1, -0.01]} rotation={[0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
        <meshStandardMaterial color="#27272a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Foam Capsule */}
      <mesh position={[0, 0.18, -0.03]}>
        <sphereGeometry args={[0.016, 10, 10]} />
        <meshStandardMaterial color="#0c0a09" roughness={0.9} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// 3D Scene Assets (Procedural Mesh Courtroom)
// -------------------------------------------------------------
function CourtroomScene({ 
  currentSpeaker, 
  isSpeaking,
  admittedEvidenceCount = 0,
  evidenceRef = null,
  isRuling = false,
  isVerdictActive = false,
  verdictDecision = null
}: { 
  currentSpeaker: AgentRole | null; 
  isSpeaking: boolean;
  admittedEvidenceCount: number;
  evidenceRef?: string | null;
  isRuling?: boolean;
  isVerdictActive?: boolean;
  verdictDecision?: string | null;
}) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const rulingSpotlightRef = useRef<THREE.SpotLight>(null);
  const verdictSpotlightRef = useRef<THREE.SpotLight>(null);
  const winnerSpotlightRef = useRef<THREE.SpotLight>(null);
  const evidenceSpotlightRef = useRef<THREE.SpotLight>(null);

  // Position targets for speaker spotlight
  const speakerPositions: Record<AgentRole, [number, number, number]> = {
    judge: [0, 1.55, -5.5],
    prosecutor: [-3.0, 1.1, -2.0],
    defense: [3.0, 1.1, -2.0]
  };

  useFrame(() => {
    // Speaker spotlight
    if (spotlightRef.current && currentSpeaker) {
      const pos = speakerPositions[currentSpeaker];
      spotlightRef.current.target.position.set(pos[0], pos[1], pos[2]);
      spotlightRef.current.target.updateMatrixWorld();
    }
    // Ruling spotlight
    if (rulingSpotlightRef.current) {
      rulingSpotlightRef.current.target.position.set(0, 1.15, -5.5);
      rulingSpotlightRef.current.target.updateMatrixWorld();
    }
    // Verdict spotlight
    if (verdictSpotlightRef.current) {
      verdictSpotlightRef.current.target.position.set(0, 1.15, -5.5);
      verdictSpotlightRef.current.target.updateMatrixWorld();
    }
    // Winner spotlight
    if (winnerSpotlightRef.current && verdictDecision) {
      const pos = verdictDecision === 'plaintiff_wins' ? speakerPositions.prosecutor : speakerPositions.defense;
      winnerSpotlightRef.current.target.position.set(pos[0], pos[1], pos[2]);
      winnerSpotlightRef.current.target.updateMatrixWorld();
    }
    // Evidence spotlight
    if (evidenceSpotlightRef.current) {
      evidenceSpotlightRef.current.target.position.set(2.6, 1.1, -4.4);
      evidenceSpotlightRef.current.target.updateMatrixWorld();
    }
  });

  // Dynamic light values
  const ambientIntensity = isVerdictActive ? 0.2 : (isRuling ? 0.28 : 0.42);
  const dirIntensity = isVerdictActive ? 0.3 : (isRuling ? 0.45 : 0.65);

  return (
    <>
      {/* Ambient Lighting */}
      <ambientLight intensity={ambientIntensity} />
      {/* Directional Key Lighting */}
      <directionalLight 
        position={[4, 9, 4]} 
        intensity={dirIntensity} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
      />
      {/* Secondary Fill Lights */}
      <pointLight position={[0, 4.5, -4.5]} intensity={0.45} color="#ffd700" />
      <pointLight position={[-4, 3, 1]} intensity={0.25} color="#93c5fd" />
      <pointLight position={[4, 3, 1]} intensity={0.25} color="#86efac" />

      {/* Active Speaker Spotlight */}
      {currentSpeaker && isSpeaking && (
        <spotLight
          ref={spotlightRef}
          position={[0, 6.5, 0.5]}
          angle={0.32}
          penumbra={0.7}
          intensity={9.5}
          color={currentSpeaker === 'judge' ? '#fbbf24' : currentSpeaker === 'prosecutor' ? '#60a5fa' : '#4ade80'}
          castShadow
        />
      )}

      {/* Ruling Spotlight (Gold on Judge Bench) */}
      {isRuling && (
        <spotLight
          ref={rulingSpotlightRef}
          position={[0, 6.5, -0.5]}
          angle={0.32}
          penumbra={0.6}
          intensity={16}
          color="#fbbf24"
          castShadow
        />
      )}

      {/* Verdict Spotlights */}
      {isVerdictActive && (
        <>
          <spotLight
            ref={verdictSpotlightRef}
            position={[0, 6.5, -0.5]}
            angle={0.35}
            penumbra={0.5}
            intensity={18}
            color="#fbbf24"
            castShadow
          />
          {(verdictDecision === 'plaintiff_wins' || verdictDecision === 'prosecutor_wins') && (
            <spotLight
              ref={winnerSpotlightRef}
              position={[0, 6.5, 0.5]}
              angle={0.3}
              penumbra={0.6}
              intensity={12}
              color="#60a5fa"
              castShadow
            />
          )}
          {verdictDecision === 'defense_wins' && (
            <spotLight
              ref={winnerSpotlightRef}
              position={[0, 6.5, 0.5]}
              angle={0.3}
              penumbra={0.6}
              intensity={12}
              color="#4ade80"
              castShadow
            />
          )}
        </>
      )}

      {/* Active Exhibit Spotlight (pointing to evidence easel stand) */}
      {evidenceRef && (
        <spotLight
          ref={evidenceSpotlightRef}
          position={[0, 6.5, 1]}
          angle={0.25}
          penumbra={0.5}
          intensity={11}
          color="#38bdf8"
          castShadow
        />
      )}

      {/* Deeper Floor (Teak Wood Planks) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial color="#301b0f" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Back Wall - Deep sandstone beige with paneling texture */}
      <mesh position={[0, 3.5, -7.5]} receiveShadow>
        <boxGeometry args={[18, 7, 0.2]} />
        <meshStandardMaterial color="#ccb596" roughness={0.8} />
      </mesh>

      {/* Dark Mahogany Wall Base Paneling */}
      <mesh position={[0, 1.1, -7.38]} receiveShadow>
        <boxGeometry args={[18, 2.2, 0.08]} />
        <meshStandardMaterial color="#22140b" roughness={0.6} />
      </mesh>

      {/* Grand Columns / Pillars */}
      {[-8.0, -5.2, 5.2, 8.0].map((x, idx) => (
        <group key={idx} position={[x, 3.5, -7.3]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.26, 7, 18]} />
            <meshStandardMaterial color="#eed9be" roughness={0.7} />
          </mesh>
          {/* Golden column capitals */}
          <mesh position={[0, 3.4, 0]}>
            <cylinderGeometry args={[0.32, 0.26, 0.22, 16]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, -3.4, 0]}>
            <cylinderGeometry args={[0.26, 0.32, 0.22, 16]} />
            <meshStandardMaterial color="#22140b" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Center Law Emblem - Dharma Chakra */}
      <group position={[0, 4.4, -7.25]}>
        {/* Circular wooden plaque backing */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.04, 32]} />
          <meshStandardMaterial color="#301b0f" roughness={0.6} />
        </mesh>
        {/* Emblem outer ring */}
        <mesh castShadow>
          <torusGeometry args={[0.85, 0.065, 12, 48]} />
          <meshStandardMaterial color="#854d0e" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Inner circle hub */}
        <mesh position={[0, 0, 0.02]}>
          <torusGeometry args={[0.22, 0.038, 8, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
        {/* Spokes */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * Math.PI) / 6;
          return (
            <mesh 
              key={i} 
              position={[0.42 * Math.cos(angle), 0.42 * Math.sin(angle), 0.01]} 
              rotation={[0, 0, angle]}
            >
              <boxGeometry args={[0.8, 0.028, 0.028]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} />
            </mesh>
          );
        })}
      </group>

      {/* Side Wall Left */}
      <mesh position={[-9, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color="#ccb596" roughness={0.8} />
      </mesh>
      {/* Left Wall Moldings & Trim */}
      <group position={[-8.95, 0, 0]}>
        {/* Horizontal wood trim */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[0.08, 0.15, 16]} />
          <meshStandardMaterial color="#22140b" roughness={0.5} />
        </mesh>
        {/* Vertical panel trims */}
        {[-5, -2, 1, 4].map((z, idx) => (
          <mesh key={idx} position={[0, 2.2, z]} castShadow>
            <boxGeometry args={[0.06, 4.4, 0.22]} />
            <meshStandardMaterial color="#301b0f" roughness={0.6} />
          </mesh>
        ))}
      </group>
      
      {/* Side Wall Right */}
      <mesh position={[9, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 7]} />
        <meshStandardMaterial color="#ccb596" roughness={0.8} />
      </mesh>
      {/* Right Wall Moldings & Trim */}
      <group position={[8.95, 0, 0]}>
        {/* Horizontal wood trim */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[0.08, 0.15, 16]} />
          <meshStandardMaterial color="#22140b" roughness={0.5} />
        </mesh>
        {/* Vertical panel trims */}
        {[-5, -2, 1, 4].map((z, idx) => (
          <mesh key={idx} position={[0, 2.2, z]} castShadow>
            <boxGeometry args={[0.06, 4.4, 0.22]} />
            <meshStandardMaterial color="#301b0f" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 3D FURNITURE (Procedural meshes) */}
      {/* ========================================================= */}
      
      {/* 1. Elevated Judge Bench platform (Higher & wider) */}
      <mesh position={[0, 0.4, -5.5]} receiveShadow castShadow>
        <boxGeometry args={[5.2, 0.8, 2.6]} />
        <meshStandardMaterial color="#22140b" roughness={0.7} />
      </mesh>
      {/* Judge Bench front desk */}
      <mesh position={[0, 1.3, -4.5]} receiveShadow castShadow>
        <boxGeometry args={[4.4, 1.0, 0.6]} />
        <meshStandardMaterial color="#3f2314" roughness={0.5} />
      </mesh>
      {/* Judge Chair Back */}
      <mesh position={[0, 1.7, -6.1]}>
        <boxGeometry args={[0.8, 1.4, 0.15]} />
        <meshStandardMaterial color="#0f0f10" roughness={0.9} />
      </mesh>

      {/* Judge Bench Table Props */}
      <DocumentStack position={[-1.2, 1.8, -4.4]} rotation={[0, 0.15, 0]} />
      <TableMicrophone position={[0, 1.8, -4.3]} />
      <mesh position={[0.8, 1.81, -4.4]} castShadow>
        {/* Wooden Gavel block */}
        <cylinderGeometry args={[0.08, 0.09, 0.02, 10]} />
        <meshStandardMaterial color="#3f2314" roughness={0.4} />
      </mesh>

      {/* 2. Prosecution Counsel Station */}
      <group position={[-3.0, 0, -2.0]}>
        {/* Table top */}
        <mesh position={[0, 0.72, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.9, 0.08, 1.0]} />
          <meshStandardMaterial color="#301b0f" roughness={0.55} />
        </mesh>
        {/* Table Legs */}
        {[-0.85, 0.85].map((x, idx) => (
          <group key={idx}>
            <mesh position={[x, 0.36, -0.42]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[x, 0.36, 0.42]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Detailed Chair */}
        <group position={[0, 0, 0.75]}>
          {/* Chair Base */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Seat Cushion */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.48, 0.08, 0.46]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Chair Back */}
          <mesh position={[0, 0.72, 0.2]} castShadow>
            <boxGeometry args={[0.46, 0.68, 0.07]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* Props */}
        <LawBooks position={[-0.4, 0.76, -0.15]} rotation={[0, -0.1, 0]} />
        <DocumentStack position={[0.4, 0.76, 0.1]} rotation={[0, 0.2, 0]} />
        <TableMicrophone position={[0, 0.76, -0.3]} />
      </group>

      {/* 3. Defense Counsel Station */}
      <group position={[3.0, 0, -2.0]}>
        {/* Table top */}
        <mesh position={[0, 0.72, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.9, 0.08, 1.0]} />
          <meshStandardMaterial color="#301b0f" roughness={0.55} />
        </mesh>
        {/* Table Legs */}
        {[-0.85, 0.85].map((x, idx) => (
          <group key={idx}>
            <mesh position={[x, 0.36, -0.42]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[x, 0.36, 0.42]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Detailed Chair */}
        <group position={[0, 0, 0.75]}>
          {/* Chair Base */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Seat Cushion */}
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.48, 0.08, 0.46]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Chair Back */}
          <mesh position={[0, 0.72, 0.2]} castShadow>
            <boxGeometry args={[0.46, 0.68, 0.07]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </group>

        {/* Props */}
        <LawBooks position={[0.4, 0.76, -0.1]} rotation={[0, 0.15, 0]} />
        <DocumentStack position={[-0.4, 0.76, 0.15]} rotation={[0, -0.05, 0]} />
        <TableMicrophone position={[0, 0.76, -0.3]} />
      </group>

      {/* 4. Witness Stand (Open Rails Box Design) */}
      <group position={[-2.4, 0, -4.2]}>
        {/* Floor panel base */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.9, 0.2, 0.9]} />
          <meshStandardMaterial color="#22140b" roughness={0.8} />
        </mesh>
        {/* Front Wood Panel */}
        <mesh position={[0, 0.65, 0.41]} castShadow>
          <boxGeometry args={[0.82, 0.9, 0.06]} />
          <meshStandardMaterial color="#3f2314" roughness={0.6} />
        </mesh>
        {/* Left Side wood rail */}
        <mesh position={[-0.41, 0.65, 0]} castShadow>
          <boxGeometry args={[0.06, 0.9, 0.88]} />
          <meshStandardMaterial color="#3f2314" roughness={0.6} />
        </mesh>
        {/* Right Side wood rail */}
        <mesh position={[0.41, 0.65, 0]} castShadow>
          <boxGeometry args={[0.06, 0.9, 0.88]} />
          <meshStandardMaterial color="#3f2314" roughness={0.6} />
        </mesh>
        {/* Gooseneck Mic */}
        <TableMicrophone position={[0, 1.1, 0.2]} />
      </group>

      {/* 5. Evidence Board Display easel */}
      <group position={[2.6, 0, -4.4]}>
        {/* Tripod frame */}
        <mesh position={[-0.3, 0.75, 0]} rotation={[0, 0, -0.08]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        <mesh position={[0.3, 0.75, 0]} rotation={[0, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        <mesh position={[0, 0.75, -0.28]} rotation={[0.14, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
        {/* Glow Display Screen */}
        <mesh position={[0, 1.1, 0.03]} castShadow>
          <boxGeometry args={[1.2, 0.85, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        {/* Glowing presentation display */}
        <mesh position={[0, 1.1, 0.052]}>
          <planeGeometry args={[1.12, 0.78]} />
          <meshStandardMaterial 
            color={evidenceRef ? "#38bdf8" : "#fbbf24"} 
            emissive={evidenceRef ? "#38bdf8" : "#fbbf24"} 
            emissiveIntensity={evidenceRef ? 0.65 : (admittedEvidenceCount > 0 ? 0.22 : 0.05)} 
            roughness={0.9} 
          />
        </mesh>
        
        {/* Procedural sheet of paper and red exhibit stamp on the screen (only when evidence is active/cited) */}
        {evidenceRef && (
          <group position={[0, 1.1, 0.06]}>
            {/* White paper background */}
            <mesh position={[0, 0, 0.002]} castShadow>
              <planeGeometry args={[0.7, 0.55]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.9} />
            </mesh>
            {/* Exhibit red stamp */}
            <mesh position={[0.2, -0.15, 0.005]}>
              <planeGeometry args={[0.22, 0.08]} />
              <meshStandardMaterial color="#ef4444" roughness={0.6} />
            </mesh>
            {/* Gold emblem check/logo inside exhibit label */}
            <mesh position={[0.2, -0.15, 0.006]}>
              <planeGeometry args={[0.18, 0.05]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          </group>
        )}
      </group>

      {/* 6. Evidence Shelf Table */}
      <group position={[2.6, 0, -3.2]}>
        {/* Table surface */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.05, 0.7]} />
          <meshStandardMaterial color="#3f2314" roughness={0.6} />
        </mesh>
        {/* Support Legs */}
        {[-0.45, 0.45].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.25, -0.28]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
              <meshStandardMaterial color="#1c1917" />
            </mesh>
            <mesh position={[x, 0.25, 0.28]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
              <meshStandardMaterial color="#1c1917" />
            </mesh>
          </group>
        ))}

        {/* Dynamic Admitted Evidence Folders stack */}
        {Array.from({ length: Math.min(admittedEvidenceCount, 5) }).map((_, idx) => {
          const folderY = 0.525 + idx * 0.022;
          const rotY = (idx * 0.15) - 0.25;
          const folderOffset = (idx * 0.02) - 0.04;
          return (
            <group key={idx} position={[folderOffset, folderY, 0.02]} rotation={[0, rotY, 0]}>
              {/* Folder cardboard jacket */}
              <mesh castShadow>
                <boxGeometry args={[0.26, 0.015, 0.32]} />
                <meshStandardMaterial color="#eab308" roughness={0.7} />
              </mesh>
              {/* Paper layers */}
              <mesh position={[0.005, 0.009, 0]}>
                <boxGeometry args={[0.24, 0.007, 0.3]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.9} />
              </mesh>
              {/* Exhibit tag strip */}
              <mesh position={[-0.07, 0.01, 0.11]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.065, 0.04]} />
                <meshStandardMaterial color="#dc2626" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 7. Audience Spectator Benches (Wood planks in rear) */}
      {[-0.5, 1.4, 3.3].map((zOffset, rIdx) => (
        <group key={rIdx} position={[0, 0, 3.5 + zOffset]}>
          {/* Bench Row Left */}
          <group position={[-3.6, 0, 0]}>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.6, 0.08, 0.42]} />
              <meshStandardMaterial color="#301b0f" roughness={0.7} />
            </mesh>
            {/* Backrest board */}
            <mesh position={[0, 0.65, 0.18]} castShadow>
              <boxGeometry args={[3.6, 0.3, 0.04]} />
              <meshStandardMaterial color="#22140b" roughness={0.7} />
            </mesh>
            {/* Support legs */}
            {[-1.6, 1.6].map((xOffset) => (
              <mesh key={xOffset} position={[xOffset, 0.15, 0]} castShadow>
                <boxGeometry args={[0.08, 0.3, 0.38]} />
                <meshStandardMaterial color="#22140b" />
              </mesh>
            ))}
          </group>
          
          {/* Bench Row Right */}
          <group position={[3.6, 0, 0]}>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.6, 0.08, 0.42]} />
              <meshStandardMaterial color="#301b0f" roughness={0.7} />
            </mesh>
            {/* Backrest board */}
            <mesh position={[0, 0.65, 0.18]} castShadow>
              <boxGeometry args={[3.6, 0.3, 0.04]} />
              <meshStandardMaterial color="#22140b" roughness={0.7} />
            </mesh>
            {/* Support legs */}
            {[-1.6, 1.6].map((xOffset) => (
              <mesh key={xOffset} position={[xOffset, 0.15, 0]} castShadow>
                <boxGeometry args={[0.08, 0.3, 0.38]} />
                <meshStandardMaterial color="#22140b" />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Spectator/Audience seated figures (Benches 2 and 3 populated) */}
      {[-3.0, -1.8, 1.8, 3.0].map((x, i) => (
        <SeatedAudienceFigure key={`row2-${i}`} position={[x, 0.55, 4.9]} color={i % 2 === 0 ? "#475569" : "#3f3f46"} />
      ))}
      {[-2.4, -3.4, 2.4, 3.4].map((x, i) => (
        <SeatedAudienceFigure key={`row3-${i}`} position={[x, 0.55, 6.8]} color={i % 2 === 0 ? "#52525b" : "#27272a"} />
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
  defenseName = 'Defense',
  admittedEvidenceCount = 0,
  evidenceRef = null,
  isRuling = false,
  isVerdictActive = false,
  verdictDecision = null
}: Courtroom3DStageProps) {
  const [freeLook, setFreeLook] = useState(false);

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] bg-[#0c0502] select-none">
      {/* 3D Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault fov={45} position={[0, 4.4, 8.5]} />
        
        {/* Procedural Scene Objects */}
        <CourtroomScene 
          currentSpeaker={currentSpeaker} 
          isSpeaking={isSpeaking} 
          admittedEvidenceCount={admittedEvidenceCount}
          evidenceRef={evidenceRef}
          isRuling={isRuling}
          isVerdictActive={isVerdictActive}
          verdictDecision={verdictDecision}
        />

        {/* 3D Stylized Avatars */}
        {/* Judge - Elevated platform, behind bench */}
        <StylizedAvatar 
          role="judge" 
          isSpeaking={currentSpeaker === 'judge' && isSpeaking} 
          position={[0, 1.15, -5.5]} 
        />
        
        {/* Prosecutor - Left Desk */}
        <StylizedAvatar 
          role="prosecutor" 
          isSpeaking={currentSpeaker === 'prosecutor' && isSpeaking} 
          position={[-3.0, 0.72, -2.0]} 
        />
        
        {/* Defense - Right Desk */}
        <StylizedAvatar 
          role="defense" 
          isSpeaking={currentSpeaker === 'defense' && isSpeaking} 
          position={[3.0, 0.72, -2.0]} 
        />

        {/* Camera Tracking Controls */}
        <CameraController 
          currentSpeaker={currentSpeaker} 
          freeLook={freeLook} 
          isRuling={isRuling}
          isVerdictActive={isVerdictActive}
        />
        
        {/* Orbit Controls (Only responsive if freeLook is active) */}
        {freeLook && (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxPolarAngle={Math.PI / 2 - 0.08}
            minDistance={2}
            maxDistance={11}
            target={[0, 1.3, -2.5]}
          />
        )}
      </Canvas>

      {/* Camera View Selector Control */}
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

      {/* Floating Speaking HUD overlay */}
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
