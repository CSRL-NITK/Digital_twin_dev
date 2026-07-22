import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Sliders, 
  Settings, 
  RotateCcw,
  Thermometer,
  Gauge,
  Activity,
  Zap,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import axios from 'axios';
import ReactFlow, { 
  Background, 
  ReactFlowProvider, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  useEdges,
  useNodes,
  useUpdateNodeInternals
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTheme } from '../components/ThemeProvider';
import { useGlobalTopology } from '../components/layout/MainLayout';
import WaterFlowEdge from '../components/topology/WaterFlowEdge';
import { WaterTank as TankWaterTank } from '../components/nodes/WaterTank';
import { CentralWaterTank } from '../components/nodes/CentralWaterTank';
import { WaterTank as SourceWaterTank } from '../components/nodes/SourceWaterTank';
import { CentrifugalPumpSvg } from '../components/nodes/CentrifugalPump';
import { Pump3DSwitch } from '../components/nodes/Pump3DSwitch';

const clampPercentage = (value: number | undefined) =>
  Math.max(0, Math.min(100, value ?? 0));

const deriveTankState = (data: any) => {
  const fillPercentage = clampPercentage(data?.waterLevel ?? 0);
  const temperature = data?.temperature ?? 0;
  return {
    fillPercentage,
    temperature,
    isFilling: fillPercentage < 98,
    isDraining: fillPercentage > 1,
    waveSpeed: fillPercentage > 75 ? 'fast' : fillPercentage > 40 ? 'medium' : 'slow',
    waveHeight: temperature > 55 ? 'active' : temperature > 35 ? 'normal' : 'calm',
  } as const;
};

/* ─── Helper for Exact Normalized Handles matching Live digital twin ─── */
const PrecisionHandle = ({
  id, type, x, y, basePosition, isFlipped
}: {
  id: string, type: 'source' | 'target', x: number, y: number, basePosition: Position, isFlipped: boolean
}) => {
  let finalX = isFlipped ? (1 - x) : x;
  let finalPosition = basePosition;
  if (isFlipped) {
    if (basePosition === Position.Left) finalPosition = Position.Right;
    else if (basePosition === Position.Right) finalPosition = Position.Left;
  }

  return (
    <Handle
      id={id}
      type={type}
      position={finalPosition}
      style={{
        left: `${finalX * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-50%, -50%)`,
        width: 6,
        height: 6,
        background: 'red',
        opacity: 0, // completely transparent to match Live Twin aesthetics
        border: 'none',
        zIndex: 50
      }}
    />
  );
};

// --- Wrapper Components to align custom Node props with ReactFlow expectations ---
function CentralTankNodeView({ id, data }: { id: string; data: any }) {
  const tankState = deriveTankState(data ?? {});
  const edges = useEdges();
  const isFlipped = !!data?.flipHorizontal;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data?.customWidth, data?.flipHorizontal, updateNodeInternals]);

  const in1 = data?.inlet1On ?? true;
  const in4 = data?.inlet4On ?? true;
  const in2 = data?.inlet2On ?? true;
  const in3 = data?.inlet3On ?? true;

  const isFlowing1 = edges.some(e => e.target === id && (!e.targetHandle || e.targetHandle === 'inlet-1') && (e.data as any)?.isFlowing);
  const isFlowing2 = edges.some(e => e.target === id && e.targetHandle === 'inlet-4' && (e.data as any)?.isFlowing);
  const isFlowing3 = edges.some(e => e.target === id && e.targetHandle === 'inlet-2' && (e.data as any)?.isFlowing);
  const isFlowing4 = edges.some(e => e.target === id && e.targetHandle === 'inlet-3' && (e.data as any)?.isFlowing);

  const out1Flowing = edges.some(e => e.source === id && (!e.sourceHandle || e.sourceHandle === 'outlet-1') && (e.data as any)?.isFlowing);
  const out2Flowing = edges.some(e => e.source === id && e.sourceHandle === 'outlet-2' && (e.data as any)?.isFlowing);

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 170, minHeight: 200, position: 'relative' }}>
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease', position: 'relative' }}>
        <CentralWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling}
          isDraining={tankState.isDraining}
          isFillingActive={isFlowing1}
          isFilling2Active={isFlowing2}
          isFilling3Active={isFlowing3}
          isFilling4Active={isFlowing4}
          isDrainingActive={out1Flowing}
          isDraining2Active={out2Flowing}
          showInletPipe={in1}
          showInletPipe2={in4}
          showInletPipe3={in2}
          showInletPipe4={in3}
          waveSpeed={tankState.waveSpeed}
          waveHeight={tankState.waveHeight}
          temperature={tankState.temperature}
        />
      </div>

      <PrecisionHandle id="inlet-1" type="target" x={0.1195} y={0.1482} basePosition={Position.Left} isFlipped={isFlipped} />
      <PrecisionHandle id="inlet-2" type="target" x={0.4430} y={0.0930} basePosition={Position.Top} isFlipped={isFlipped} />
      <PrecisionHandle id="inlet-3" type="target" x={0.5580} y={0.0930} basePosition={Position.Top} isFlipped={isFlipped} />
      <PrecisionHandle id="inlet-4" type="target" x={0.8955} y={0.1482} basePosition={Position.Right} isFlipped={isFlipped} />
      <PrecisionHandle id="outlet-1" type="source" x={0.1145} y={0.2376} basePosition={Position.Left} isFlipped={isFlipped} />
      <PrecisionHandle id="outlet-2" type="source" x={0.8955} y={0.2376} basePosition={Position.Right} isFlipped={isFlipped} />

      <div className="absolute top-[79%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {data?.nodeName || 'Central Tank'}
      </div>
    </div>
  );
}

function SourceTankNodeView({ id, data }: { id: string; data: any }) {
  const tankState = deriveTankState(data ?? {});
  const edges = useEdges();
  const isFlipped = !!data?.flipHorizontal;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data?.customWidth, data?.flipHorizontal, updateNodeInternals]);

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 170, minHeight: 200, position: 'relative' }}>
      <PrecisionHandle id="inlet-1" type="target" x={0.3647} y={0.155} basePosition={Position.Top} isFlipped={isFlipped} />
      <PrecisionHandle id="outlet-1" type="source" x={0.9413} y={0.7583} basePosition={Position.Right} isFlipped={isFlipped} />
      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <SourceWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling}
          isDraining={tankState.isDraining && edges.some(e => e.source === id && (e.data as any)?.isFlowing)}
          waveSpeed={tankState.waveSpeed}
          waveHeight={tankState.waveHeight}
          temperature={tankState.temperature}
        />
      </div>
      <div className="absolute top-[79%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {data?.nodeName || 'Source Tank'}
      </div>
    </div>
  );
}

function TankNodeView({ id, data }: { id: string; data: any }) {
  const tankState = deriveTankState(data ?? {});
  const edges = useEdges();
  const isFlipped = !!data?.flipHorizontal;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data?.customWidth, data?.flipHorizontal, updateNodeInternals]);

  const inletOn = data?.inletValveOn !== false;
  const outletOn = data?.outletValveOn !== false;

  const inletPos = {
    x: data?.inletSwitchOffsetX ?? 68.6,
    y: data?.inletSwitchOffsetY ?? 51.2,
  };
  const inletScale = data?.inletSwitchScale ?? 0.18;

  const outletPos = {
    x: data?.outletSwitchOffsetX ?? 240.8,
    y: data?.outletSwitchOffsetY ?? 252.8,
  };
  const outletScale = data?.outletSwitchScale ?? 0.18;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(data?.customWidth || 295);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth || data?.customWidth || 295);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data?.customWidth]);

  const scaleRatio = containerWidth / 295;

  const effInletX = inletPos.x * scaleRatio;
  const effInletY = inletPos.y * scaleRatio;
  const effInletScale = inletScale * scaleRatio;
  const inletWidth = 150 * effInletScale;
  const actualEffInletX = isFlipped ? containerWidth - effInletX - inletWidth : effInletX;

  const effOutletX = outletPos.x * scaleRatio;
  const effOutletY = outletPos.y * scaleRatio;
  const effOutletScale = outletScale * scaleRatio;
  const outletWidth = 150 * effOutletScale;
  const actualEffOutletX = isFlipped ? containerWidth - effOutletX - outletWidth : effOutletX;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 204, position: 'relative' }}>
      {/* Inlet Valve Switch */}
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effInletY,
          left: actualEffInletX,
          width: inletWidth,
          height: 195 * effInletScale,
          zIndex: 35,
        }}
      >
        <div className="nodrag nopan" style={{ width: '100%', height: '100%' }}>
          <Pump3DSwitch
            isOn={inletOn}
            canControl={true}
            onToggle={() => {
              if (data?.onToggleTankValve) {
                data.onToggleTankValve(id, 'inlet', !inletOn);
              }
            }}
            scale={effInletScale}
          />
        </div>
      </div>

      {/* Outlet Valve Switch */}
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effOutletY,
          left: actualEffOutletX,
          width: outletWidth,
          height: 195 * effOutletScale,
          zIndex: 35,
        }}
      >
        <div className="nodrag nopan" style={{ width: '100%', height: '100%' }}>
          <Pump3DSwitch
            isOn={outletOn}
            canControl={true}
            onToggle={() => {
              if (data?.onToggleTankValve) {
                data.onToggleTankValve(id, 'outlet', !outletOn);
              }
            }}
            scale={effOutletScale}
          />
        </div>
      </div>

      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <TankWaterTank
          fillPercentage={tankState.fillPercentage}
          isFilling={tankState.isFilling}
          isDraining={tankState.isDraining && edges.some(e => e.source === id && (e.data as any)?.isFlowing)}
          waveSpeed={tankState.waveSpeed}
          waveHeight={tankState.waveHeight}
          temperature={tankState.temperature}
        />
      </div>

      <PrecisionHandle id="inlet-1" type="target" x={0.3629} y={0.14} basePosition={Position.Top} isFlipped={isFlipped} />
      <PrecisionHandle id="outlet-1" type="source" x={0.8558} y={0.1500} basePosition={Position.Right} isFlipped={isFlipped} />

      <div className="absolute top-[79%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {data?.nodeName || 'Tank'}
      </div>
    </div>
  );
}

function PumpNodeView({ id, data }: { id: string; data: any }) {
  const isOn = data.pumpOn ?? true;
  const status = data.status || 'Healthy';
  const vibration = data.vibration ?? 1.8;
  const isFlipped = !!data?.flipHorizontal;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data?.customWidth, data?.flipHorizontal, updateNodeInternals]);

  const switchOffsetX = data.switchOffsetX ?? 186.5;
  const switchOffsetY = data.switchOffsetY ?? 140.4;
  const switchScale = data.switchScale ?? 0.18;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(data?.customWidth || 387);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth || data?.customWidth || 387);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data?.customWidth]);

  const scaleRatio = containerWidth / 387;

  const effX = switchOffsetX * scaleRatio;
  const effY = switchOffsetY * scaleRatio;
  const effScale = switchScale * scaleRatio;
  const switchWidth = 150 * effScale;
  const actualEffX = isFlipped ? containerWidth - effX - switchWidth : effX;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 100, position: 'relative' }}>
      <PrecisionHandle id="inlet-1" type="target" x={0.0572} y={0.5000} basePosition={Position.Left} isFlipped={isFlipped} />
      <PrecisionHandle id="outlet-1" type="source" x={0.7000} y={0.0949} basePosition={Position.Top} isFlipped={isFlipped} />

      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: effY,
          left: actualEffX,
          width: switchWidth,
          height: 195 * effScale,
          zIndex: 35,
        }}
      >
        <div className="nodrag nopan" style={{ width: '100%', height: '100%' }}>
          <Pump3DSwitch
            isOn={isOn}
            canControl={true}
            onToggle={() => {
              if (data?.onTogglePump) {
                data.onTogglePump(id, !isOn);
              }
            }}
            scale={effScale}
          />
        </div>
      </div>

      <div style={{ width: '100%', height: '100%', transform: isFlipped ? 'scaleX(-1)' : 'none', transition: 'transform 0.25s ease' }}>
        <CentrifugalPumpSvg
          isOn={isOn}
          rpm={status === 'Critical' ? 2450 : 2900}
          flowRate={45 + clampPercentage(data?.waterLevel) * 0.25}
          pressure={status === 'Critical' ? 3.6 : 4.5}
          temperature={data?.temperature ?? 42}
          vibration={isOn ? vibration : 0.0}
          efficiency={status === 'Critical' ? 74 : status === 'Warning' ? 85 : 92}
        />
      </div>
      <div className="absolute top-[79%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {data?.nodeName || 'Pump'}
      </div>
    </div>
  );
}

function SwitchNodeView({ id: _id, data }: { id: string; data: any }) {
  const allNodes = useNodes();
  const targetPumpId = data?.targetPumpId;
  const targetPump = targetPumpId ? allNodes.find(n => n.id === targetPumpId) : null;

  const isOn = (targetPump?.data as any)?.pumpOn ?? data?.pumpOn ?? true;
  const switchScale = data?.switchScale ?? 0.6;

  const boxWidth = 150 * switchScale;
  const boxHeight = 195 * switchScale;

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 140, minHeight: 180, position: 'relative' }}>
      <div
        className="nodrag nopan"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: boxWidth,
          height: boxHeight,
          zIndex: 35,
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <Pump3DSwitch
            isOn={isOn}
            canControl={true}
            onToggle={() => {
              if (data?.onTogglePump && targetPumpId) {
                data.onTogglePump(targetPumpId, !isOn);
              }
            }}
            scale={switchScale}
          />
        </div>
      </div>
      <div className="absolute top-[79%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1 rounded shadow pointer-events-none z-50">
        {data?.nodeName || 'Switch'}
      </div>
    </div>
  );
}

function SensorNodeView({ data }: { data: any }) {
  const type = data?.nodeType || 'water_level';
  const name = data?.nodeName || 'Telemetry Sensor';

  const configs: Record<string, { icon: any; color: string; val: string; svgName: string }> = {
    water_level: { icon: <Gauge size={14} />, color: '#38bdf8', val: `${data?.waterLevel ?? 0}%`, svgName: 'ultrasonic' },
    ph: { icon: <Activity size={14} />, color: '#10b981', val: `${data?.ph ?? 0} pH`, svgName: 'ph' },
    tds: { icon: <Zap size={14} />, color: '#f59e0b', val: `${data?.tds ?? 0} ppm`, svgName: 'tds' },
    temperature: { icon: <Thermometer size={14} />, color: '#ef4444', val: `${data?.temperature ?? 0}°C`, svgName: 'temperature' },
  };
  const cfg = configs[type] || configs.water_level;

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 30, minHeight: 30, position: 'relative' }}>
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '8px',
        border: 'none',
        borderRadius: 16,
        transition: 'all 0.16s ease',
      }}>
        <div style={{
          width: '75%', height: '75%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.16s ease',
        }}>
          <img 
            src={`/assets/sensors/${cfg.svgName}.svg`} 
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  central_tank: CentralTankNodeView,
  source_tank: SourceTankNodeView,
  tank: TankNodeView,
  pump: PumpNodeView,
  water_level: SensorNodeView,
  ph: SensorNodeView,
  tds: SensorNodeView,
  temperature: SensorNodeView,
  sensor: SensorNodeView,
  switch: SwitchNodeView,
};

const edgeTypes = {
  waterFlow: WaterFlowEdge,
};

const getDefaultNodeDimensions = (type: string = '') => {
  if (['water_level', 'ph', 'tds', 'temperature', 'sensor'].includes(type)) {
    return { width: 90, height: 90 };
  }
  if (type === 'pump') {
    return { width: 387, height: 242 };
  }
  if (type.includes('central') || type.includes('source') || type === 'source' || type.includes('tank')) {
    return { width: 295, height: 376 };
  }
  return { width: 295, height: 376 };
};

export default function Analytics() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // --- State for active Topology Context ---
  const { globalTopologyId } = useGlobalTopology();
  const [topologyName, setTopologyName] = useState<string>('Star Topology');

  // --- State for Left Panel (Simulation Setup) ---
  const [initialLevel, setInitialLevel] = useState<number>(80);
  const [scenario, setScenario] = useState<string>('Normal Operation');
  const [solventGrams, setSolventGrams] = useState<number>(50);
  const [simulationSpeed, setSimulationSpeed] = useState<string>('1x (Real-time)');
  const [motorSpeed, setMotorSpeed] = useState<number>(1500);
  const [targetFlow, setTargetFlow] = useState<number>(5.2);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Focus tracking for input styling
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // --- State for Right Panel (Metrics & Alerts) ---
  const [tank1Level, setTank1Level] = useState<number>(25.0);
  const [tank2Level, setTank2Level] = useState<number>(25.0);
  const [tank3Level, setTank3Level] = useState<number>(25.0);
  const [tank4Level, setTank4Level] = useState<number>(25.0);
  const [tds, setTds] = useState<number>(180);
  const [ph, setPh] = useState<number>(7.2);
  const [pressure, setPressure] = useState<number>(3.4);
  const [flowRate, setFlowRate] = useState<number>(5.2);
  const [temperature, setTemperature] = useState<number>(25.0);
  const [healthIndex, setHealthIndex] = useState<number>(98);
  const [alerts, setAlerts] = useState<Array<{ id: string; type: 'warning' | 'critical'; msg: string; time: string }>>([
    {
      id: 'initial',
      type: 'warning',
      msg: 'Central Tank Low Water Level Warning (14.93% remaining)',
      time: '14:35:19'
    }
  ]);

  // --- Sparkline Data State ---
  const [tdsHistory, setTdsHistory] = useState<number[]>([178, 180, 179, 181, 180, 182, 180]);
  const [flowHistory, setFlowHistory] = useState<number[]>([5.2, 5.2, 5.1, 5.3, 5.2, 5.2, 5.2]);

  // --- Live Logs State ---
  const [logs, setLogs] = useState<string[]>([]);

  // --- ReactFlow States ---
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [initialViewportConfig, setInitialViewportConfig] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Timer Ref for simulation tick
  const tickIntervalRef = useRef<any>(null);

  // Helper to get speed multiplier
  const getSpeedMultiplier = () => {
    switch (simulationSpeed) {
      case '0.5x': return 0.5;
      case '2x': return 2;
      case '5x': return 5;
      case '10x': return 10;
      default: return 1;
    }
  };

  // --- Fullscreen toggle support exactly mirroring TopologyCanvas.tsx ---
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasContainerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // --- Viewport auto-fitting exactly matching TopologyCanvas.tsx ---
  useEffect(() => {
    if (rfInstance && initialViewportConfig) {
      setTimeout(() => {
        rfInstance.fitBounds({
          x: initialViewportConfig.x,
          y: initialViewportConfig.y,
          width: initialViewportConfig.w,
          height: initialViewportConfig.h
        }, { duration: 0, padding: isFullscreen ? 0.20 : 0 });
      }, 80);
    }
  }, [rfInstance, initialViewportConfig, isFullscreen]);

  // --- Fetch active topology info from backend ---
  useEffect(() => {
    if (!globalTopologyId) return;
    axios.get(`http://localhost:3001/api/topologies/${globalTopologyId}`)
      .then(res => {
        const data = res.data;
        const name = data.name || 'Star Topology';
        const lower = name.toLowerCase();
        if (lower.includes('bus')) {
          setTopologyName('Bus Topology');
        } else if (lower.includes('line')) {
          setTopologyName('Line Topology');
        } else if (lower.includes('star')) {
          setTopologyName('Star Topology');
        } else {
          // Fallback to capitalizing each word
          const formatted = name.replace(/\b\w/g, (char: string) => char.toUpperCase());
          setTopologyName(formatted);
        }

        // Parse viewport configuration details from topology description
        let vpConfig = { x: -500, y: -250, w: 1000, h: 500 };
        let customConfigs: Record<string, any> = {};
        if (data.description) {
          try {
            const parsed = JSON.parse(data.description);
            if (parsed.viewport && parsed.viewport.w) vpConfig = parsed.viewport;
            if (parsed.customConfigs) customConfigs = parsed.customConfigs;
          } catch (e) { }
        }
        setInitialViewportConfig(vpConfig);

        // Map database nodes using exactly customConfigs logic of live canvas
        const formattedNodes = (data.nodes || [])
          .map((node: any) => {
            const cfg = { ...(customConfigs[node.id] || {}), ...(node.attributes || {}) };
            const defDims = getDefaultNodeDimensions(node.nodeType);
            const w = cfg.customWidth || (node.width && node.height ? node.width : defDims.width);
            const h = cfg.customHeight || (node.width && node.height ? node.height : defDims.height);
            const isSensor = ['water_level', 'ph', 'tds', 'temperature', 'sensor'].includes(node.nodeType);
            const zIndexVal = isSensor ? 20 : 5;

            return {
              id: node.id.toString(),
              type: node.nodeType,
              position: { x: node.positionX, y: node.positionY },
              draggable: false,
              style: { width: w, height: h, zIndex: zIndexVal },
              data: {
                nodeName: node.nodeName,
                nodeType: node.nodeType,
                status: node.status,
                flipHorizontal: cfg.flipHorizontal,
                inletValveOn: cfg.inletValveOn ?? true,
                outletValveOn: cfg.outletValveOn ?? true,
                pumpOn: cfg.pumpOn ?? true,
                waterLevel: node.nodeType === 'central_tank' ? initialLevel : 25.0,
                ph: 7.2,
                tds: 180,
                temperature: 25.0,
                switchScale: cfg.switchScale,
                switchOffsetX: cfg.switchOffsetX,
                switchOffsetY: cfg.switchOffsetY,
                inletSwitchOffsetX: cfg.inletSwitchOffsetX,
                inletSwitchOffsetY: cfg.inletSwitchOffsetY,
                inletSwitchScale: cfg.inletSwitchScale,
                outletSwitchOffsetX: cfg.outletSwitchOffsetX,
                outletSwitchOffsetY: cfg.outletSwitchOffsetY,
                outletSwitchScale: cfg.outletSwitchScale,
                inlet1On: cfg.inlet1On,
                inlet2On: cfg.inlet2On,
                inlet3On: cfg.inlet3On,
                inlet4On: cfg.inlet4On,
                targetPumpId: cfg.targetPumpId,
                // Pass toggles callbacks
                onToggleTankValve: (nodeId: string, type: 'inlet' | 'outlet', value: boolean) => {
                  setNodes(prev => prev.map(n => {
                    if (n.id === nodeId) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          [type === 'inlet' ? 'inletValveOn' : 'outletValveOn']: value
                        }
                      };
                    }
                    return n;
                  }));
                },
                onTogglePump: (nodeId: string, value: boolean) => {
                  setNodes(prev => prev.map(n => {
                    if (n.id === nodeId) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          pumpOn: value
                        }
                      };
                    }
                    return n;
                  }));
                  // Clicking the physical pump switch on the diagram starts/stops the local simulation!
                  setIsSimulating(value);
                }
              }
            };
          });

        // Map database edges to WaterFlowEdge
        const formattedEdges = (data.edges || []).map((edge: any) => ({
          id: edge.id.toString(),
          source: edge.sourceNodeId.toString(),
          target: edge.targetNodeId.toString(),
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: 'waterFlow',
          animated: false,
          data: {
            isFlowing: false,
            customPoints: edge.attributes?.customPoints || [],
          }
        }));

        setNodes(formattedNodes);
        setEdges(formattedEdges);
      })
      .catch(() => {
        setTopologyName('Star Topology');
      });
  }, [globalTopologyId, setNodes, setEdges]);

  // --- Dynamic state binding to ReactFlow elements ---
  useEffect(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        const name = (node.data?.nodeName || '').toLowerCase();
        const isCentral = node.type === 'central_tank' || name.includes('central');
        const isT1 = name.includes('t1') || name.includes('tank - 1') || name.includes('tank 1');
        const isT2 = name.includes('t2') || name.includes('tank - 2') || name.includes('tank 2');
        const isT3 = name.includes('t3') || name.includes('tank - 3') || name.includes('tank 3');
        const isT4 = name.includes('t4') || name.includes('tank - 4') || name.includes('tank 4');
        const isPump = node.type === 'pump' || name.includes('pump');

        let level = 25.0;
        if (isCentral) level = initialLevel;
        else if (isT1) level = tank1Level;
        else if (isT2) level = tank2Level;
        else if (isT3) level = tank3Level;
        else if (isT4) level = tank4Level;

        return {
          ...node,
          data: {
            ...node.data,
            waterLevel: level,
            ph: ph,
            tds: tds,
            temperature: temperature,
            status: isPump ? (isSimulating ? 'Healthy' : 'Offline') : node.data.status,
            pumpOn: isPump ? isSimulating : node.data.pumpOn,
            vibration: isPump ? (isSimulating ? 1.8 : 0.0) : undefined,
          }
        };
      })
    );
  }, [initialLevel, tank1Level, tank2Level, tank3Level, tank4Level, ph, tds, temperature, isSimulating, setNodes]);

  // --- Dynamic flow edge animation updates ---
  useEffect(() => {
    setEdges(prevEdges => 
      prevEdges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          isFlowing: isSimulating,
        },
        animated: isSimulating,
      }))
    );
  }, [isSimulating, setEdges]);

  // --- Handle Simulation Ticks ---
  useEffect(() => {
    if (isSimulating) {
      const intervalMs = 1000 / getSpeedMultiplier();
      
      tickIntervalRef.current = setInterval(() => {
        // 1. Update Tank Levels with drift
        let t1Next = 25.0;
        let t2Next = 25.0;
        let t3Next = 25.0;
        let t4Next = 25.0;

        setTank1Level(prev => {
          const delta = (Math.random() - 0.5) * 0.4;
          t1Next = parseFloat(Math.max(10, Math.min(95, prev + delta)).toFixed(1));
          return t1Next;
        });
        setTank2Level(prev => {
          const delta = (Math.random() - 0.5) * 0.4;
          t2Next = parseFloat(Math.max(10, Math.min(95, prev + delta)).toFixed(1));
          return t2Next;
        });
        setTank3Level(prev => {
          const delta = (Math.random() - 0.5) * 0.4;
          t3Next = parseFloat(Math.max(10, Math.min(95, prev + delta)).toFixed(1));
          return t3Next;
        });
        setTank4Level(prev => {
          const delta = (Math.random() - 0.5) * 0.4;
          t4Next = parseFloat(Math.max(10, Math.min(95, prev + delta)).toFixed(1));
          return t4Next;
        });

        // 2. Update Pressure & Temperature with slight drift
        setPressure(prev => {
          const target = targetFlow * 0.65;
          const drift = (Math.random() - 0.5) * 0.15;
          return parseFloat(Math.max(0.5, Math.min(10.0, prev * 0.8 + target * 0.2 + drift)).toFixed(1));
        });
        setTemperature(prev => {
          const drift = (Math.random() - 0.5) * 0.1;
          return parseFloat(Math.max(15, Math.min(40, prev + drift)).toFixed(1));
        });

        // 3. Flow rate matches target flow with minor noise
        setFlowRate(() => {
          const noise = (Math.random() - 0.5) * 0.1;
          return parseFloat(Math.max(0, targetFlow + noise).toFixed(1));
        });

        // 4. Update specific properties based on Scenario
        let targetTds = 180;
        let targetPh = 7.2;
        let targetHealth = 98;
        let activeAlerts: Array<{ id: string; type: 'warning' | 'critical'; msg: string; time: string }> = [];

        // Current time format
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

        // Alert condition if initial level is low
        if (initialLevel < 20) {
          activeAlerts.push({
            id: 'low-level',
            type: 'warning',
            msg: `Central Tank Low Water Level Warning (${initialLevel.toFixed(2)}% remaining)`,
            time: timeStr
          });
          targetHealth -= 15;
        }

        if (scenario === 'Normal Operation') {
          targetTds = 180 + Math.round((Math.random() - 0.5) * 10);
          targetPh = parseFloat((7.2 + (Math.random() - 0.5) * 0.15).toFixed(2));
          targetHealth = Math.max(80, targetHealth);
        } else if (scenario === 'Sand Impurities') {
          // TDS scale: baseline 180 + 2.8 per gram of sand
          targetTds = 180 + Math.round(solventGrams * 2.8) + Math.round((Math.random() - 0.5) * 20);
          targetPh = parseFloat((7.1 + (Math.random() - 0.5) * 0.15).toFixed(2));
          
          // Health penalty increases with sand concentration
          const penalty = Math.round(solventGrams * 0.3);
          targetHealth -= penalty;

          activeAlerts.push({
            id: 'sand-impurities',
            type: 'warning',
            msg: `Sand particles detected - sediment filter blockage warning (${targetTds} mg/L)`,
            time: timeStr
          });
        } else if (scenario === 'Salt Impurities') {
          // TDS scale: baseline 180 + 12.8 per gram of salt
          targetTds = 180 + Math.round(solventGrams * 12.8) + Math.round((Math.random() - 0.5) * 35);
          targetPh = parseFloat((7.2 + (Math.random() - 0.5) * 0.15).toFixed(2));
          
          // Health penalty increases with salinity
          const penalty = Math.round(solventGrams * 0.76);
          targetHealth -= penalty;

          activeAlerts.push({
            id: 'salt-impurities',
            type: 'critical',
            msg: `High Saline concentration detected - TDS limits breached (${targetTds} mg/L)`,
            time: timeStr
          });
        } else if (scenario === 'Mud Impurities') {
          // TDS scale: baseline 180 + 9.4 per gram of mud
          targetTds = 180 + Math.round(solventGrams * 9.4) + Math.round((Math.random() - 0.5) * 30);
          // pH drops with mud acidity
          targetPh = parseFloat((7.2 - (solventGrams * 0.012) + (Math.random() - 0.5) * 0.2).toFixed(2));
          
          // Health penalty increases with mud content
          const penalty = Math.round(solventGrams * 0.96);
          targetHealth -= penalty;

          activeAlerts.push({
            id: 'mud-impurities',
            type: 'critical',
            msg: `Severe Turbidity Alert - Mud/Sediment contamination in Main Line (${targetTds} mg/L)`,
            time: timeStr
          });
        }

        // Apply health and metrics changes smoothly
        setTds(targetTds);
        setPh(targetPh);
        setHealthIndex(Math.max(10, Math.min(100, targetHealth)));
        setAlerts(activeAlerts);

        // Update sparkline history arrays (keep length 7)
        setTdsHistory(prev => [...prev.slice(1), targetTds]);
        setFlowHistory(prev => [...prev.slice(1), parseFloat((targetFlow + (Math.random() - 0.5) * 0.1).toFixed(1))]);

        // Push new telemetry log to console
        const formattedLog = `[${timeStr}] WL: [C:${initialLevel.toFixed(1)}% | T1:${t1Next.toFixed(1)}% | T2:${t2Next.toFixed(1)}% | T3:${t3Next.toFixed(1)}% | T4:${t4Next.toFixed(1)}%] | TDS: ${targetTds} mg/L | pH: ${targetPh.toFixed(2)}`;
        setLogs(prev => [formattedLog, ...prev].slice(0, 50));

      }, intervalMs);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isSimulating, scenario, simulationSpeed, initialLevel, targetFlow, solventGrams]);

  // Handle start/stop toggle
  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
    if (!isSimulating) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLogs(prev => [`[${timeStr}] [SYSTEM] Physics engine started in ${scenario} mode.`, ...prev]);
    } else {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setLogs(prev => [`[${timeStr}] [SYSTEM] Physics engine simulation stopped.`, ...prev]);
    }
  };

  // Reset metrics
  const resetSimulation = () => {
    setIsSimulating(false);
    setTank1Level(25.0);
    setTank2Level(25.0);
    setTank3Level(25.0);
    setTank4Level(25.0);
    setTds(180);
    setPh(7.2);
    setPressure(3.4);
    setFlowRate(5.2);
    setTemperature(25.0);
    setHealthIndex(98);
    setSolventGrams(50);
    setLogs([]);
    setAlerts([
      {
        id: 'initial',
        type: 'warning',
        msg: 'Central Tank Low Water Level Warning (14.93% remaining)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      }
    ]);
    setTdsHistory([178, 180, 179, 181, 180, 182, 180]);
    setFlowHistory([5.2, 5.2, 5.1, 5.3, 5.2, 5.2, 5.2]);
  };

  // --- Theme Styles ---
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '330px 1fr 330px',
    gap: 20,
    height: '100%',
    width: '100%',
    minHeight: 0,
    background: dark ? '#111215' : '#f3f4f6',
    padding: 24,
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
    color: dark ? '#f0f0f2' : '#17181c',
    overflow: 'hidden',
  };

  const cardStyle: React.CSSProperties = {
    background: dark ? '#1c1d22' : '#ffffff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
    borderRadius: 18,
    boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 22px',
    overflowY: 'auto',
  };

  const getLabelStyle = (): React.CSSProperties => ({
    fontSize: 12.5,
    fontWeight: 700,
    color: dark ? '#e2e8f0' : '#4b5563',
    letterSpacing: '-0.1px',
  });

  const getSubHeaderStyle = (): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: dark ? '#6b7280' : '#888888',
    marginBottom: 8,
  });

  const getFieldContainerStyle = (): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  });

  const getSelectInputStyle = (fieldName: string): React.CSSProperties => ({
    height: 42,
    padding: '0 14px',
    borderRadius: 10,
    width: '100%',
    border: `1px solid ${
      focusedField === fieldName 
        ? (dark ? '#00ffff' : '#0891b2') 
        : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)')
    }`,
    background: dark ? '#22232a' : '#f8fafc',
    fontSize: 14,
    color: dark ? '#f0f0f2' : '#17181c',
    outline: 'none',
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: focusedField === fieldName 
      ? `0 0 0 3px ${dark ? 'rgba(0,255,255,0.12)' : 'rgba(8,145,178,0.12)'}` 
      : 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={containerStyle}>
      
      {/* =================================================================
         LEFT COLUMN — SIMULATION SETUP
         ================================================================= */}
      <div style={cardStyle}>
        
        {/* Setup Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={15} color={dark ? '#00ffff' : '#0891b2'} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? '#9ca3af' : '#5a5f6b' }}>
              Simulation Setup
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            background: isSimulating ? 'rgba(34,197,94,0.12)' : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            border: `1px solid ${isSimulating ? '#22c55e' : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}`,
            color: isSimulating ? '#22c55e' : (dark ? '#9ca3af' : '#6b7280'),
            letterSpacing: '0.04em'
          }}>
            {isSimulating ? 'RUNNING' : 'READY'}
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 20 }}>
          {topologyName} Digital Twin Physics Engine
        </span>

        {/* Setup Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Initial Water Level */}
          <div style={getFieldContainerStyle()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={getLabelStyle()}>
                Initial Central Tank Water Level (%)
              </label>
              <span style={{
                fontSize: 8.5, fontWeight: 800, color: '#ef4444',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                padding: '2px 6px', borderRadius: 4, transform: 'scale(0.95)'
              }}>
                * REQUIRED
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="number"
                value={initialLevel}
                onChange={(e) => setInitialLevel(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                onFocus={() => setFocusedField('initialLevel')}
                onBlur={() => setFocusedField(null)}
                disabled={isSimulating}
                style={{
                  ...getSelectInputStyle('initialLevel'),
                  paddingRight: 28,
                }}
                min="0"
                max="100"
              />
              <span style={{ position: 'absolute', right: 12, fontSize: 13.5, color: '#9ca3af', fontWeight: 600 }}>%</span>
            </div>
            <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, lineHeight: 1.4 }}>
              Sets the initial volume for Central Tank before simulation start.
            </p>
          </div>

          {/* Select Scenario */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Select Scenario</label>
            <select
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
              }}
              onFocus={() => setFocusedField('scenario')}
              onBlur={() => setFocusedField(null)}
              disabled={isSimulating}
              style={getSelectInputStyle('scenario')}
            >
              <option value="Normal Operation">Normal Operation</option>
              <option value="Sand Impurities">Sand Impurities</option>
              <option value="Salt Impurities">Salt Impurities</option>
              <option value="Mud Impurities">Mud Impurities</option>
            </select>
          </div>

          {/* Simulation Speed */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Simulation Speed</label>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(e.target.value)}
              onFocus={() => setFocusedField('simulationSpeed')}
              onBlur={() => setFocusedField(null)}
              style={getSelectInputStyle('simulationSpeed')}
            >
              <option value="0.5x">0.5x (Slow)</option>
              <option value="1x (Real-time)">1x (Real-time)</option>
              <option value="2x">2x (Fast)</option>
              <option value="5x">5x (Accelerated)</option>
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '12px 0' }} />

          {/* Physical Parameters Sub header */}
          <span style={getSubHeaderStyle()}>Physical Parameters</span>

          {/* Baseline info box */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10,
            background: scenario === 'Normal Operation' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            border: `1px solid ${scenario === 'Normal Operation' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: scenario === 'Normal Operation' ? '#22c55e' : '#ef4444',
            fontSize: 12, fontWeight: 600, marginBottom: 16, lineHeight: 1.4
          }}>
            {scenario === 'Normal Operation' ? (
              <>
                <CheckCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Clean baseline active. No contamination present.</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{scenario} active! High risk of sensor threshold breach.</span>
              </>
            )}
          </div>

          {/* Solvent amount in grams (Conditional) */}
          {scenario !== 'Normal Operation' && (
            <div style={getFieldContainerStyle()}>
              <label style={getLabelStyle()}>
                {scenario === 'Sand Impurities' && 'Sand (grams)'}
                {scenario === 'Salt Impurities' && 'Salt (grams)'}
                {scenario === 'Mud Impurities' && 'Mud (grams)'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="number"
                  value={solventGrams}
                  onChange={(e) => setSolventGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                  onFocus={() => setFocusedField('solventGrams')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSimulating}
                  style={{
                    ...getSelectInputStyle('solventGrams'),
                    paddingRight: 28,
                  }}
                  min="0"
                />
                <span style={{ position: 'absolute', right: 12, fontSize: 13.5, color: '#9ca3af', fontWeight: 600 }}>g</span>
              </div>
            </div>
          )}

          {/* Motor Speed */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Motor Speed (RPM)</label>
            <input 
              type="number"
              value={motorSpeed}
              onChange={(e) => setMotorSpeed(Math.max(0, parseInt(e.target.value) || 0))}
              onFocus={() => setFocusedField('motorSpeed')}
              onBlur={() => setFocusedField(null)}
              disabled={isSimulating}
              style={getSelectInputStyle('motorSpeed')}
            />
          </div>

          {/* Target Flow */}
          <div style={getFieldContainerStyle()}>
            <label style={getLabelStyle()}>Target Flow (L/s)</label>
            <input 
              type="number"
              value={targetFlow}
              onChange={(e) => setTargetFlow(Math.max(0, parseFloat(e.target.value) || 0))}
              onFocus={() => setFocusedField('targetFlow')}
              onBlur={() => setFocusedField(null)}
              disabled={isSimulating}
              style={getSelectInputStyle('targetFlow')}
              step="0.1"
            />
          </div>

        </div>

        {/* Play/Stop controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            onClick={toggleSimulation}
            style={{
              flex: 1, height: 42, borderRadius: 12, border: 'none',
              background: isSimulating ? '#ef4444' : '#10b981',
              color: '#ffffff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: isSimulating ? '0 2px 10px rgba(239,68,68,0.15)' : '0 2px 10px rgba(16,185,129,0.15)',
              transition: 'background 0.2s',
            }}
          >
            {isSimulating ? (
              <>
                <Square size={14} fill="white" />
                <span>Stop Simulation</span>
              </>
            ) : (
              <>
                <Play size={14} fill="white" />
                <span>Start Simulation</span>
              </>
            )}
          </button>
          
          <button
            onClick={resetSimulation}
            style={{
              width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: dark ? '#22232a' : '#f8fafc',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
              borderRadius: 12, color: dark ? '#9ca3af' : '#4b5563', cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            title="Reset Simulation"
          >
            <RotateCcw size={16} />
          </button>
        </div>

      </div>

      {/* =================================================================
         MIDDLE COLUMN — INDEPENDENT PHYSICS SIMULATION CANVAS
         ================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%', minHeight: 0 }}>
        
        {/* Schematic Canvas */}
        <div 
          ref={canvasContainerRef}
          style={{
            flex: 1, background: dark ? '#1c1d22' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: isFullscreen ? 0 : 18, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
            height: isFullscreen ? '100vh' : '100%', width: isFullscreen ? '100vw' : '100%'
          }}
        >
          
          {/* Schematic header toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
            background: dark ? '#22232a' : '#f8fafc'
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b' }}>Physical Topology Canvas</span>
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                onClick={toggleFullscreen}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', 
                  background: dark ? '#22232a' : '#f8fafc',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}`, 
                  borderRadius: 8, fontSize: 11.5, fontWeight: 700, 
                  color: dark ? '#e2e8f0' : '#4b5563', cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
              >
                {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}</span>
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'transparent',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 8,
                fontSize: 11.5, fontWeight: 600, color: dark ? '#9ca3af' : '#5a5f6b', cursor: 'not-allowed'
              }}>
                <Sliders size={12} />
                Read-Only Sim
              </button>
            </div>
          </div>

          {/* Schematic Body: Render ReactFlow Canvas */}
          <div style={{ flex: 1, position: 'relative', background: dark ? '#17181c' : '#f8fafc' }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setRfInstance}
                nodesConnectable={false}
                nodesDraggable={false}
                elementsSelectable={false}
                zoomOnScroll={true}
                panOnDrag={true}
                preventScrolling={true}
                minZoom={0.15}
                maxZoom={3.5}
              >
                <Background color={dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} gap={16} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

        </div>

        {/* Telemetry Console Outline */}
        {!isFullscreen && (
          <div style={{
            height: 180, background: '#111215', border: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16,
            fontFamily: 'monospace', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.40)'
          }}>
            {/* Console Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6
            }}>
              <span style={{ fontSize: 9.5, color: '#00ffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                &gt;_ SIMULATION TELEMETRY CONSOLE
              </span>
              <span style={{ fontSize: 8.5, color: '#6b7280' }}>{logs.length} events logged</span>
            </div>

            {/* Console content: Live Logs */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} style={{ fontSize: 11, color: '#a7f3d0', whiteSpace: 'nowrap' }}>
                    {log}
                  </div>
                ))
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px' }}>
                  <span style={{ fontSize: 10.5, color: '#9ca3af', lineHeight: 1.6 }}>
                    Simulation idle. Enter Initial Central Tank Water Level (%) and click "Start Simulation" to begin real-time telemetry streaming...
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* =================================================================
         RIGHT COLUMN — METRICS & ALERTS
         ================================================================= */}
      <div style={cardStyle}>
        
        {/* Tank Metrics */}
        <div>
          <span style={getSubHeaderStyle()}>Tank Metrics</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Tank 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 1</span>
                <span>{tank1Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tank1Level}%`,
                  background: '#3b82f6',
                  borderRadius: 99,
                  transition: 'width 0.6s ease-out'
                }} />
              </div>
            </div>

            {/* Tank 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 2</span>
                <span>{tank2Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tank2Level}%`,
                  background: '#3b82f6',
                  borderRadius: 99,
                  transition: 'width 0.6s ease-out'
                }} />
              </div>
            </div>

            {/* Tank 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 3</span>
                <span>{tank3Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tank3Level}%`,
                  background: '#3b82f6',
                  borderRadius: 99,
                  transition: 'width 0.6s ease-out'
                }} />
              </div>
            </div>

            {/* Tank 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b', marginBottom: 6 }}>
                <span>Tank 4</span>
                <span>{tank4Level.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, width: '100%', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tank4Level}%`,
                  background: '#3b82f6',
                  borderRadius: 99,
                  transition: 'width 0.6s ease-out'
                }} />
              </div>
            </div>

          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

        {/* Quality Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* TDS Concentration */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TDS Concentration</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: tds > 700 ? '#ef4444' : '#10b981', marginTop: 2 }}>
                {tds} mg/L
              </span>
            </div>
            {/* Sparkline Column Chart */}
            <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 32, width: 80 }}>
              {tdsHistory.map((val, idx) => {
                const maxVal = Math.max(...tdsHistory, 1000);
                const pct = (val / maxVal) * 100;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${pct}%`,
                      background: val > 700 ? '#ef4444' : '#10b981',
                      borderRadius: '2px 2px 0 0',
                      transition: 'height 0.4s ease-out'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* pH Index */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Active pH Index</span>
            <span style={{
              color: ph < 6.5 || ph > 8.5 ? '#ef4444' : (dark ? '#f0f0f2' : '#17181c'),
              fontFamily: 'monospace',
              fontSize: 14
            }}>{ph}</span>
          </div>

          {/* System Pressure */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>System Pressure</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{pressure} bar</span>
          </div>

          {/* Total Flow Rate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Total Flow Rate</span>
            <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: 14 }}>
              {flowRate} L/s
            </span>
          </div>

          {/* Fluid Temperature */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f0f0f2' : '#5a5f6b' }}>Fluid Temperature</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Thermometer size={14} color="#6b7280" />
              {temperature.toFixed(1)}°C
            </span>
          </div>

        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

        {/* System Health Index */}
        <div>
          <span style={getSubHeaderStyle()}>System Health Index</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
            padding: 12, borderRadius: 12
          }}>
            
            {/* SVG Health Ring */}
            <div style={{ width: 48, height: 48, position: 'relative', flexShrink: 0 }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                <circle
                  stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}
                  strokeWidth="3.2"
                  fill="transparent"
                  r="16"
                  cx="18"
                  cy="18"
                />
                <circle
                  stroke={healthIndex < 40 ? '#ef4444' : healthIndex < 75 ? '#f59e0b' : '#22c55e'}
                  strokeWidth="3.2"
                  strokeDasharray="100, 100"
                  strokeDashoffset={100 - healthIndex}
                  strokeLinecap="round"
                  fill="transparent"
                  r="16"
                  cx="18"
                  cy="18"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              {/* Overlay percentage */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace' }}>{healthIndex}%</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{
                fontSize: 12.5, fontWeight: 700,
                color: healthIndex < 40 ? '#ef4444' : healthIndex < 75 ? '#f59e0b' : '#22c55e'
              }}>
                {healthIndex < 40 ? 'Critical Health' : healthIndex < 75 ? 'Caution Advised' : 'Optimal Performance'}
              </span>
              <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>
                {scenario === 'Normal Operation' ? 'Normal active' : `${scenario} active`}
              </span>
            </div>

          </div>
        </div>

        {/* Permeate Flow Rate */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: dark ? '#f0f0f2' : '#5a5f6b' }}>Permeate Flow Rate</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>
              {parseFloat((flowRate * 0.96).toFixed(1))} L/s
            </span>
          </div>
          {/* Mini Sparkline Chart */}
          <div style={{
            display: 'flex', alignItems: 'end', gap: 4, height: 32, width: '100%',
            background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: 10, padding: '6px 12px'
          }}>
            {flowHistory.map((val, idx) => {
              const maxVal = Math.max(...flowHistory, 10);
              const pct = (val / maxVal) * 100;
              return (
                <div 
                  key={idx} 
                  style={{
                    flex: 1,
                    height: `${pct}%`,
                    background: '#3b82f6',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.4s ease-out'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Simulation Alerts */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 130, marginTop: 12 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: alerts.length > 0 && alerts.some(a => a.type === 'critical') ? '#ef4444' : '#888888',
            marginBottom: 8
          }}>
            Simulation Alerts ({alerts.length})
          </span>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
            overflowY: 'auto', maxHeight: 150
          }}>
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div 
                  key={alert.id} 
                  style={{
                    display: 'flex', gap: 8, padding: 12, borderRadius: 10,
                    background: alert.type === 'critical' ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
                    border: `1px solid ${alert.type === 'critical' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'}`,
                    color: alert.type === 'critical' ? '#ef4444' : '#b45309',
                    fontSize: 12.5, lineHeight: 1.4
                  }}
                >
                  <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 700, wordBreak: 'break-word' }}>{alert.msg}</span>
                    <span style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3 }}>{alert.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px dashed rgba(0,0,0,0.08)', borderRadius: 10, padding: 16,
                background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
              }}>
                <span style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
                  No active alerts
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
