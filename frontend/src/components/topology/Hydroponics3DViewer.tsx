import { useEffect, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, useGLTF } from '@react-three/drei';
import { useTheme } from '../ThemeProvider';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

// Custom GLSL Shader Material for realistic flowing water simulation
const WaterShader = {
  uniforms: {
    uTime: { value: 0 },
    uFlowSpeed: { value: 1.5 },
    uFlowColor: { value: new THREE.Color('#00ffff') },      // Shimmering cyan/blue
    uBackgroundColor: { value: new THREE.Color('#1d4ed8') }, // Deep blue base
    uFlowing: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uFlowSpeed;
    uniform vec3 uFlowColor;
    uniform vec3 uBackgroundColor;
    uniform float uFlowing;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Create flow ripples using time uniform along the U direction of the tube uv
      float x = vUv.x * 25.0 - uTime * uFlowSpeed;
      
      // Layered sine waves for shimmering fluid details
      float wave = sin(x) * 0.4 + 0.6;
      wave += sin(vUv.x * 60.0 - uTime * uFlowSpeed * 1.8) * 0.2;
      wave = clamp(wave, 0.0, 1.0);

      // Base fluid color mixed with flow highlights
      vec3 waterColor = mix(uBackgroundColor, uFlowColor, wave * uFlowing);
      
      // Glossy Fresnel reflections
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
      
      // Final pixel output with subtle specular glint
      vec3 finalColor = mix(waterColor, vec3(1.0, 1.0, 1.0), fresnel * 0.45);
      
      gl_FragColor = vec4(finalColor, 0.8); // 80% opacity water
    }
  `
};

// Helper function to extract a centerline path from a tube mesh
function extractCurveFromMesh(mesh: THREE.Mesh, numSegments = 64): THREE.CatmullRomCurve3 | null {
  const geom = mesh.geometry;
  if (!geom || !geom.attributes.position) return null;
  const posAttr = geom.attributes.position;
  const count = posAttr.count;

  // Average vertices slice by slice along the mesh index buffer
  const blockSize = Math.max(8, Math.round(count / numSegments));
  const points: THREE.Vector3[] = [];

  mesh.updateMatrixWorld();

  for (let i = 0; i < count; i += blockSize) {
    const end = Math.min(i + blockSize, count);
    let x = 0, y = 0, z = 0, n = 0;
    for (let j = i; j < end; j++) {
      x += posAttr.getX(j);
      y += posAttr.getY(j);
      z += posAttr.getZ(j);
      n++;
    }
    if (n > 0) {
      const localPoint = new THREE.Vector3(x / n, y / n, z / n);
      // Transform local points to world coordinates to match layout
      const worldPoint = localPoint.clone().applyMatrix4(mesh.matrixWorld);
      points.push(worldPoint);
    }
  }

  if (points.length < 2) return null;
  return new THREE.CatmullRomCurve3(points);
}

// 3D Tube Mesh with dynamic time uniform updates for fluid flows
function AnimatedTube({ curve, isFlowing }: { curve: THREE.CatmullRomCurve3; isFlowing: boolean }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      shaderRef.current.uniforms.uFlowing.value = isFlowing ? 1.0 : 0.0;
    }
  });

  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 100, 0.22, 10, false]} />
      <shaderMaterial
        ref={shaderRef}
        args={[WaterShader]}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Subcomponent to process the loaded GLB asset and extract curves
function ModelContent({
  url,
  setCurves,
  onLoaded
}: {
  url: string;
  setCurves: (curves: Array<{ name: string; curve: THREE.CatmullRomCurve3 }>) => void;
  onLoaded: () => void;
}) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    const extracted: Array<{ name: string; curve: THREE.CatmullRomCurve3 }> = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Recolor Plant foliage to fresh botanical green
        if (mesh.name.includes('Plant')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#40916c'),
            roughness: 0.75,
            metalness: 0.05,
          });
        }

        // Replace storage tanks with transparent glass/plastics
        if (mesh.name.includes('StorageContainer') || mesh.name.includes('Tank')) {
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#cbd5e1'),
            transparent: true,
            opacity: 0.25,
            transmission: 0.85,
            ior: 1.5,
            roughness: 0.12,
            metalness: 0.1,
            depthWrite: false,
          });
        }

        // Hide static tube meshes and extract center lines for R3F dynamic curves
        if (mesh.name.startsWith('Path_')) {
          mesh.visible = false;
          const curve = extractCurveFromMesh(mesh, 48);
          if (curve) {
            extracted.push({ name: mesh.name, curve });
          }
        }
      }
    });

    setCurves(extracted);
    onLoaded();
  }, [scene, url, setCurves, onLoaded]);

  return <primitive object={scene} />;
}

// Loading Fallback Component
function GLTFLoaderIndicator({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
      <div className="w-72 p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-16 h-16 rounded-full border border-cyan-500/30 animate-ping opacity-75" />
          <div className="w-12 h-12 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin" />
        </div>
        <h3 className="font-semibold text-white tracking-wide text-sm mb-1">
          Loading 3D Twin Environment
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          hydroponic.glb ({progress}%)
        </p>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Preload GLB
useGLTF.preload('/hydroponic.glb');

// Main Component
export default function Hydroponics3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [isFlowing, setIsFlowing] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [curves, setCurves] = useState<Array<{ name: string; curve: THREE.CatmullRomCurve3 }>>([]);

  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    THREE.DefaultLoadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      const pct = Math.round((itemsLoaded / itemsTotal) * 100);
      setProgress(pct);
    };
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (cameraRef.current) {
      const cam = cameraRef.current;
      const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      const dir = new THREE.Vector3().subVectors(cam.position, target).normalize();
      const dist = cam.position.distanceTo(target);
      const zoomFactor = direction === 'in' ? 0.8 : 1.25;
      const newDist = Math.max(2, Math.min(60, dist * zoomFactor));

      cam.position.copy(target).addScaledVector(dir, newDist);
      if (controlsRef.current) controlsRef.current.update();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: 'var(--dt-viewer-bg)', height: '100%', minHeight: '450px' }}
    >
      {loading && <GLTFLoaderIndicator progress={progress} />}

      <Canvas
        shadows
        camera={{ position: [0, 8, 25], fov: 45 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
      >

        {/* Ambient Lights */}
        <hemisphereLight color="#ffffff" groundColor="#444444" intensity={isDark ? 0.6 : 0.8} />
        <ambientLight intensity={isDark ? 0.3 : 0.5} />

        {/* Shadow Casting Sun */}
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
        />

        {/* Neon blue highlights to match digital twin dashboard theme */}
        <directionalLight position={[-10, 5, -15]} color="#00d8ff" intensity={0.7} />

        {/* Soft ground grids */}
        <gridHelper
          args={[40, 40, isDark ? '#00ffff' : '#008888', isDark ? '#2e303c' : '#dddddd']}
          position={[0, -0.01, 0]}
        />

        <Suspense fallback={null}>
          <Center>
            {/* The primary GLTF model load */}
            <ModelContent
              url="/hydroponic.glb"
              setCurves={setCurves}
              onLoaded={() => setLoading(false)}
            />

            {/* Dynmically generated R3F fluid tubes using custom shader material */}
            {curves.map(({ name, curve }) => (
              <AnimatedTube key={name} curve={curve} isFlowing={isFlowing} />
            ))}
          </Center>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={3}
          maxDistance={55}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />
      </Canvas>

      {/* Control Actions Floating HUD */}
      {!loading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/80 border border-slate-700/35 backdrop-blur-md shadow-2xl z-20 transition-all hover:border-cyan-500/25">
          {/* Water Flow Animation Toggle */}
          <button
            onClick={() => setIsFlowing(!isFlowing)}
            className={`px-3 py-1 text-xs rounded-full font-bold border transition-all duration-200 ${isFlowing
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
              }`}
            title={isFlowing ? 'Stop Flow Simulation' : 'Start Flow Simulation'}
          >
            {isFlowing ? 'Water Flowing' : 'Water Paused'}
          </button>

          <div className="w-px h-5 bg-slate-800" />

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-full transition-all duration-200 ${autoRotate
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
              }`}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
          >
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <div className="w-px h-5 bg-slate-800" />

          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom('in')}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={() => handleZoom('out')}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          {/* Reset camera */}
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all"
            title="Reset Camera"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
