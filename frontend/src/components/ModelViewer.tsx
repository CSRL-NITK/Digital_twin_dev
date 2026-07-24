import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useProgress, Html, Center, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';
import curvesData from '../curves.json';

import { useHydroState } from '../lib/hydro/hydroStateContext';

interface ModelViewerProps {
  url?: string;
  isPumpOn?: boolean;
  onPumpToggle?: (on: boolean) => void;
}

// Configuration of frame ratios for each water flow path based on Blender's keyframes
const pathConfigs: Record<string, { startFrame: number; endFrame: number; type: 'start' | 'end' }> = {
  Path_Main_Flow: {
    startFrame: 1.0,
    endFrame: 250.0,
    type: 'start',
  },
  NurbsPath: {
    startFrame: 1.0,
    endFrame: 250.0,
    type: 'start',
  },
  Path_Row1: {
    startFrame: 56.0,
    endFrame: 244.0,
    type: 'start',
  },
  Path_Row2: {
    startFrame: 74.0,
    endFrame: 244.0,
    type: 'end',
  },
  Path_Row3: {
    startFrame: 61.0,
    endFrame: 243.0,
    type: 'end',
  },
  Path_Row4: {
    startFrame: 75.0,
    endFrame: 247.0,
    type: 'end',
  }
};

// Loader component using useProgress
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-[#161a22]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl min-w-[240px]">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-white/10 fill-none"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              className="stroke-emerald-500 fill-none transition-all duration-300 ease-out"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            />
          </svg>
          <span className="absolute text-sm font-semibold text-white">
            {Math.round(progress)}%
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400 animate-pulse">
          Loading 3D Digital Twin...
        </p>
      </div>
    </Html>
  );
}

// Inner component that loads the GLTF model, sets camera, lights, and controls dynamically
function ModelContent({ url, isFlowing }: { url: string; isFlowing: boolean }) {
  const { scene, animations, nodes } = useGLTF(url) as any;
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Compute sizing and scale factor once using useMemo to prevent recursive feedback scaling loop
  const scaleFactor = useMemo(() => {
    if (!scene) return 1.0;
    const box = new THREE.Box3().setFromObject(scene);
    const boxSize = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
    const targetSize = 5.0;
    return maxDim > 0 ? targetSize / maxDim : 1.0;
  }, [scene]);

  const initializedRef = useRef(false);

  useEffect(() => {
    initializedRef.current = false;
  }, [url]);

  useEffect(() => {
    if (!scene || initializedRef.current) return;

    // Center and set standardized camera distance for normalized size
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.minDistance = 2.0; // Allow zooming close
      controlsRef.current.maxDistance = 25.0; // Prevent zooming infinitely far
      controlsRef.current.update();
    }

    initializedRef.current = true;
  }, [scene, camera]);

  // Track the generated water meshes and their materials
  const meshesRef = useRef<any[]>([]);
  const frameRef = useRef(1.0);
  const timeRef = useRef(0.0);
  // Intercept animations to remove translation and scale tracks from Object004 and Water Temp
  // so they don't override our custom position and scale coordinate values.
  const filteredAnimations = useMemo(() => {
    if (!animations) return [];
    return animations.map((clip: any) => {
      const clonedClip = clip.clone();
      clonedClip.tracks = clonedClip.tracks.filter((track: any) => {
        const isTarget = track.name.startsWith('Object004.') || track.name.startsWith('Water_Temp.') || track.name.startsWith('Water Temp.');
        const isTranslationOrScale = track.name.endsWith('.position') || track.name.endsWith('.scale') || track.name.endsWith('.translation');
        return !(isTarget && isTranslationOrScale);
      });
      return clonedClip;
    });
  }, [animations]);

  // Bind standard animation actions (e.g. pumps, spinner)
  const { actions } = useAnimations(filteredAnimations, scene);

  // Custom transparent/transmission materials for the main tank and water volume
  useEffect(() => {
    if (!nodes) return;

    // 1. Tank Water Mesh (StorageContainer.002 or Cube.001)
    const mainTankWater = nodes.StorageContainer_002 || nodes['StorageContainer.002'] || nodes.Cube_001 || nodes['Cube.001'];
    let originalWaterMat: any = null;
    let waterMaterial: any = null;
    if (mainTankWater) {
      waterMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38bdf8'), // Solid visible light blue color
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      originalWaterMat = mainTankWater.material;
      mainTankWater.material = waterMaterial;
    }

    // 2. Storage Container/Tank Mesh (StorageContainer.001)
    const container = nodes.StorageContainer_001 || nodes['StorageContainer.001'];
    let originalContainerMat: any = null;
    let containerMaterial: any = null;
    if (container) {
      containerMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0.25,          // Semitransparent frosted plastic tank wall
        roughness: 0.3,
        metalness: 0.1,
        transmission: 0.8,       // High transmission to see the contents clearly
        ior: 1.5,                // Index of refraction for plastic/glass
        side: THREE.DoubleSide,
        depthWrite: false
      });
      originalContainerMat = container.material;
      container.material = containerMaterial;
    }

    // 3. Customize plant leaves and planter materials dynamically
    const originalPlantColors = new Map();
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            if (mat.name === 'CALATHEA_ORBIFOLIA_Mat') {
              if (!originalPlantColors.has(mat)) {
                originalPlantColors.set(mat, mat.color.clone());
              }
              mat.color.set('#40916c'); // Rich organic leaf green
              mat.roughness = 0.6;
              mat.metalness = 0.1;
            } else if (mat.name === 'PLANTER_Beige_Concrete_Mat') {
              if (!originalPlantColors.has(mat)) {
                originalPlantColors.set(mat, mat.color.clone());
              }
              mat.color.set('#c29a72'); // Stylish beige concrete pot color
              mat.roughness = 0.8;
              mat.metalness = 0.0;
            }
          });
        }
      });
    }
    // 4. Reposition Object004 and Water Temp to be inside the main container tank
    const originalPositions = new Map<any, THREE.Vector3>();

    const pumpNode = nodes.WaterPump_002 || nodes['WaterPump.002'];
    if (nodes.Object004 && pumpNode) {
      originalPositions.set(nodes.Object004, nodes.Object004.position.clone());
      nodes.Object004.position.copy(pumpNode.position);
    }

    const tankNode = nodes.StorageContainer_001 || nodes['StorageContainer.001'];
    const tempNode = nodes['Water Temp'] || nodes.Water_Temp;
    if (tempNode && tankNode) {
      originalPositions.set(tempNode, tempNode.position.clone());
      tempNode.position.copy(tankNode.position);
      // Place the sensor probe inside the tank water volume
      tempNode.position.y += 1.0; 
      tempNode.position.x += 1.5;
      tempNode.position.z += 0.5;
    }

    return () => {
      // Restore original materials on cleanup
      if (mainTankWater && originalWaterMat) {
        mainTankWater.material = originalWaterMat;
      }
      if (waterMaterial) waterMaterial.dispose();

      if (container && originalContainerMat) {
        container.material = originalContainerMat;
      }
      if (containerMaterial) containerMaterial.dispose();

      // Restore original plant colors
      originalPlantColors.forEach((color, mat) => {
        mat.color.copy(color);
      });

      // Restore original positions
      originalPositions.forEach((pos, node) => {
        node.position.copy(pos);
      });
    };
  }, [nodes, scene]);

  // Procedurally generate the water tube meshes along NURBS curves exported in curves.json
  useEffect(() => {
    if (!nodes) return;

    const newMeshes: any[] = [];

    Object.keys(pathConfigs).forEach((name) => {
      const parentNode = nodes[name];
      const pointsData = (curvesData as any)[name];
      const config = pathConfigs[name];

      if (parentNode && pointsData) {
        // Explicitly hide the static mesh/node from the GLB
        parentNode.visible = false;

        // Convert Blender Z-up coordinates to Three.js Y-up system [x, z, -y]
        const points = pointsData.map((p: any) => new THREE.Vector3(p[0], p[2], -p[1]));
        
        // Reconstruct the spline curve using Catmull-Rom path interpolation
        const curve = new THREE.CatmullRomCurve3(points);
        
        // Create TubeGeometry (path, tubularSegments, radius, radialSegments, closed)
        // Using radius 0.16 to prevent inner clipping against the pipe models
        const geometry = new THREE.TubeGeometry(curve, 120, 0.16, 12, false);
        
        // Custom shader material simulating a shiny, semi-transparent flowing liquid
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uStart: { value: config.type === 'start' ? 1.0 : 0.0 },
            uEnd: { value: config.type === 'start' ? 1.0 : 0.0 },
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color('#38bdf8') } // Shiny light blue color
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
              vUv = uv;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform float uStart;
            uniform float uEnd;
            uniform float uTime;
            uniform vec3 uColor;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
              // Discard fragments outside the active trim/flow range
              if (vUv.x < uStart || vUv.x > uEnd) {
                discard;
              }

              // Smooth transition taper at the edges
              float edgeTaper = smoothstep(uStart, uStart + 0.02, vUv.x) * (1.0 - smoothstep(uEnd - 0.02, uEnd, vUv.x));

              // Compute simple specular phong shading
              vec3 normal = normalize(vNormal);
              vec3 viewDir = normalize(vViewPosition);
              
              // Animated wave ripples moving along the pipe
              float wave1 = sin(vUv.x * 40.0 - uTime * 6.0) * 0.5 + 0.5;
              float wave2 = cos(vUv.y * 8.0 + vUv.x * 15.0 - uTime * 3.0) * 0.5 + 0.5;
              float shimmer = mix(wave1, wave2, 0.5);

              vec3 lightDir = normalize(vec3(5.0, 10.0, 5.0));
              vec3 halfDir = normalize(lightDir + viewDir);
              float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);

              // Shimmering blue water body
              vec3 color = mix(uColor, vec3(1.0), spec * 0.5 + shimmer * 0.2);
              float alpha = (0.4 + shimmer * 0.3) * edgeTaper;

              gl_FragColor = vec4(color, alpha);
            }
          `,
          transparent: true,
          depthWrite: false, // Prevents depth occlusion conflicts with clear pipes
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Copy the exact transform of the hidden GLB node
        mesh.position.copy(parentNode.position);
        mesh.rotation.copy(parentNode.rotation);
        mesh.scale.copy(parentNode.scale);

        // Add the custom dynamic mesh to the parent of the hidden node so it renders in the correct place
        const actualParent = parentNode.parent || scene;
        actualParent.add(mesh);

        newMeshes.push({
          name,
          mesh,
          material,
          config,
          actualParent
        });
      }
    });

    meshesRef.current = newMeshes;

    return () => {
      // Clean up meshes and dispose geometries/materials
      newMeshes.forEach(({ name, mesh, material, actualParent }) => {
        if (actualParent) {
          actualParent.remove(mesh);
        }
        mesh.geometry.dispose();
        material.dispose();
        
        // Restore visibility
        const parentNode = nodes[name];
        if (parentNode) {
          parentNode.visible = true;
        }
      });
      meshesRef.current = [];
    };
  }, [nodes, scene]);

  // Play normal animations when flow toggles
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    if (isFlowing) {
      Object.keys(actions).forEach((key) => {
        if (actions[key]) {
          actions[key].reset().play();
        }
      });
    } else {
      Object.keys(actions).forEach((key) => {
        if (actions[key]) actions[key].stop();
      });
    }
  }, [isFlowing, actions]);

  // React Three Fiber loop: Update frame animations and uniforms
  useFrame((_state, delta) => {
    timeRef.current += delta;

    if (isFlowing) {
      frameRef.current += delta * 30.0;
      if (frameRef.current > 250.0) {
        frameRef.current = 250.0; // Clamp at 250.0 so pipes stay filled
      }
    } else {
      frameRef.current = 1.0; // Reset to start (empty) when pump is turned off
    }

    const currentFrame = frameRef.current;

    meshesRef.current.forEach(({ material, config }) => {
      material.uniforms.uTime.value = timeRef.current;

      const { startFrame, endFrame, type } = config;
      let startVal = 0.0;
      let endVal = 0.0;

      if (type === 'start') {
        if (currentFrame < startFrame) {
          startVal = 1.0;
          endVal = 1.0;
        } else if (currentFrame >= endFrame) {
          startVal = 0.0;
          endVal = 1.0;
        } else {
          const progress = (currentFrame - startFrame) / (endFrame - startFrame);
          startVal = 1.0 - progress;
          endVal = 1.0;
        }
      } else {
        if (currentFrame < startFrame) {
          startVal = 0.0;
          endVal = 0.0;
        } else if (currentFrame >= endFrame) {
          startVal = 0.0;
          endVal = 1.0;
        } else {
          const progress = (currentFrame - startFrame) / (endFrame - startFrame);
          startVal = 0.0;
          endVal = progress;
        }
      }

      material.uniforms.uStart.value = startVal;
      material.uniforms.uEnd.value = endVal;
    });
  });

  return (
    <>
      <hemisphereLight color="#ffffff" groundColor="#888888" intensity={0.5} />
      <directionalLight
        position={[8, 10, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-8, 6, -8]}
        intensity={0.4}
      />
      <pointLight position={[0, 8, 0]} intensity={0.3} />

      <Center>
        <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
          <primitive object={scene} />
        </group>
      </Center>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

export default function ModelViewer({ url = '/test.glb', isPumpOn: propIsPumpOn, onPumpToggle }: ModelViewerProps) {
  const hydroState = useHydroState();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalFlowing, setInternalFlowing] = useState(false);
  const isHydro = url.toLowerCase().includes('hydroponic');
  const bgColor = isHydro ? '#ebebeb' : '#2e3240';

  const isFlowing = propIsPumpOn !== undefined 
    ? propIsPumpOn 
    : (isHydro ? hydroState.isPumpOn : internalFlowing);

  const handlePumpToggle = () => {
    if (onPumpToggle) {
      onPumpToggle(!isFlowing);
    } else if (isHydro) {
      hydroState.togglePump(!isFlowing);
    } else {
      setInternalFlowing(!internalFlowing);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className={
        isFullscreen 
          ? 'fixed inset-0 z-50 p-6 flex flex-col animate-in fade-in duration-200' 
          : `w-full h-full relative rounded-[24px] overflow-hidden border ${isHydro ? 'border-slate-300' : 'border-slate-700/80'} shadow-sm`
      }
      style={{ backgroundColor: bgColor }}
    >
      {/* Title overlay in top-left corner */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none select-none">
        <h3 className={`text-base font-semibold tracking-wide flex items-center gap-2 ${isHydro ? 'text-slate-800' : 'text-slate-100'}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          3D Digital Twin View
        </h3>
        <p className={`text-xs mt-0.5 ${isHydro ? 'text-slate-500' : 'text-slate-350'}`}>Use mouse to rotate, pan, and zoom</p>
      </div>

      {/* Sleek Controls Overlay in top-right corner */}
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        <button
          onClick={handlePumpToggle}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer font-bold text-xs ${
            isFlowing
              ? 'bg-[#14151b] hover:bg-[#1f2029] text-emerald-400 border-emerald-800/80 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
              : 'bg-red-950/80 hover:bg-red-900/90 text-red-200 border-red-800/80'
          }`}
          title={isFlowing ? "Stop Water Pump" : "Start Water Pump"}
        >
          {isFlowing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
          {isFlowing ? '⚡ Pump ON' : '🛑 Pump OFF'}
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-[#14151b] hover:bg-[#1f2029] text-slate-200 hover:text-white shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Main 3D Canvas */}
      <div className="flex-1 w-full h-full min-h-0">
        <Canvas
          shadows
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 2.5, 9], fov: 45 }}
        >
          <color attach="background" args={[bgColor]} />
          
          <Suspense fallback={<Loader />}>
            <ModelContent url={url} isFlowing={isFlowing} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

// Pre-load the GLTF file to speed up rendering
useGLTF.preload('/test.glb');

