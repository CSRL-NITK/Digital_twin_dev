import React from 'react';

// ============================================================================
// DEFAULT CONFIGURATION PARAMETERS (Easy to change values for your workspace!)
// ============================================================================
export const DEFAULT_CONFIG = {
  waterFlowRate: 45.0,    // 1. Water Flow Rate (default: 45.0 m³/h)
  vibrationValue: 1.8,    // 2. Vibration Value (default: 1.8 mm/s)
  vibrationSpeed: 0.04,   // 3. Vibration Speed (default: 0.04)
  leftFanSpeed: 0.05,     // 4. Left Fan Speed (default: 0.05)
  rightShaftSpeed: 0.08,  // 5. Right Shaft Speed (default: 0.08)
  flipHorizontal: false,  // 6. Flip Horizontal (default: false)
};

// ============================================================================
// INLINED TYPES (100% self-contained, no external imports needed)
// ============================================================================
export interface PumpTelemetry {
  isOn: boolean;
  rpm: number;
  flowRate: number; // m³/h
  pressure: number; // bar
  temperature: number; // °C
  vibration: number; // mm/s
  efficiency: number; // %
}

export interface VisualStyle {
  mainBodyColor: string; // #0F766E
  secondaryColor: string; // #22D3EE
  highlightColor: string; // #67E8F9
  darkAccentColor: string; // #334155
  metallicColor: string; // #CBD5E1
  strokeWidth: number; // 1.5, 2, 2.5
  glowEnabled: boolean;
  animateFlow: boolean;
  showFlanges: boolean;
  showFins: boolean;
  flipHorizontal?: boolean;
}

interface CentrifugalPumpSvgProps {
  // Telemetry flat props
  isOn?: boolean;
  rpm?: number;
  flowRate?: number; // m³/h
  pressure?: number; // bar
  temperature?: number; // °C
  vibration?: number; // mm/s
  efficiency?: number; // %

  // Direct manual speeds/times (seconds per full cycle)
  leftFanSpeed?: number;
  rightShaftSpeed?: number;
  vibrationSpeed?: number;

  // VisualStyle flat props
  mainBodyColor?: string;
  secondaryColor?: string;
  highlightColor?: string;
  darkAccentColor?: string;
  metallicColor?: string;
  strokeWidth?: number;
  glowEnabled?: boolean;
  animateFlow?: boolean;
  showFlanges?: boolean;
  showFins?: boolean;
  flipHorizontal?: boolean;

  // Support legacy nested structure
  telemetry?: Partial<PumpTelemetry>;
  style?: Partial<VisualStyle>;
  className?: string;
}

export const CentrifugalPumpSvg: React.FC<CentrifugalPumpSvgProps> = ({
  // Individual flat props destructuring
  isOn: propIsOn,
  rpm: propRpm,
  flowRate: propFlowRate,
  pressure: propPressure,
  temperature: propTemperature,
  vibration: propVibration,
  efficiency: propEfficiency,

  leftFanSpeed,
  rightShaftSpeed,
  vibrationSpeed,

  mainBodyColor: propMainBodyColor,
  secondaryColor: propSecondaryColor,
  highlightColor: propHighlightColor,
  darkAccentColor: propDarkAccentColor,
  metallicColor: propMetallicColor,
  strokeWidth: propStrokeWidth,
  glowEnabled: propGlowEnabled,
  animateFlow: propAnimateFlow,
  showFlanges: propShowFlanges,
  showFins: propShowFins,
  flipHorizontal: propFlipHorizontal,

  telemetry: inputTelemetry = {} as Partial<PumpTelemetry>,
  style: inputStyle = {} as Partial<VisualStyle>,
  className = '',
}) => {
  // Robust cascading fallback: Flat Prop -> Nested Prop -> Default Twin Value
  const resolvedIsOn = propIsOn !== undefined ? propIsOn : (inputTelemetry.isOn !== undefined ? inputTelemetry.isOn : true);
  const resolvedRpm = propRpm !== undefined ? propRpm : (inputTelemetry.rpm !== undefined ? inputTelemetry.rpm : 2900);
  const resolvedFlowRate = propFlowRate !== undefined ? propFlowRate : (inputTelemetry.flowRate !== undefined ? inputTelemetry.flowRate : DEFAULT_CONFIG.waterFlowRate);
  const resolvedPressure = propPressure !== undefined ? propPressure : (inputTelemetry.pressure !== undefined ? inputTelemetry.pressure : 4.5);
  const resolvedTemperature = propTemperature !== undefined ? propTemperature : (inputTelemetry.temperature !== undefined ? inputTelemetry.temperature : 42.0);
  const resolvedVibration = propVibration !== undefined ? propVibration : (inputTelemetry.vibration !== undefined ? inputTelemetry.vibration : DEFAULT_CONFIG.vibrationValue);
  const resolvedEfficiency = propEfficiency !== undefined ? propEfficiency : (inputTelemetry.efficiency !== undefined ? inputTelemetry.efficiency : 82.0);

  // Manual speeds or default fallbacks
  const resolvedLeftFanSpeed = leftFanSpeed !== undefined ? leftFanSpeed : DEFAULT_CONFIG.leftFanSpeed;
  const resolvedRightShaftSpeed = rightShaftSpeed !== undefined ? rightShaftSpeed : DEFAULT_CONFIG.rightShaftSpeed;
  const resolvedVibrationSpeed = vibrationSpeed !== undefined ? vibrationSpeed : DEFAULT_CONFIG.vibrationSpeed;

  const resolvedMainBodyColor = propMainBodyColor ?? inputStyle.mainBodyColor ?? '#0F766E';
  const resolvedSecondaryColor = propSecondaryColor ?? inputStyle.secondaryColor ?? '#22D3EE';
  const resolvedHighlightColor = propHighlightColor ?? inputStyle.highlightColor ?? '#67E8F9';
  const resolvedDarkAccentColor = propDarkAccentColor ?? inputStyle.darkAccentColor ?? '#334155';
  const resolvedMetallicColor = propMetallicColor ?? inputStyle.metallicColor ?? '#CBD5E1';
  const resolvedStrokeWidth = propStrokeWidth ?? inputStyle.strokeWidth ?? 2;
  const resolvedGlowEnabled = propGlowEnabled ?? inputStyle.glowEnabled ?? true;
  const resolvedAnimateFlow = propAnimateFlow ?? inputStyle.animateFlow ?? true;
  const resolvedShowFlanges = propShowFlanges ?? inputStyle.showFlanges ?? true;
  const resolvedShowFins = propShowFins ?? inputStyle.showFins ?? true;
  const resolvedFlipHorizontal = propFlipHorizontal ?? inputStyle.flipHorizontal ?? DEFAULT_CONFIG.flipHorizontal;

  const strokeWidth = resolvedStrokeWidth;
  const strokeColor = resolvedDarkAccentColor;

  const flowRate = resolvedFlowRate;

  // Refs for high performance DOM updates via CSS custom properties
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const stateRef = React.useRef({
    fanAngle: 0,
    shaftAngle: 0,
    flowOffset: 0,
    flowOffsetFast: 0,
    couplingOffset: 0,
    vibPhase: 0,
    fanSpeedFactor: resolvedIsOn ? 1 : 0,
    shaftSpeedFactor: resolvedIsOn ? 1 : 0,
    flowSpeedFactor: resolvedIsOn ? 1 : 0,
    lastTime: 0,
  });

  const propsRef = React.useRef({
    isOn: resolvedIsOn,
    leftFanSpeed: resolvedLeftFanSpeed,
    rightShaftSpeed: resolvedRightShaftSpeed,
    vibrationSpeed: resolvedVibrationSpeed,
    vibration: resolvedVibration,
    flowRate: resolvedFlowRate,
  });

  const elementsRef = React.useRef<{
    vibratingMotors: NodeListOf<SVGElement> | null;
    impellers: NodeListOf<SVGElement> | null;
    fans: NodeListOf<SVGElement> | null;
    shaftLines1: NodeListOf<SVGElement> | null;
    shaftLines2: NodeListOf<SVGElement> | null;
    couplings: NodeListOf<SVGElement> | null;
    flows: NodeListOf<SVGElement> | null;
    flowsFast: NodeListOf<SVGElement> | null;
  }>({
    vibratingMotors: null,
    impellers: null,
    fans: null,
    shaftLines1: null,
    shaftLines2: null,
    couplings: null,
    flows: null,
    flowsFast: null,
  });

  React.useEffect(() => {
    propsRef.current = {
      isOn: resolvedIsOn,
      leftFanSpeed: resolvedLeftFanSpeed,
      rightShaftSpeed: resolvedRightShaftSpeed,
      vibrationSpeed: resolvedVibrationSpeed,
      vibration: resolvedVibration,
      flowRate: resolvedFlowRate,
    };
  }, [resolvedIsOn, resolvedLeftFanSpeed, resolvedRightShaftSpeed, resolvedVibrationSpeed, resolvedVibration, resolvedFlowRate]);

  React.useEffect(() => {
    let animFrameId: number;

    const tick = (now: number) => {
      const state = stateRef.current;
      const props = propsRef.current;

      let dt = (now - state.lastTime) / 1000;
      state.lastTime = now;

      // Guard against frame jumps
      if (dt > 0.1) dt = 0.1;
      if (dt <= 0) dt = 0.016;

      // 1. INERTIA / COATING PHYSICS
      // Left Fan accelerates fast (1.2s), decelerates slow (3.2s)
      const fanTarget = props.isOn ? 1 : 0;
      if (state.fanSpeedFactor < fanTarget) {
        state.fanSpeedFactor = Math.min(fanTarget, state.fanSpeedFactor + dt / 1.2);
      } else if (state.fanSpeedFactor > fanTarget) {
        state.fanSpeedFactor = Math.max(fanTarget, state.fanSpeedFactor - dt / 3.2);
      }

      // Right Shaft/Impeller has higher rotating mass (impeller + core). Accelerates in 2.2s, coasts down slowly over 4.8s!
      const shaftTarget = props.isOn ? 1 : 0;
      if (state.shaftSpeedFactor < shaftTarget) {
        state.shaftSpeedFactor = Math.min(shaftTarget, state.shaftSpeedFactor + dt / 2.2);
      } else if (state.shaftSpeedFactor > shaftTarget) {
        state.shaftSpeedFactor = Math.max(shaftTarget, state.shaftSpeedFactor - dt / 4.8);
      }

      // Flow rate and pressure build up driven by impeller speed
      state.flowSpeedFactor = state.shaftSpeedFactor;

      // 2. ROTATION VELOCITIES
      const fanDegPerSec = (360 / Math.max(0.01, props.leftFanSpeed)) * state.fanSpeedFactor;
      state.fanAngle = (state.fanAngle - fanDegPerSec * dt) % 360;

      const shaftDegPerSec = (360 / Math.max(0.01, props.rightShaftSpeed)) * state.shaftSpeedFactor;
      state.shaftAngle = (state.shaftAngle + shaftDegPerSec * dt) % 360;

      // 3. VIBRATION COUPLING & HARMONIC STRUCTURAL RESONANCE
      const baseFreq = 1 / Math.max(0.01, props.vibrationSpeed); // e.g. 25Hz for 0.04s
      const activeFreq = baseFreq * state.shaftSpeedFactor;
      state.vibPhase += activeFreq * 2 * Math.PI * dt;

      // Resonance Zone around 0.22 shaftSpeedFactor (shuddering on start-up and spin-down)
      const resonantCenter = 0.22;
      const resonantWidth = 0.12;
      const dist = Math.abs(state.shaftSpeedFactor - resonantCenter);
      let resonanceMultiplier = 1.0;
      if (dist < resonantWidth) {
        const intensity = 1.0 - dist / resonantWidth;
        // Amplify vibration by up to 3.5x as it shudders through the resonance band!
        resonanceMultiplier = 1.0 + 2.5 * Math.sin(intensity * Math.PI / 2);
      }

      // Compute final displacement with dual-frequency harmonic wobble + noise for high-fidelity!
      const baseAmp = props.vibration * 0.4; // scaling factor
      const activeAmp = baseAmp * state.shaftSpeedFactor * resonanceMultiplier;

      let vibX = 0;
      let vibY = 0;
      if (activeAmp > 0.01) {
        const primaryX = Math.sin(state.vibPhase);
        const secondaryX = Math.sin(state.vibPhase * 1.62 + 0.5);
        const noiseX = (Math.random() - 0.5) * 0.35;
        vibX = activeAmp * (primaryX * 0.75 + secondaryX * 0.25 + noiseX);

        const primaryY = Math.cos(state.vibPhase * 0.95);
        const secondaryY = Math.cos(state.vibPhase * 2.31 + 1.2);
        const noiseY = (Math.random() - 0.5) * 0.35;
        vibY = activeAmp * (primaryY * 0.7 + secondaryY * 0.3 + noiseY);
      }

      // 4. WATER FLOW OFFSETS
      const flowMaxOffsetPerSec = 180;
      state.flowOffset = (state.flowOffset - flowMaxOffsetPerSec * state.flowSpeedFactor * dt) % 200;
      state.flowOffsetFast = (state.flowOffsetFast - flowMaxOffsetPerSec * 1.5 * state.flowSpeedFactor * dt) % 200;
      state.couplingOffset = (state.couplingOffset - 160 * state.shaftSpeedFactor * dt) % 32;

      // 5. DIRECT DOM NODES MODIFICATION FOR 100% ROBUSTNESS
      const svg = svgRef.current;
      if (svg) {
        // Fetch and cache element nodes if not already loaded
        if (!elementsRef.current.impellers) {
          elementsRef.current = {
            vibratingMotors: svg.querySelectorAll('.vibrating-motor'),
            impellers: svg.querySelectorAll('.spinning-impeller'),
            fans: svg.querySelectorAll('.spinning-fan'),
            shaftLines1: svg.querySelectorAll('.spinning-shaft-line-1'),
            shaftLines2: svg.querySelectorAll('.spinning-shaft-line-2'),
            couplings: svg.querySelectorAll('.spinning-coupling'),
            flows: svg.querySelectorAll('.animated-flow'),
            flowsFast: svg.querySelectorAll('.animated-flow-fast'),
          };
        }

        const cache = elementsRef.current;

        // Apply 2D transforms directly to inline styles
        if (cache.fans) {
          const trans = `rotate(${state.fanAngle}deg)`;
          cache.fans.forEach((el) => {
            el.style.transform = trans;
            el.style.transformOrigin = '145px 250px';
          });
        }

        if (cache.impellers) {
          const trans = `rotate(${state.shaftAngle}deg)`;
          cache.impellers.forEach((el) => {
            el.style.transform = trans;
            el.style.transformOrigin = '560px 250px';
          });
        }

        if (cache.vibratingMotors) {
          const trans = `translate(${vibX}px, ${vibY}px)`;
          cache.vibratingMotors.forEach((el) => {
            el.style.transform = trans;
          });
        }

        if (cache.shaftLines1) {
          const rad = (state.shaftAngle * Math.PI) / 180;
          const sin1 = Math.sin(rad);
          const y1 = sin1 * 20;
          const op1 = 0.1 + 0.8 * (1 - Math.abs(sin1));
          const trans = `translateY(${y1}px)`;
          cache.shaftLines1.forEach((el) => {
            el.style.transform = trans;
            el.style.opacity = `${op1}`;
          });
        }

        if (cache.shaftLines2) {
          const rad = (state.shaftAngle * Math.PI) / 180;
          const sin2 = Math.sin(rad + (2 * Math.PI) / 3);
          const y2 = sin2 * 20;
          const op2 = 0.1 + 0.6 * (1 - Math.abs(sin2));
          const trans = `translateY(${y2}px)`;
          cache.shaftLines2.forEach((el) => {
            el.style.transform = trans;
            el.style.opacity = `${op2}`;
          });
        }

        // Apply SVG stroke line offset animations
        if (cache.couplings) {
          const offset = `${state.couplingOffset}`;
          cache.couplings.forEach((el) => {
            el.style.strokeDashoffset = offset;
          });
        }

        if (cache.flows) {
          const offset = `${state.flowOffset}`;
          cache.flows.forEach((el) => {
            el.style.strokeDashoffset = offset;
          });
        }

        if (cache.flowsFast) {
          const offset = `${state.flowOffsetFast}`;
          cache.flowsFast.forEach((el) => {
            el.style.strokeDashoffset = offset;
          });
        }

        // Keep CSS variables updated as secondary/fallback mechanisms
        svg.style.setProperty('--fan-angle', `${state.fanAngle}deg`);
        svg.style.setProperty('--shaft-angle', `${state.shaftAngle}deg`);
        svg.style.setProperty('--vibration-x', `${vibX}px`);
        svg.style.setProperty('--vibration-y', `${vibY}px`);
        svg.style.setProperty('--flow-offset', `${state.flowOffset}px`);
        svg.style.setProperty('--flow-offset-fast', `${state.flowOffsetFast}px`);
        svg.style.setProperty('--coupling-offset', `${state.couplingOffset}px`);

        if (state.flowSpeedFactor > 0.02) {
          const flowRateVal = props.flowRate;
          const bubbleDurX = flowRateVal > 1 ? Math.max(0.4, 90 / flowRateVal) : 1.5;
          const bubbleDurY = flowRateVal > 1 ? Math.max(0.4, 90 / flowRateVal) : 1.5;

          svg.style.setProperty('--bubble-x-duration', `${bubbleDurX / Math.max(0.1, state.flowSpeedFactor)}s`);
          svg.style.setProperty('--bubble-y-duration', `${bubbleDurY / Math.max(0.1, state.flowSpeedFactor)}s`);
          svg.style.setProperty('--bubble-play-state', 'running');

          svg.style.setProperty('--fluid-ring-duration', `${1.4 / Math.max(0.1, state.flowSpeedFactor)}s`);
          svg.style.setProperty('--fluid-ring-play-state', state.flowSpeedFactor > 0.1 ? 'running' : 'paused');
        } else {
          svg.style.setProperty('--bubble-play-state', 'paused');
          svg.style.setProperty('--fluid-ring-play-state', 'paused');
        }

        // Shaft reflection values are updated directly via element selection
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Construct standard structures to maintain perfect compatibility with references in SVG markup
  const telemetry = {
    isOn: resolvedIsOn,
    rpm: resolvedRpm,
    flowRate: resolvedFlowRate,
    pressure: resolvedPressure,
    temperature: resolvedTemperature,
    vibration: resolvedVibration,
    efficiency: resolvedEfficiency,
  };

  const style = {
    mainBodyColor: resolvedMainBodyColor,
    secondaryColor: resolvedSecondaryColor,
    highlightColor: resolvedHighlightColor,
    darkAccentColor: resolvedDarkAccentColor,
    metallicColor: resolvedMetallicColor,
    strokeWidth: resolvedStrokeWidth,
    glowEnabled: resolvedGlowEnabled,
    animateFlow: resolvedAnimateFlow,
    showFlanges: resolvedShowFlanges,
    showFins: resolvedShowFins,
    flipHorizontal: resolvedFlipHorizontal,
  };

  const isOn = resolvedIsOn;
  const rpm = resolvedRpm;

  // Motor Aura Rectangle parameters with individual corner radii
  const motorAuraX = 162;
  const motorAuraY = 143;
  const motorAuraW = 208;
  const motorAuraH = 218;
  
  // Customize each corner radius individually here:
  const motorAuraTl = 40; // Top-Left corner radius
  const motorAuraTr = 20; // Top-Right corner radius
  const motorAuraBr = 20; // Bottom-Right corner radius
  const motorAuraBl = 40; // Bottom-Left corner radius

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-4 ${className}`}>
      <svg
        ref={svgRef}
        id="centrifugal-water-pump-svg"
        viewBox="0 0 800 500"
        className="w-full h-auto drop-shadow-md select-none transition-all duration-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes flowWater {
              to {
                stroke-dashoffset: -80;
              }
            }
            @keyframes spinImpeller {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            @keyframes spinFan {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(-360deg);
              }
            }
            @keyframes pulseFluidRing {
              0% {
                transform: scale(0.65);
                opacity: 0.9;
              }
              100% {
                transform: scale(1.1);
                opacity: 0;
              }
            }
            @keyframes microVibration {
              0% { transform: translate(0, 0); }
              25% { transform: translate(0.4px, -0.4px); }
              50% { transform: translate(-0.4px, 0.4px); }
              75% { transform: translate(0.4px, 0.4px); }
              100% { transform: translate(0, 0); }
            }
            @keyframes glowPulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 0.95; }
            }
            @keyframes couplingGleam {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -32; }
            }
            @keyframes bubbleFlowX {
              0% {
                transform: translateX(0px);
                opacity: 0;
              }
              15% {
                opacity: 0.8;
              }
              85% {
                opacity: 0.8;
              }
              100% {
                transform: translateX(120px);
                opacity: 0;
              }
            }
            @keyframes bubbleFlowY {
              0% {
                transform: translateY(110px);
                opacity: 0;
              }
              15% {
                opacity: 0.8;
              }
              85% {
                opacity: 0.8;
              }
              100% {
                transform: translateY(0px);
                opacity: 0;
              }
            }
            @keyframes shaftReflect {
              0% {
                transform: translateY(-2px);
                opacity: 0.3;
              }
              50% {
                transform: translateY(2px);
                opacity: 0.95;
              }
              100% {
                transform: translateY(-2px);
                opacity: 0.3;
              }
            }
            @keyframes shaftReflectOppose {
              0% {
                transform: translateY(3px);
                opacity: 0.8;
              }
              50% {
                transform: translateY(-3px);
                opacity: 0.25;
              }
              100% {
                transform: translateY(3px);
                opacity: 0.8;
              }
            }

            .animated-flow {
              stroke-dasharray: 12 18;
              stroke-dashoffset: var(--flow-offset, 0px);
            }
            .animated-flow-fast {
              stroke-dasharray: 8 12;
              stroke-dashoffset: var(--flow-offset-fast, 0px);
            }
            .vibrating-motor {
              transform: translate(var(--vibration-x, 0px), var(--vibration-y, 0px));
            }
            .glowing-indicator {
              animation: ${isOn ? 'glowPulse 1.2s ease-in-out infinite' : 'none'};
            }
            .spinning-coupling {
              stroke-dasharray: 12 4;
              stroke-dashoffset: var(--coupling-offset, 0px);
            }
            .spinning-impeller {
              transform-origin: 560px 250px;
              transform: rotate(var(--shaft-angle, 0deg));
            }
            .spinning-fan {
              transform-origin: 145px 250px;
              transform: rotate(var(--fan-angle, 0deg));
            }
            .pulsing-fluid-ring {
              transform-origin: 560px 250px;
              animation: pulseFluidRing var(--fluid-ring-duration, 1.4s) cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
              animation-play-state: var(--fluid-ring-play-state, paused);
            }
            .fluid-bubble-x {
              animation: bubbleFlowX var(--bubble-x-duration, 1.5s) linear infinite;
              animation-play-state: var(--bubble-play-state, paused);
            }
            .fluid-bubble-y {
              animation: bubbleFlowY var(--bubble-y-duration, 1.5s) linear infinite;
              animation-play-state: var(--bubble-play-state, paused);
            }
            .spinning-shaft-line-1 {
              transform: translateY(var(--shaft-reflect-y-1, -10px));
              opacity: var(--shaft-reflect-opacity-1, 0.6);
            }
            .spinning-shaft-line-2 {
              transform: translateY(var(--shaft-reflect-y-2, 10px));
              opacity: var(--shaft-reflect-opacity-2, 0.4);
            }
          `}
        </style>

        {/* DEFINE GRADIENTS & EFFECTS */}
        <defs>
          {/* Motor Body Gradient */}
          <linearGradient id="motorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={style.mainBodyColor} />
            <stop offset="35%" stopColor={style.mainBodyColor} />
            <stop offset="100%" stopColor="#0B5953" />
          </linearGradient>

          {/* Cyan Fluid Gradient */}
          <linearGradient id="fluidGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={style.secondaryColor} />
            <stop offset="50%" stopColor={style.highlightColor} />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Metallic Elements Gradient */}
          <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor={style.metallicColor} />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Dark Accents Gradient */}
          <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor={style.darkAccentColor} />
          </linearGradient>

          {/* Pump Casing Volute Gradient */}
          <radialGradient id="voluteGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="60%" stopColor={style.mainBodyColor} />
            <stop offset="100%" stopColor="#0B534C" />
          </radialGradient>

          {/* Soft Shadow Filter */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={resolvedFlipHorizontal ? "translate(800, 0) scale(-1, 1)" : undefined}>
          {/* BACKGROUND GLOWS (DIGITAL TWIN EFFECT) */}
        {style.glowEnabled && (
          <g filter="url(#softGlow)" opacity={rpm > 100 ? 1 : 0} className="transition-opacity duration-700">
            {/* Aura around Pump Casing */}
            <circle cx="560" cy="250" r="100" fill={style.secondaryColor} opacity="0.15" />
            {/* Aura around Motor with custom independent corner radii */}
            <path
              d={`M ${motorAuraX + motorAuraTl} ${motorAuraY} H ${motorAuraX + motorAuraW - motorAuraTr} A ${motorAuraTr} ${motorAuraTr} 0 0 1 ${motorAuraX + motorAuraW} ${motorAuraY + motorAuraTr} V ${motorAuraY + motorAuraH - motorAuraBr} A ${motorAuraBr} ${motorAuraBr} 0 0 1 ${motorAuraX + motorAuraW - motorAuraBr} ${motorAuraY + motorAuraH} H ${motorAuraX + motorAuraBl} A ${motorAuraBl} ${motorAuraBl} 0 0 1 ${motorAuraX} ${motorAuraY + motorAuraH - motorAuraBl} V ${motorAuraY + motorAuraTl} A ${motorAuraTl} ${motorAuraTl} 0 0 1 ${motorAuraX + motorAuraTl} ${motorAuraY} Z`}
              fill={style.mainBodyColor}
              opacity="0.08"
            />
          </g>
        )}

        {/* =======================================================
            SECTION 1: PIPES AND WATER FLOW (BACKGROUND LAYER)
           ======================================================= */}
        
        {/* Horizontal Suction Inlet Pipe (Left) */}
        <g id="suction-pipe">
          {/* Main pipe cylinder */}
          <rect
            x="40"
            y="225"
            width="120"
            height="50"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="transition-all"
          />
          {/* Inner fluid visualization */}
          <rect
            x="40"
            y="233"
            width="120"
            height="34"
            fill="#E0F2FE"
            opacity="0.85"
          />
          {/* Water flow lines inside suction pipe */}
          {style.animateFlow && (
            <g opacity={flowRate > 0.5 ? 0.95 : 0.4} className="transition-opacity duration-500">
              <line
                x1="40"
                y1="250"
                x2="160"
                y2="250"
                stroke={style.secondaryColor}
                strokeWidth="5"
                strokeLinecap="round"
                className="animated-flow"
              />
              <line
                x1="40"
                y1="239"
                x2="160"
                y2="239"
                stroke={style.highlightColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                className="animated-flow-fast"
              />
              <line
                x1="40"
                y1="261"
                x2="160"
                y2="261"
                stroke={style.secondaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animated-flow-fast"
                style={{ animationDelay: '0.4s' }}
              />
              {/* Dynamic bubble particles inside suction pipe */}
              <g opacity={flowRate > 1 ? 0.85 : 0} className="transition-opacity duration-700">
                <circle cx="45" cy="244" r="3" fill="#FFFFFF" className="fluid-bubble-x" style={{ animationDelay: '0s' }} />
                <circle cx="45" cy="256" r="2" fill="#E0F2FE" className="fluid-bubble-x" style={{ animationDelay: '0.4s' }} />
                <circle cx="45" cy="238" r="2.5" fill="#FFFFFF" className="fluid-bubble-x" style={{ animationDelay: '0.8s' }} />
                <circle cx="45" cy="262" r="3" fill="#67E8F9" className="fluid-bubble-x" style={{ animationDelay: '1.2s' }} />
              </g>
            </g>
          )}
          {/* Suction Pipe End Flange */}
          <rect
            x="145"
            y="215"
            width="15"
            height="70"
            rx="4"
            fill="url(#darkGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Flange Bolts */}
          <circle cx="152" cy="225" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="152" cy="240" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="152" cy="260" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="152" cy="275" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
        </g>

        {/* Vertical Discharge Outlet Pipe (Top/Right of Volute) */}
        <g id="discharge-pipe">
          {/* Main vertical pipe cylinder */}
          <rect
            x="535"
            y="40"
            width="50"
            height="110"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Inner fluid visualization */}
          <rect
            x="543"
            y="40"
            width="34"
            height="110"
            fill="#E0F2FE"
            opacity="0.85"
          />
          {/* Water flow lines inside discharge pipe */}
          {style.animateFlow && (
            <g opacity={flowRate > 0.5 ? 0.95 : 0.4} className="transition-opacity duration-500">
              <line
                x1="560"
                y1="40"
                x2="560"
                y2="150"
                stroke={style.secondaryColor}
                strokeWidth="5"
                strokeLinecap="round"
                className="animated-flow"
                style={{ transform: 'rotate(180deg)', transformOrigin: '560px 95px' }}
              />
              <line
                x1="549"
                y1="40"
                x2="549"
                y2="150"
                stroke={style.highlightColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                className="animated-flow-fast"
                style={{ transform: 'rotate(180deg)', transformOrigin: '549px 95px' }}
              />
              <line
                x1="571"
                y1="40"
                x2="571"
                y2="150"
                stroke={style.secondaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animated-flow-fast"
                style={{ transform: 'rotate(180deg)', transformOrigin: '571px 95px', animationDelay: '0.3s' }}
              />
              {/* Dynamic bubble particles inside discharge pipe */}
              <g opacity={flowRate > 1 ? 0.85 : 0} className="transition-opacity duration-700">
                <circle cx="552" cy="40" r="3.5" fill="#FFFFFF" className="fluid-bubble-y" style={{ animationDelay: '0.2s' }} />
                <circle cx="566" cy="40" r="2.5" fill="#E0F2FE" className="fluid-bubble-y" style={{ animationDelay: '0.6s' }} />
                <circle cx="548" cy="40" r="3" fill="#FFFFFF" className="fluid-bubble-y" style={{ animationDelay: '1.0s' }} />
                <circle cx="560" cy="40" r="3.5" fill="#67E8F9" className="fluid-bubble-y" style={{ animationDelay: '1.4s' }} />
              </g>
            </g>
          )}
          {/* Pipe Flange (Top) */}
          <rect
            x="525"
            y="55"
            width="70"
            height="15"
            rx="4"
            fill="url(#darkGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Flange Bolts */}
          <circle cx="538" cy="62" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="553" cy="62" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="572" cy="62" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          <circle cx="587" cy="62" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
        </g>


        {/* =======================================================
            SECTION 2: MOUNTING BASE PLATE & ANCHORS
           ======================================================= */}
        <g id="mounting-base">
          {/* Base plate shadow */}
          <rect x="95" y="388" width="610" height="14" rx="7" fill="#000" opacity="0.12" />
          
          {/* Structural Base Plate */}
          <rect
            x="100"
            y="375"
            width="600"
            height="22"
            rx="5"
            fill="url(#darkGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Sleek Cyan Detail Line on Base */}
          <line
            x1="115"
            y1="382"
            x2="685"
            y2="382"
            stroke={style.secondaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Concrete / Dashboard Mounting Pad (Bottom Plate) */}
          <rect
            x="120"
            y="397"
            width="560"
            height="10"
            rx="2"
            fill="#64748B"
            opacity="0.3"
          />

          {/* FOUR MOUNTING BOLTS (Orthographic Side view spaced out) */}
          {[150, 280, 520, 650].map((boltX, idx) => (
            <g id={`bolt-${idx + 1}`} key={boltX}>
              {/* Bolt Washer */}
              <rect
                x={boltX - 12}
                y={371}
                width="24"
                height="4"
                rx="1"
                fill="url(#metalGrad)"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* Hex Head */}
              <path
                d={`M ${boltX - 8} 363 L ${boltX - 5} 359 L ${boltX + 5} 359 L ${boltX + 8} 363 L ${boltX + 8} 371 L ${boltX - 8} 371 Z`}
                fill="url(#metalGrad)"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
              />
              {/* Highlight thread */}
              <line x1={boltX} y1={359} x2={boltX} y2={371} stroke={strokeColor} strokeWidth={1} />
            </g>
          ))}
        </g>


        {/* =======================================================
            SECTION 3: ELECTRIC INDUCTION MOTOR (Vibrates when ON)
           ======================================================= */}
        <g id="electric-motor" className="vibrating-motor">
          {/* Motor Mounting Feet */}
          <g id="motor-feet">
            <path
              d="M 195 348 L 180 375 L 235 375 L 220 348 Z"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path
              d="M 335 348 L 320 375 L 375 375 L 360 348 Z"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </g>

          {/* Motor Main Cylindrical Body */}
          <rect
            x="190"
            y="155"
            width="170"
            height="193"
            rx="8"
            fill="url(#motorGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />

          {/* Motor Front / Left End bell */}
          <path
            d="M 190 162 C 160 162 160 341 190 341 Z"
            fill="url(#darkGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Ventilation Slots/Grille overlaying the Fan Cover (Left) */}
          <g id="fan-ventilation-slots" opacity="0.85">
            <rect x="181" y="190" width="5" height="32" rx="2.5" fill={strokeColor} />
            <rect x="175" y="232" width="5" height="36" rx="2.5" fill={strokeColor} />
            <rect x="181" y="278" width="5" height="32" rx="2.5" fill={strokeColor} />
            
            {/* Soft digital reflection edge */}
            <circle cx="145" cy="250" r="50" stroke={style.highlightColor} strokeWidth="1.5" strokeDasharray="6 12" fill="none" opacity="0.4" />
          </g>

          {/* COOLING FAN (Internal spinning visual inside the end cowl) */}
          <g id="cooling-fan" className="spinning-fan" opacity="0.85">
            {/* Fan Blades */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x2 = 145 + Math.cos(rad) * 45;
              const y2 = 250 + Math.sin(rad) * 45;
              return (
                <path
                  key={`fan-blade-${angle}`}
                  d={`M 145 250 Q ${145 + Math.cos(rad + 0.3) * 28} ${250 + Math.sin(rad + 0.3) * 28} ${x2} ${y2}`}
                  stroke={style.secondaryColor}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
              );
            })}
            <circle cx="145" cy="250" r="11" fill="url(#metalGrad)" stroke={strokeColor} strokeWidth={1.5} />
          </g>

          {/* COOLING FINS (Overlaying the motor body) */}
          {style.showFins && (
            <g id="cooling-fins">
              {[210, 230, 250, 270, 290, 310, 330, 350].map((finX, idx) => (
                <g key={`fin-${idx}`}>
                  {/* Highlight/shadow structure for flat 2.5D look */}
                  <rect
                    x={finX}
                    y="146"
                    width="6"
                    height="211"
                    rx="3"
                    fill={style.mainBodyColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                  {/* Subtle Light-Cyan/Blue Highlight on the fin face */}
                  <line
                    x1={finX + 2.5}
                    y1="151"
                    x2={finX + 2.5}
                    y2="352"
                    stroke={style.highlightColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </g>
              ))}
            </g>
          )}

          {/* Motor Junction Terminal Box (Top of Motor) */}
          <g id="junction-box">
            {/* Box Neck */}
            <rect
              x="240"
              y="140"
              width="60"
              height="15"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Box Main Body */}
            <rect
              x="230"
              y="110"
              width="80"
              height="32"
              rx="4"
              fill="url(#motorGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Highlight Border */}
            <rect
              x="234"
              y="114"
              width="72"
              height="24"
              rx="2"
              stroke={style.secondaryColor}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
            {/* Status LED Indicator */}
            <circle
              cx="250"
              cy="126"
              r="4"
              fill={isOn ? style.highlightColor : '#EF4444'}
              className="glowing-indicator"
            />
            <circle
              cx="250"
              cy="126"
              r="7"
              stroke={isOn ? style.secondaryColor : '#EF4444'}
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              className="glowing-indicator"
            />
            
            {/* Technical labeling representation (no real text) */}
            <rect x="264" y="122" width="16" height="3" rx="1.5" fill="url(#metalGrad)" />
            <rect x="264" y="128" width="10" height="3" rx="1.5" fill="url(#metalGrad)" />
          </g>

          {/* Motor Brand / Technical Metal Plate */}
          <rect
            x="245"
            y="230"
            width="45"
            height="25"
            rx="2"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          {/* Aesthetic plate details */}
          <line x1="250" y1="235" x2="285" y2="235" stroke={strokeColor} strokeWidth="1" />
          <line x1="250" y1="240" x2="278" y2="240" stroke={strokeColor} strokeWidth="1" />
          <line x1="250" y1="245" x2="282" y2="245" stroke={strokeColor} strokeWidth="1" />
          <circle cx="285" cy="248" r="1" fill={strokeColor} />
          <circle cx="249" cy="248" r="1" fill={strokeColor} />
        </g>


        {/* =======================================================
            SECTION 4: MECHANICAL SHAFT & COUPLING
           ======================================================= */}
        <g id="shaft-assembly">
          {/* Main Steel Drive Shaft (Rotates under coupling) */}
          <rect
            x="360"
            y="225"
            width="110"
            height="50"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Rotating specular highlights for realistic spin */}
          {rpm > 0 ? (
            <g>
              <line
                x1="360"
                y1="250"
                x2="470"
                y2="250"
                stroke="#FFFFFF"
                strokeWidth="3.0"
                className="spinning-shaft-line-1"
              />
              <line
                x1="360"
                y1="250"
                x2="470"
                y2="250"
                stroke="#FFFFFF"
                strokeWidth="2.0"
                className="spinning-shaft-line-2"
              />
            </g>
          ) : (
            <line
              x1="360"
              y1="250"
              x2="470"
              y2="250"
              stroke="#FFFFFF"
              strokeWidth="3.0"
              opacity="0.8"
            />
          )}

          {/* SHAFT COUPLING (In the middle of shaft) */}
          <g id="shaft-coupling">
            {/* Left Coupling Hub */}
            <rect
              x="395"
              y="221"
              width="15"
              height="58"
              rx="2"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Right Coupling Hub */}
            <rect
              x="414"
              y="221"
              width="15"
              height="58"
              rx="2"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Flange Join Seam */}
            <line
              x1="412"
              y1="218"
              x2="412"
              y2="282"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Coupling Bolts (Connecting the halves) with motion blur support when spinning fast */}
            {rpm < 300 ? (
              <g className="transition-opacity duration-300">
                <rect x="408" y="228" width="8" height="6" rx="1" fill="url(#metalGrad)" stroke={strokeColor} strokeWidth={1} />
                <rect x="408" y="266" width="8" height="6" rx="1" fill="url(#metalGrad)" stroke={strokeColor} strokeWidth={1} />
              </g>
            ) : (
              <g opacity="0.8" className="transition-opacity duration-300">
                {/* Spinning bolt motion blur streaks */}
                <line x1="398" y1="231" x2="426" y2="231" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" className="spinning-coupling" />
                <line x1="398" y1="269" x2="426" y2="269" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" className="spinning-coupling" />
              </g>
            )}

            {/* Glowing spinning element when active */}
            <line
              x1="412"
              y1="223"
              x2="412"
              y2="277"
              stroke={style.secondaryColor}
              strokeWidth="2.5"
              className="spinning-coupling"
            />
          </g>

          {/* High-Fidelity Safety Coupling Guard (Cage) - Overlaying the coupling area */}
          <g id="coupling-guard" opacity="0.95">
            {/* Curved semi-transparent safety cage cover */}
            <rect
              x="386"
              y="214"
              width="54"
              height="72"
              rx="6"
              fill="url(#metalGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity="0.25"
            />
            {/* Horizontal safety grill/vent slots */}
            <line x1="392" y1="222" x2="434" y2="222" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <line x1="392" y1="234" x2="434" y2="234" stroke={style.secondaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            <line x1="392" y1="246" x2="434" y2="246" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <line x1="392" y1="258" x2="434" y2="258" stroke={style.secondaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            <line x1="392" y1="270" x2="434" y2="270" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            <line x1="392" y1="282" x2="434" y2="282" stroke={style.secondaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.85" />

            {/* Robust cage support legs bolted directly to baseplate (realistic industrial design) */}
            <line x1="390" y1="286" x2="390" y2="375" stroke={strokeColor} strokeWidth="2" />
            <line x1="436" y1="286" x2="436" y2="375" stroke={strokeColor} strokeWidth="2" />
            
            {/* Solid mounting brackets at baseplate connection */}
            <rect x="384" y="368" width="12" height="7" rx="1" fill="url(#darkGrad)" stroke={strokeColor} strokeWidth={1} />
            <rect x="430" y="368" width="12" height="7" rx="1" fill="url(#darkGrad)" stroke={strokeColor} strokeWidth={1} />
            <circle cx="390" cy="371" r="1.5" fill={style.metallicColor} />
            <circle cx="436" cy="371" r="1.5" fill={style.metallicColor} />
          </g>
        </g>


        {/* =======================================================
            SECTION 5: CENTRIFUGAL PUMP CASING (VOLUTE)
           ======================================================= */}
        <g id="pump-assembly" className="vibrating-motor">
          {/* Pump Support Foot */}
          <path
            d="M 520 338 L 490 375 L 610 375 L 580 338 Z"
            fill="url(#darkGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Volute Spiral Outer Backing Casing */}
          <path
            d="M 465 250 C 465 170 520 150 560 150 L 560 350 C 510 350 465 330 465 250 Z"
            fill="url(#motorGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />

          {/* Centrifugal Volute Main Round Body */}
          <circle
            cx="560"
            cy="250"
            r="88"
            fill="url(#voluteGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />

          {/* Beautiful concentric decorative/structural ribbing on the pump face */}
          <circle
            cx="560"
            cy="250"
            r="66"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.85"
          />
          <circle
            cx="560"
            cy="250"
            r="44"
            stroke={style.secondaryColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity="0.9"
          />
          {/* Ambient inner pressure highlights */}
          {rpm > 200 && (
            <circle
              cx="560"
              cy="250"
              r="44"
              stroke={style.highlightColor}
              strokeWidth="5"
              fill="none"
              opacity="0.3"
              className="glowing-indicator"
            />
          )}

          {/* Pulsing Kinetic Fluid Rings (Simulating centrifugal force/pressure build) */}
          {rpm > 200 && (
            <g opacity="0.5">
              <circle
                cx="560"
                cy="250"
                r="78"
                stroke={style.secondaryColor}
                strokeWidth="2"
                fill="none"
                className="pulsing-fluid-ring"
              />
              <circle
                cx="560"
                cy="250"
                r="78"
                stroke={style.highlightColor}
                strokeWidth="1.5"
                fill="none"
                className="pulsing-fluid-ring"
                style={{ animationDelay: '0.7s' }}
              />
            </g>
          )}

          {/* Spinning Impeller Assembly */}
          <g className="spinning-impeller" opacity="0.95">
            {/* Impeller Backing Disk Rim */}
            <circle cx="560" cy="250" r="76" stroke={strokeColor} strokeWidth="1" fill="none" opacity="0.25" />
            
            {/* 6 High-Fidelity Curved Impeller Vanes */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <g key={`vane-group-${angle}`}>
                  <path
                    d={`M 560 250 Q ${560 + Math.cos(rad + 0.35) * 42} ${250 + Math.sin(rad + 0.35) * 42} ${560 + Math.cos(rad + 0.12) * 75} ${250 + Math.sin(rad + 0.12) * 75}`}
                    stroke={style.secondaryColor}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Fluid particle sliding along the vane */}
                  <circle
                    cx={560 + Math.cos(rad + 0.22) * 55}
                    cy={250 + Math.sin(rad + 0.22) * 55}
                    r="2.5"
                    fill={style.highlightColor}
                    opacity="0.8"
                  />
                </g>
              );
            })}
          </g>

          {/* Curved spiral casing sweep path for dynamic flow visual */}
          <path
            d="M 500 210 A 66 66 0 0 1 615 210"
            stroke={style.highlightColor}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />

          {/* Central Suction Nozzle / Impeller Cap */}
          <circle
            cx="560"
            cy="250"
            r="24"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Bolts around Impeller Housing cap */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const bx = 560 + Math.cos(rad) * 16;
            const by = 250 + Math.sin(rad) * 16;
            return (
              <circle
                key={angle}
                cx={bx}
                cy={by}
                r="2.5"
                fill="url(#darkGrad)"
                stroke={strokeColor}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Discharge Outlet Tangent Nozzle (Connecting Volute to vertical pipe) */}
          <path
            d="M 535 170 L 535 150 L 585 150 L 585 178 Z"
            fill="url(#motorGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          {/* Outlet Nozzle Detail Line */}
          <line
            x1="535"
            y1="162"
            x2="585"
            y2="162"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />

          {/* Casing Drainage Plug (Bottom) */}
          <g id="drain-plug">
            <rect
              x="552"
              y="336"
              width="16"
              height="6"
              rx="1"
              fill="url(#metalGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x="555"
              y="342"
              width="10"
              height="8"
              rx="1"
              fill="url(#metalGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </g>

          {/* Pump Technical Spec Tag Plate */}
          <rect
            x="585"
            y="280"
            width="32"
            height="18"
            rx="1"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={1}
          />
          <line x1="588" y1="285" x2="614" y2="285" stroke={strokeColor} strokeWidth="0.8" />
          <line x1="588" y1="289" x2="610" y2="289" stroke={strokeColor} strokeWidth="0.8" />
          <line x1="588" y1="293" x2="612" y2="293" stroke={strokeColor} strokeWidth="0.8" />
        </g>


        {/* =======================================================
            SECTION 6: PRESSURE CONTROLS & FLANGES (FOREGROUND LAYER)
           ======================================================= */}
        {style.showFlanges && (
          <g id="flanges-and-bolts">
            {/* Pump Inlet Flange Plate (Right Side Connection) */}
            <rect
              x="455"
              y="215"
              width="15"
              height="70"
              rx="4"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Flange Bolts */}
            <circle cx="462" cy="225" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="462" cy="240" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="462" cy="260" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="462" cy="275" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />

            {/* Suction Flange Gasket Seam */}
            <line x1="160" y1="220" x2="160" y2="280" stroke={style.highlightColor} strokeWidth="2" opacity="0.8" />
            
            {/* Pump Outlet Flange Plate */}
            <rect
              x="525"
              y="142"
              width="70"
              height="15"
              rx="4"
              fill="url(#darkGrad)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Flange Bolts */}
            <circle cx="538" cy="149" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="553" cy="149" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="572" cy="149" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
            <circle cx="587" cy="149" r="4" fill={style.metallicColor} stroke={strokeColor} strokeWidth={1} />
          </g>
        )}

        {/* PRESSURE GAUGE (Attached to discharge pipe, looks extremely professional) */}
        <g id="pressure-gauge" transform="translate(610, 85)" className="transition-all duration-300">
          {/* Connecting Pipe */}
          <rect
            x="-25"
            y="12"
            width="15"
            height="8"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Dial Bracket */}
          <path
            d="M -15 10 L -15 20 M -15 15 L 0 15"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Dial Housing */}
          <circle
            cx="15"
            cy="15"
            r="28"
            fill="url(#metalGrad)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Face plate */}
          <circle
            cx="15"
            cy="15"
            r="22"
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth={1}
          />
          {/* Gauge Ticks */}
          {[ -135, -90, -45, 0, 45, 90, 135 ].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 15 + Math.cos(rad) * 16;
            const y1 = 15 + Math.sin(rad) * 16;
            const x2 = 15 + Math.cos(rad) * 21;
            const y2 = 15 + Math.sin(rad) * 21;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={1.5}
              />
            );
          })}
          {/* Gauge warning zone (Red arc) */}
          <path
            d="M 30 2 C 34 6 36 12 36 17"
            stroke="#EF4444"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Needle pivot */}
          <circle cx="15" cy="15" r="3.5" fill={strokeColor} />
          {/* Needle (Rotates based on telemetry pressure) */}
          {(() => {
            // map pressure (0 to 10 bar) to angle (-135 to +135 deg)
            const pressureVal = telemetry.pressure;
            const angle = -135 + (pressureVal / 10) * 270;
            const rad = (angle * Math.PI) / 180;
            const nx = 15 + Math.cos(rad) * 19;
            const ny = 15 + Math.sin(rad) * 19;
            return (
              <line
                x1="15"
                y1="15"
                x2={nx}
                y2={ny}
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })()}
        </g>
        </g>
      </svg>
    </div>
  );
};
