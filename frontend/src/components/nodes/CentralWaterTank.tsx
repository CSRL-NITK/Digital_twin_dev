/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';

interface WaterTankProps {
  fillPercentage: number; // 0 to 100
  isFilling: boolean;
  isDraining: boolean;
  waveSpeed: 'slow' | 'medium' | 'fast';
  waveHeight: 'calm' | 'normal' | 'active';
  temperature: number;
  showInletPipe?: boolean;
  showInletPipe2?: boolean;
  showInletPipe3?: boolean;
  showInletPipe4?: boolean;
  showOutletPipe?: boolean;
  showOutletPipe2?: boolean;
  showGauge?: boolean;
  showOverflowPipe?: boolean;
  isFillingActive?: boolean;
  isFilling2Active?: boolean;
  isFilling3Active?: boolean;
  isFilling4Active?: boolean;
  isDrainingActive?: boolean;
  isDraining2Active?: boolean;
  waveHeightCalm?: number;
  waveHeightNormal?: number;
  waveHeightActive?: number;
  tempThreshold?: number;
  tempMaxThreshold?: number;
}

const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};

export const CentralWaterTank: React.FC<WaterTankProps> = ({
  fillPercentage,
  isFilling,
  isDraining,
  waveSpeed,
  waveHeight,
  temperature,
  showInletPipe = true,
  showInletPipe2 = true,
  showInletPipe3 = true,
  showInletPipe4 = true,
  showOutletPipe = true,
  showOutletPipe2 = true,
  showGauge = true,
  showOverflowPipe = true,
  isFillingActive = true,
  isFilling2Active = true,
  isFilling3Active = true,
  isFilling4Active = true,
  isDrainingActive = true,
  isDraining2Active = true,
  waveHeightCalm = 4.5,
  waveHeightNormal = 11,
  waveHeightActive = 17,
  tempThreshold = 55.0,
  tempMaxThreshold = 75.0,
}) => {
  // Generate a unique ID suffix to avoid SVG ID collisions on dashboards with multiple tank instances
  const rawId = React.useId();
  const idSuffix = useMemo(() => rawId.replace(/:/g, ''), [rawId]);

  // Constrain fill percentage
  const clampedFill = Math.max(0, Math.min(100, fillPercentage));

  // Computed individual flow states
  const isFilling1Flowing = isFilling && isFillingActive;
  const isFilling2Flowing = isFilling && isFilling2Active;
  const isFilling3Flowing = isFilling && isFilling3Active;
  const isFilling4Flowing = isFilling && isFilling4Active;
  const isDraining1Flowing = isDraining && isDraining2Active; // Outlet 2 (Right side)
  const isDraining2Flowing = isDraining && isDrainingActive;  // Outlet 1 (Left side)

  // TANK GEOMETRY CONSTANTS
  const TANK_WIDTH = 390;          // Total outer width
  const TANK_HEIGHT = 320;         // Cylinder height

  // FLUID DYNAMICS & THERMAL SETTINGS
  // Wave amplitudes (px) for different waveHeight states
  const WAVE_HEIGHT_CALM = waveHeightCalm;
  const WAVE_HEIGHT_NORMAL = waveHeightNormal;
  const WAVE_HEIGHT_ACTIVE = waveHeightActive;

    // Water Color & Thermal Temperature Thresholds
  const TEMP_THRESHOLD = tempThreshold;            // Temperature (°C) where water starts changing to warm color & boiling starts
  const TEMP_MAX_THRESHOLD = tempMaxThreshold;        // Temperature (°C) where water is completely warm & boiling is at max

  // Wave speed durations (seconds)
  const WAVE_SPEED_SLOW = { front: '13s', mid: '10s', back: '16s' };
  const WAVE_SPEED_MEDIUM = { front: '7.5s', mid: '5.5s', back: '9.5s' };
  const WAVE_SPEED_FAST = { front: '3.8s', mid: '2.8s', back: '5s' };



  // Derived layout and positioning coordinates
  const TANK_CENTER_X = 200;       // Center of the tank in the SVG
  const TANK_CYLINDER_Y1 = 300 - TANK_HEIGHT / 2; // Top of cylindrical body
  const TANK_CYLINDER_Y2 = 300 + TANK_HEIGHT / 2; // Bottom of cylindrical body

  const TANK_OUTER_RADIUS_X = TANK_WIDTH / 2;
  const TANK_OUTER_RADIUS_Y = 0; // Square tank top/bottom are flat

  const TANK_INNER_RADIUS_X = TANK_OUTER_RADIUS_X - 4; // Accounting for 4px wall thickness

  const INLET_CENTER_X = TANK_CENTER_X - TANK_OUTER_RADIUS_X * (40 / 90); // X-coord of the inlet stream
  const INLET2_CENTER_X = TANK_CENTER_X + TANK_OUTER_RADIUS_X * (40 / 90); // X-coord of second inlet stream

  // Dynamic viewBox margins to prevent any component clipping on the sides
  const viewBoxMargin = TANK_OUTER_RADIUS_X + 90;
  const viewBoxX = TANK_CENTER_X - viewBoxMargin;
  const viewBoxWidth = viewBoxMargin * 2;
  const inletPipeStartX = viewBoxX + 63;
  const inlet2PipeStartX = viewBoxX + viewBoxWidth - 63;

  // Inlet 3 & 4: vertical top-entry pipes positioned between existing inlets
  const INLET3_CENTER_X = TANK_CENTER_X - TANK_OUTER_RADIUS_X * (15 / 90);
  const INLET4_CENTER_X = TANK_CENTER_X + TANK_OUTER_RADIUS_X * (15 / 90);
  const inlet3PipeStartY = 0; // Top of SVG viewBox
  const inlet4PipeStartY = 0; // Top of SVG viewBox
  const INLET3_NOZZLE_Y = TANK_CYLINDER_Y1 + 33; // Same nozzle depth as existing inlets
  const INLET4_NOZZLE_Y = TANK_CYLINDER_Y1 + 33;

  const outerLeftX = TANK_CENTER_X - TANK_OUTER_RADIUS_X;
  const outerRightX = TANK_CENTER_X + TANK_OUTER_RADIUS_X;
  const innerLeftX = TANK_CENTER_X - TANK_INNER_RADIUS_X;
  const innerRightX = TANK_CENTER_X + TANK_INNER_RADIUS_X;

  // Water volume height limits:
  const Y_TOP = TANK_CYLINDER_Y1; // Full level
  const Y_BOTTOM = TANK_CYLINDER_Y2; // Empty level
  const Y_SPAN = Y_BOTTOM - Y_TOP;

  // Current water level Y-coordinate
  const Y_water = Y_BOTTOM - Y_SPAN * (clampedFill / 100);

  // Dynamic path shapes
  const innerPathD = `M ${innerLeftX},${TANK_CYLINDER_Y1} L ${innerRightX},${TANK_CYLINDER_Y1} L ${innerRightX},${TANK_CYLINDER_Y2} L ${innerLeftX},${TANK_CYLINDER_Y2} Z`;
  const outerPathD = `M ${outerLeftX},${TANK_CYLINDER_Y1} L ${outerRightX},${TANK_CYLINDER_Y1} L ${outerRightX},${TANK_CYLINDER_Y2} L ${outerLeftX},${TANK_CYLINDER_Y2} Z`;
  const openOuterPathStrokeD = `M ${outerLeftX},${TANK_CYLINDER_Y1} L ${outerLeftX},${TANK_CYLINDER_Y2} L ${outerRightX},${TANK_CYLINDER_Y2} L ${outerRightX},${TANK_CYLINDER_Y1}`;

  // Dynamic collar bolt rivets offsets & calculations
  const collarBoltRatios = [-0.8, -0.533, -0.267, 0, 0.267, 0.533, 0.8];
  const topCollarBolts = collarBoltRatios.map(ratio => {
    const dx = ratio * TANK_OUTER_RADIUS_X;
    const dy = (TANK_OUTER_RADIUS_Y * (7.5 / 40)) * Math.sqrt(Math.max(0, 1 - ratio * ratio));
    return { cx: TANK_CENTER_X + dx, cy: TANK_CYLINDER_Y1 + dy };
  });
  const bottomCollarBolts = collarBoltRatios.map(ratio => {
    const dx = ratio * TANK_OUTER_RADIUS_X;
    const dy = (TANK_OUTER_RADIUS_Y * (7.5 / 40)) * Math.sqrt(Math.max(0, 1 - ratio * ratio));
    return { cx: TANK_CENTER_X + dx, cy: TANK_CYLINDER_Y2 + dy };
  });

  // Rib positions
  const ribY1 = TANK_CYLINDER_Y1 + TANK_HEIGHT * 0.1875;
  const ribY2 = TANK_CYLINDER_Y1 + TANK_HEIGHT * 0.46875;
  const ribY3 = TANK_CYLINDER_Y1 + TANK_HEIGHT * 0.75;



  // Outlet pump pipe coordinates
  const PUMP_PIPE_X = outerRightX - 32;
  const pumpPipePathD = `M ${PUMP_PIPE_X},${TANK_CYLINDER_Y2 - 10} L ${PUMP_PIPE_X},124 A 14,14 0 0,1 ${PUMP_PIPE_X + 14},110 L ${inlet2PipeStartX},110`;
  
  const PUMP2_PIPE_X = outerLeftX + 32;
  const pump2PipePathD = `M ${PUMP2_PIPE_X},${TANK_CYLINDER_Y2 - 10} L ${PUMP2_PIPE_X},124 A 14,14 0 0,0 ${PUMP2_PIPE_X - 14},110 L ${inletPipeStartX},110`;

  // Nozzle Y coordinates
  const INLET_NOZZLE_Y = TANK_CYLINDER_Y1 + 33;

  // Pressure gauge center Y-coordinate
  const GAUGE_CENTER_Y = (TANK_CYLINDER_Y1 + TANK_CYLINDER_Y2) / 2;

  // Wave heights & durations
  const waveParams = useMemo(() => {
    let amp = WAVE_HEIGHT_NORMAL;
    if (waveHeight === 'calm') amp = WAVE_HEIGHT_CALM;
    if (waveHeight === 'active') amp = WAVE_HEIGHT_ACTIVE;

    let frontDuration = WAVE_SPEED_MEDIUM.front;
    let midDuration = WAVE_SPEED_MEDIUM.mid;
    let backDuration = WAVE_SPEED_MEDIUM.back;

    if (waveSpeed === 'slow') {
      frontDuration = WAVE_SPEED_SLOW.front;
      midDuration = WAVE_SPEED_SLOW.mid;
      backDuration = WAVE_SPEED_SLOW.back;
    } else if (waveSpeed === 'fast') {
      frontDuration = WAVE_SPEED_FAST.front;
      midDuration = WAVE_SPEED_FAST.mid;
      backDuration = WAVE_SPEED_FAST.back;
    }

    return { amp, frontDuration, midDuration, backDuration };
  }, [waveSpeed, waveHeight]);

  const { amp, frontDuration, midDuration, backDuration } = waveParams;

  // Seamless wave paths
  // Front wave: wavelength 200px (repeated 4x to allow horizontal sliding animation)
  const frontWaveSegment = `q 50,-${amp} 100,0 q 50,${amp} 100,0 q 50,-${amp} 100,0 q 50,${amp} 100,0 q 50,-${amp} 100,0 q 50,${amp} 100,0 q 50,-${amp} 100,0 q 50,${amp} 100,0`;
  const frontWaveD = `M 0,0 ${frontWaveSegment} L 800,600 L 0,600 Z`;

  // Middle wave: wavelength 160px (repeated 5x)
  const ampM = amp * 0.75;
  const midWaveSegment = `q 40,-${ampM} 80,0 q 40,${ampM} 80,0 q 40,-${ampM} 80,0 q 40,${ampM} 80,0 q 40,-${ampM} 80,0 q 40,${ampM} 80,0 q 40,-${ampM} 80,0 q 40,${ampM} 80,0 q 40,-${ampM} 80,0 q 40,${ampM} 80,0`;
  const midWaveD = `M 0,0 ${midWaveSegment} L 800,600 L 0,600 Z`;

  // Back wave: wavelength 240px (repeated 3.5x)
  const ampB = amp * 0.55;
  const backWaveSegment = `q 60,-${ampB} 120,0 q 60,${ampB} 120,0 q 60,-${ampB} 120,0 q 60,${ampB} 120,0 q 60,-${ampB} 120,0 q 60,${ampB} 120,0 q 60,-${ampB} 120,0 q 60,${ampB} 120,0`;
  const backWaveD = `M 0,0 ${backWaveSegment} L 840,600 L 0,600 Z`;

  // Interpolated water colors based on temperature thresholds
  const tempFactor = Math.max(0, Math.min(1, (temperature - TEMP_THRESHOLD) / (TEMP_MAX_THRESHOLD - TEMP_THRESHOLD)));

  const waterColors = useMemo(() => {
    return {
      frontTop: interpolateColor('#22D3EE', '#FB7185', tempFactor),
      frontBottom: interpolateColor('#0D9488', '#991B1B', tempFactor),
      midTop: interpolateColor('#67E8F9', '#F43F5E', tempFactor),
      midBottom: interpolateColor('#0F766E', '#BE123C', tempFactor),
      backTop: interpolateColor('#A5F3FC', '#FDA4AF', tempFactor),
      backBottom: interpolateColor('#115E59', '#881337', tempFactor),
      streamStart: interpolateColor('#22D3EE', '#FB7185', tempFactor),
      streamEnd: interpolateColor('#0D9488', '#991B1B', tempFactor),
    };
  }, [tempFactor]);

  // Thermal intensity is fully unified with color thresholds (0 to 1)
  const thermalIntensity = tempFactor;
  
  // Pressure dial angle (-120deg to +120deg matches 0% to 100%)
  const gaugeAngle = (clampedFill / 100) * 240 - 120;

  const gaugeStatus = useMemo(() => {
    if (clampedFill < 15 || clampedFill > 85) {
      return {
        color: '#EF4444',
        label: 'ALARM',
        glowClass: 'animate-pulse',
        bgGlow: 'rgba(239, 68, 68, 0.15)',
      };
    } else if (clampedFill < 30 || clampedFill > 70) {
      return {
        color: '#F59E0B',
        label: 'WARN',
        glowClass: '',
        bgGlow: 'rgba(245, 158, 11, 0.1)',
      };
    } else {
      return {
        color: '#10B981',
        label: 'OK',
        glowClass: '',
        bgGlow: 'rgba(16, 185, 129, 0.05)',
      };
    }
  }, [clampedFill]);

  return (
    <div
      id="tank-container"
      className="relative w-full h-full select-none filter drop-shadow-2xl"
    >
      <svg
        id="water-tank-svg"
        viewBox={`${viewBoxX} 0 ${viewBoxWidth} 600`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <style>
          {`
            @keyframes waveMoveFront {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-200px, 0, 0); }
            }
            @keyframes waveMoveMiddle {
              0% { transform: translate3d(-160px, 0, 0); }
              100% { transform: translate3d(0px, 0, 0); }
            }
            @keyframes waveMoveBack {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-240px, 0, 0); }
            }
            @keyframes streamFlow {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -40; }
            }
            @keyframes ripplePulseOuter {
              0% { rx: 4px; ry: 1.5px; opacity: 1; stroke-width: 1.5; }
              100% { rx: 32px; ry: 9px; opacity: 0; stroke-width: 0.5; }
            }
            @keyframes ripplePulseInner {
              0% { rx: 1px; ry: 0.5px; opacity: 0.9; }
              100% { rx: 20px; ry: 6px; opacity: 0; }
            }
            @keyframes bubbleRiseOne {
              0% { transform: translate(${TANK_CENTER_X - 55 * (TANK_OUTER_RADIUS_X / 90)}px, ${TANK_CYLINDER_Y2 - 40}px) scale(0.5); opacity: 0; }
              10% { opacity: 0.8; }
              85% { opacity: 0.8; }
              100% { transform: translate(${TANK_CENTER_X - 48 * (TANK_OUTER_RADIUS_X / 90)}px, 0px) scale(1.1); opacity: 0; }
            }
            @keyframes bubbleRiseTwo {
              0% { transform: translate(${TANK_CENTER_X + 25 * (TANK_OUTER_RADIUS_X / 90)}px, ${TANK_CYLINDER_Y2 - 20}px) scale(0.4); opacity: 0; }
              15% { opacity: 0.7; }
              80% { opacity: 0.7; }
              100% { transform: translate(${TANK_CENTER_X + 10 * (TANK_OUTER_RADIUS_X / 90)}px, 15px) scale(1.3); opacity: 0; }
            }
            @keyframes bubbleRiseThree {
              0% { transform: translate(${TANK_CENTER_X - 15 * (TANK_OUTER_RADIUS_X / 90)}px, ${TANK_CYLINDER_Y2 - 70}px) scale(0.6); opacity: 0; }
              8% { opacity: 0.85; }
              90% { opacity: 0.85; }
              100% { transform: translate(${TANK_CENTER_X - 8 * (TANK_OUTER_RADIUS_X / 90)}px, -10px) scale(1.0); opacity: 0; }
            }
            @keyframes bubbleRiseSlow {
              0% { transform: translate(${TANK_CENTER_X - 70 * (TANK_OUTER_RADIUS_X / 90)}px, ${TANK_CYLINDER_Y2 - 10}px) scale(0.3); opacity: 0; }
              20% { opacity: 0.5; }
              80% { opacity: 0.5; }
              100% { transform: translate(${TANK_CENTER_X - 55 * (TANK_OUTER_RADIUS_X / 90)}px, 30px) scale(0.9); opacity: 0; }
            }
            @keyframes bubbleRiseFast {
              0% { transform: translate(${TANK_CENTER_X + 45 * (TANK_OUTER_RADIUS_X / 90)}px, ${TANK_CYLINDER_Y2}px) scale(0.4); opacity: 0; }
              10% { opacity: 0.9; }
              90% { opacity: 0.9; }
              100% { transform: translate(${TANK_CENTER_X + 35 * (TANK_OUTER_RADIUS_X / 90)}px, -5px) scale(1.2); opacity: 0; }
            }
            @keyframes valveRotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes thermalPulsate {
              0% { opacity: 0.35; }
              50% { opacity: 0.65; }
              100% { opacity: 0.35; }
            }
            .wave-front {
              animation: waveMoveFront ${frontDuration} linear infinite;
            }
            .wave-middle {
              animation: waveMoveMiddle ${midDuration} linear infinite;
            }
            .wave-back {
              animation: waveMoveBack ${backDuration} linear infinite;
            }
            .fill-stream-flow {
              animation: streamFlow 0.8s linear infinite;
            }
            .drain-pipe-flow {
              animation: streamFlow 0.55s linear infinite;
            }
            .bubble-1 {
              animation: bubbleRiseOne 3.8s ease-in infinite;
            }
            .bubble-2 {
              animation: bubbleRiseTwo 4.5s ease-in infinite;
            }
            .bubble-3 {
              animation: bubbleRiseThree 3.2s ease-in infinite;
            }
            .bubble-slow {
              animation: bubbleRiseSlow 6.2s ease-in infinite;
            }
            .bubble-fast {
              animation: bubbleRiseFast 2.7s ease-in infinite;
            }
            .valve-wheel-active {
              animation: valveRotate 2.5s linear infinite;
              transform-origin: ${outerRightX + 32}px ${TANK_CYLINDER_Y2 - 46}px;
            }
            .sensor-rotor-active-1 {
              animation: valveRotate 0.8s linear infinite;
              transform-origin: ${INLET_CENTER_X}px 145.5px;
            }
            .sensor-rotor-active-2 {
              animation: valveRotate 0.8s linear infinite;
              transform-origin: ${INLET2_CENTER_X}px 145.5px;
            }
            .sensor-rotor-active-3 {
              animation: valveRotate 0.8s linear infinite;
              transform-origin: ${INLET3_CENTER_X}px 145.5px;
            }
            .sensor-rotor-active-4 {
              animation: valveRotate 0.8s linear infinite;
              transform-origin: ${INLET4_CENTER_X}px 145.5px;
            }
            @keyframes splashDropLeft {
              0% { transform: translate(0px, 0px) scale(0.4); opacity: 0; }
              20% { opacity: 0.9; }
              100% { transform: translate(-14px, -24px) scale(1.1); opacity: 0; }
            }
            @keyframes splashDropRight {
              0% { transform: translate(0px, 0px) scale(0.4); opacity: 0; }
              20% { opacity: 0.9; }
              100% { transform: translate(14px, -20px) scale(1.0); opacity: 0; }
            }
            @keyframes splashDropHigh {
              0% { transform: translate(0px, 0px) scale(0.4); opacity: 0; }
              15% { opacity: 1; }
              100% { transform: translate(-3px, -42px) scale(0.8); opacity: 0; }
            }
            @keyframes splashRipple {
              0% { rx: 1px; ry: 0.3px; opacity: 1; stroke-width: 1.2; }
              100% { rx: 16px; ry: 5px; opacity: 0; stroke-width: 0.3; }
            }
            .splash-left {
              animation: splashDropLeft 0.7s ease-out infinite;
            }
            .splash-right {
              animation: splashDropRight 0.8s ease-out infinite;
              animation-delay: 0.15s;
            }
            .splash-high {
              animation: splashDropHigh 0.65s ease-out infinite;
              animation-delay: 0.3s;
            }
            .splash-ripple {
              animation: splashRipple 0.9s ease-out infinite;
            }
            .thermal-glow-convection {
              animation: thermalPulsate 3s ease-in-out infinite;
            }
            @keyframes streamFlowFast {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -60; }
            }
            @keyframes streamFlowSuperFast {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -80; }
            }
            @keyframes shimmerPulse {
              0% { opacity: 0.35; }
              50% { opacity: 0.75; }
              100% { opacity: 0.35; }
            }
            @keyframes nozzleSpray {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.08); opacity: 0.95; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
            @keyframes inflowSplashL {
              0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
              15% { opacity: 1; }
              85% { opacity: 0.8; }
              100% { transform: translate(-18px, -28px) scale(1.2); opacity: 0; }
            }
            @keyframes inflowSplashR {
              0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
              15% { opacity: 1; }
              85% { opacity: 0.8; }
              100% { transform: translate(18px, -24px) scale(1.1); opacity: 0; }
            }
            @keyframes inflowSplashH {
              0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 0.7; }
              100% { transform: translate(-2px, -46px) scale(0.9); opacity: 0; }
            }
            .fill-stream-fast {
              animation: streamFlowFast 0.45s linear infinite;
            }
            .fill-stream-super {
              animation: streamFlowSuperFast 0.3s linear infinite;
            }
            .shimmer-pulse {
              animation: shimmerPulse 1.2s ease-in-out infinite;
            }
            .nozzle-spray {
              animation: nozzleSpray 0.6s ease-in-out infinite;
              transform-origin: ${INLET_CENTER_X}px ${INLET_NOZZLE_Y}px;
            }
            .inflow-splash-l {
              animation: inflowSplashL 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            }
            .inflow-splash-r {
              animation: inflowSplashR 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            }
            .inflow-splash-h {
              animation: inflowSplashH 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
            }

            @keyframes waterDropFall1 {
              0% { transform: translateY(0px) translateX(-4px) scale(0.8); opacity: 0; }
              15% { opacity: 0.95; }
              90% { opacity: 0.95; }
              100% { transform: translateY(var(--stream-height, 150px)) translateX(-1px) scale(0.4); opacity: 0; }
            }
            @keyframes waterDropFall2 {
              0% { transform: translateY(0px) translateX(4px) scale(0.7); opacity: 0; }
              15% { opacity: 0.9; }
              90% { opacity: 0.9; }
              100% { transform: translateY(var(--stream-height, 150px)) translateX(2px) scale(0.3); opacity: 0; }
            }
            @keyframes waterDropFall3 {
              0% { transform: translateY(0px) translateX(-1px) scale(0.9); opacity: 0; }
              10% { opacity: 0.95; }
              90% { opacity: 0.95; }
              100% { transform: translateY(var(--stream-height, 150px)) translateX(0px) scale(0.5); opacity: 0; }
            }
            .water-drop-1 {
              animation: waterDropFall1 0.7s linear infinite;
            }
            .water-drop-2 {
              animation: waterDropFall2 0.5s linear infinite;
              animation-delay: 0.15s;
            }
            .water-drop-3 {
              animation: waterDropFall3 0.6s linear infinite;
              animation-delay: 0.3s;
            }
            .water-drop-4 {
              animation: waterDropFall1 0.8s linear infinite;
              animation-delay: 0.45s;
            }
          `}
        </style>

        {/* SVG Defs & Gradients */}
        <defs>
          {/* Brass Valve Gradient */}
          <linearGradient id={`brassGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="30%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Inner Tank Clip Path */}
          <clipPath id={`tank-inner-${idSuffix}`}>
            <path d={innerPathD} />
          </clipPath>

          {/* Water level clip path */}
          <clipPath id={`water-level-clip-${idSuffix}`}>
            <rect x={outerLeftX - 10} y={Y_water} width={TANK_WIDTH + 20} height={Y_BOTTOM - Y_water + 20} />
          </clipPath>

          {/* Glass Shell Gradient */}
          <linearGradient id={`glassGradient-${idSuffix}`} x1={outerLeftX} y1={TANK_CYLINDER_Y1} x2={outerRightX} y2={TANK_CYLINDER_Y2} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.18" />
            <stop offset="15%" stopColor="#0F766E" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="85%" stopColor="#0F766E" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.22" />
          </linearGradient>

          {/* Diagonal Glare Gradient */}
          <linearGradient id={`diagonalGlareGradient-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Metal Parts Gradient (Flanges, Legs, Hatch) */}
          <linearGradient id={`metalGradient-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="75%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Metal Vertical Gradient (Pipes) */}
          <linearGradient id={`metalVerticalGradient-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Black Metal Gradient for Pump/Motor */}
          <linearGradient id={`blackMetalGradient-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#090D16" />
            <stop offset="30%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="70%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>

          {/* Tank Outline Gradient */}
          <linearGradient id={`tankOutlineGradient-${idSuffix}`} x1={outerLeftX} y1={Y_TOP} x2={outerRightX} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="20%" stopColor="#0F766E" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="80%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Water Layers Gradients */}
          <linearGradient id={`waterGradientFront-${idSuffix}`} x1={TANK_CENTER_X} y1={Y_TOP} x2={TANK_CENTER_X} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-front-top, ${waterColors.frontTop})`} stopOpacity="0.92" />
            <stop offset="100%" stopColor={`var(--tank-water-front-bottom, ${waterColors.frontBottom})`} stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id={`waterGradientMiddle-${idSuffix}`} x1={TANK_CENTER_X} y1={Y_TOP} x2={TANK_CENTER_X} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-mid-top, ${waterColors.midTop})`} stopOpacity="0.72" />
            <stop offset="100%" stopColor={`var(--tank-water-mid-bottom, ${waterColors.midBottom})`} stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id={`waterGradientBack-${idSuffix}`} x1={TANK_CENTER_X} y1={Y_TOP} x2={TANK_CENTER_X} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-back-top, ${waterColors.backTop})`} stopOpacity="0.52" />
            <stop offset="100%" stopColor={`var(--tank-water-back-bottom, ${waterColors.backBottom})`} stopOpacity="0.68" />
          </linearGradient>

          {/* Thermal Convection Gradient */}
          <linearGradient 
            id={`thermalConvectionGradient-${idSuffix}`} 
            x1={TANK_CENTER_X} 
            y1={Y_BOTTOM} 
            x2={TANK_CENTER_X} 
            y2={Y_water} 
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#F43F5E" stopOpacity="0.6" />
            <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.05" />
          </linearGradient>

          {/* Water Pour Stream Gradients */}
          <linearGradient id={`waterStreamGradient-${idSuffix}`} x1={INLET_CENTER_X - 4} y1="0" x2={INLET_CENTER_X + 4} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-stream-start, ${waterColors.streamStart})`} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.98" />
            <stop offset="100%" stopColor={`var(--tank-water-stream-end, ${waterColors.streamEnd})`} stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={`waterStreamShimmer-${idSuffix}`} x1={INLET_CENTER_X - 7} y1="0" x2={INLET_CENTER_X + 7} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
          </linearGradient>

          {/* Water Pour Stream Gradients 2 */}
          <linearGradient id={`waterStreamGradient2-${idSuffix}`} x1={INLET2_CENTER_X - 4} y1="0" x2={INLET2_CENTER_X + 4} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-stream-start, ${waterColors.streamStart})`} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.98" />
            <stop offset="100%" stopColor={`var(--tank-water-stream-end, ${waterColors.streamEnd})`} stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={`waterStreamShimmer2-${idSuffix}`} x1={INLET2_CENTER_X - 7} y1="0" x2={INLET2_CENTER_X + 7} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
          </linearGradient>

          {/* Water Pour Stream Gradients 3 (Inlet 3) */}
          <linearGradient id={`waterStreamGradient3-${idSuffix}`} x1={INLET3_CENTER_X - 4} y1="0" x2={INLET3_CENTER_X + 4} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-stream-start, ${waterColors.streamStart})`} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.98" />
            <stop offset="100%" stopColor={`var(--tank-water-stream-end, ${waterColors.streamEnd})`} stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={`waterStreamShimmer3-${idSuffix}`} x1={INLET3_CENTER_X - 7} y1="0" x2={INLET3_CENTER_X + 7} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
          </linearGradient>

          {/* Water Pour Stream Gradients 4 (Inlet 4) */}
          <linearGradient id={`waterStreamGradient4-${idSuffix}`} x1={INLET4_CENTER_X - 4} y1="0" x2={INLET4_CENTER_X + 4} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={`var(--tank-water-stream-start, ${waterColors.streamStart})`} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.98" />
            <stop offset="100%" stopColor={`var(--tank-water-stream-end, ${waterColors.streamEnd})`} stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={`waterStreamShimmer4-${idSuffix}`} x1={INLET4_CENTER_X - 7} y1="0" x2={INLET4_CENTER_X + 7} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--tank-water-stream-shimmer, #A5F3FC)" stopOpacity="0.35" />
          </linearGradient>

          {/* Gauge Dial Face Gradient */}
          <radialGradient id={`gaugeFace-${idSuffix}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Piping system (connected behind the tank) */}
        <g id="background-piping">
          {showInletPipe && (
            <>
              {/* Inlet Pipe Elbow Shadow */}
              <path
                d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#0F172A"
                strokeWidth="17"
                strokeLinecap="butt"
                fill="none"
                opacity="0.2"
              />

              {/* Inlet Pipe Elbow Main Casing */}
              <path
                d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#CBD5E1"
                strokeWidth="13"
                strokeLinecap="butt"
                fill="none"
              />

              {/* Inlet Pipe Inner Highlight */}
              <path
                d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="butt"
                fill="none"
                opacity="0.3"
              />

              {/* Fluid flow inside the inlet pipe */}
              {isFilling1Flowing && (
                <g id="inlet-flow-core-1" style={{ pointerEvents: 'none' }}>
                  {/* Elegant Stream - Outer Shimmer Glow */}
                  <path
                    d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke={`url(#waterStreamShimmer-${idSuffix})`}
                    strokeWidth="8"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.45"
                    className="shimmer-pulse"
                  />

                  {/* Elegant Stream - Core Fluid Flow */}
                  <path
                    d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke={`url(#waterStreamGradient-${idSuffix})`}
                    strokeWidth="6.5"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.95"
                  />

                  {/* Flowing stream current lines */}
                  <path
                    d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="12, 16"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.85"
                  />

                  <path
                    d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeDasharray="8, 12"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-super"
                    opacity="0.95"
                  />

                  <path
                    d={`M ${inletPipeStartX},45 L ${INLET_CENTER_X - 12},45 A 12,12 0 0,1 ${INLET_CENTER_X},57 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#0D9488"
                    strokeWidth="1.5"
                    strokeDasharray="16, 20"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.75"
                  />
                </g>
              )}

              {/* Nozzle outer metallic bezel lip ring */}
              <ellipse
                cx={INLET_CENTER_X}
                cy={173.1}
                rx="6.4"
                ry="2.0"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.4"
              />

              {/* Nozzle hollow orifice/opening from which water emerges */}
              <ellipse
                cx={INLET_CENTER_X}
                cy={173}
                rx="6.0"
                ry="1.8"
                fill="#090D16"
                stroke="#1E293B"
                strokeWidth="0.3"
              />

              {/* Valve/Connection Design at End of Pipe (Left side, horizontal end at X=13, Y=45) */}
              <g id={`pipe-valve-left-inlet-${idSuffix}`}>
                {/* 1. Pipe connecting flange (dark heavy plate) */}
                <rect
                  x={inletPipeStartX - 8}
                  y="33"
                  width="4"
                  height="24"
                  rx="1"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                {/* Flange Bolts */}
                <circle cx={inletPipeStartX - 6} cy="37" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                <circle cx={inletPipeStartX - 6} cy="53" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                
                {/* 2. Steel threaded coupler/connector hex nut fitting */}
                <rect
                  x={inletPipeStartX - 4}
                  y="35"
                  width="4"
                  height="20"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#1E293B"
                  strokeWidth="0.5"
                />
                {/* Hex division lines for 3D realism */}
                <line x1={inletPipeStartX - 4} y1="42" x2={inletPipeStartX} y2="42" stroke="#475569" strokeWidth="0.5" />
                <line x1={inletPipeStartX - 4} y1="48" x2={inletPipeStartX} y2="48" stroke="#475569" strokeWidth="0.5" />
              </g>
            </>
          )}

          {showInletPipe2 && (
            <>
              {/* Inlet Pipe Elbow 2 Shadow */}
              <path
                d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#0F172A"
                strokeWidth="17"
                strokeLinecap="butt"
                fill="none"
                opacity="0.2"
              />

              {/* Inlet Pipe Elbow 2 Main Casing */}
              <path
                d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#CBD5E1"
                strokeWidth="13"
                strokeLinecap="butt"
                fill="none"
              />

              {/* Inlet Pipe 2 Inner Highlight */}
              <path
                d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="butt"
                fill="none"
                opacity="0.3"
              />

              {/* Fluid flow inside the inlet pipe 2 */}
              {isFilling2Flowing && (
                <g id="inlet-flow-core-2" style={{ pointerEvents: 'none' }}>
                  {/* Elegant Stream - Outer Shimmer Glow */}
                  <path
                    d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke={`url(#waterStreamShimmer2-${idSuffix})`}
                    strokeWidth="8"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.45"
                    className="shimmer-pulse"
                  />

                  {/* Elegant Stream - Core Fluid Flow */}
                  <path
                    d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke={`url(#waterStreamGradient2-${idSuffix})`}
                    strokeWidth="6.5"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.95"
                  />

                  {/* Flowing stream current lines */}
                  <path
                    d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="12, 16"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.85"
                  />

                  <path
                    d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeDasharray="8, 12"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-super"
                    opacity="0.95"
                  />

                  <path
                    d={`M ${inlet2PipeStartX},45 L ${INLET2_CENTER_X + 12},45 A 12,12 0 0,0 ${INLET2_CENTER_X},57 L ${INLET2_CENTER_X},${INLET_NOZZLE_Y}`}
                    stroke="#0D9488"
                    strokeWidth="1.5"
                    strokeDasharray="16, 20"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.75"
                  />
                </g>
              )}

              {/* Nozzle outer metallic bezel lip ring */}
              <ellipse
                cx={INLET2_CENTER_X}
                cy={173.1}
                rx="6.4"
                ry="2.0"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.4"
              />

              {/* Nozzle hollow orifice/opening */}
              <ellipse
                cx={INLET2_CENTER_X}
                cy={173}
                rx="6.0"
                ry="1.8"
                fill="#090D16"
                stroke="#1E293B"
                strokeWidth="0.3"
              />

              {/* Valve/Connection Design at End of Pipe (Right side, horizontal end at X=387, Y=45) */}
              <g id={`pipe-valve-right-inlet-${idSuffix}`}>
                {/* 1. Pipe connecting flange (dark heavy plate) */}
                <rect
                  x={inlet2PipeStartX + 4}
                  y="33"
                  width="4"
                  height="24"
                  rx="1"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                {/* Flange Bolts */}
                <circle cx={inlet2PipeStartX + 6} cy="37" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                <circle cx={inlet2PipeStartX + 6} cy="53" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                
                {/* 2. Steel threaded coupler/connector hex nut fitting */}
                <rect
                  x={inlet2PipeStartX}
                  y="35"
                  width="4"
                  height="20"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#1E293B"
                  strokeWidth="0.5"
                />
                {/* Hex division lines */}
                <line x1={inlet2PipeStartX} y1="42" x2={inlet2PipeStartX + 4} y2="42" stroke="#475569" strokeWidth="0.5" />
                <line x1={inlet2PipeStartX} y1="48" x2={inlet2PipeStartX + 4} y2="48" stroke="#475569" strokeWidth="0.5" />
              </g>
            </>
          )}

          {/* ===== INLET PIPE 3 (Vertical, from top, inner-left) ===== */}
          {showInletPipe3 && (
            <>
              {/* Inlet Pipe 3 Shadow */}
              <path
                d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                stroke="#0F172A"
                strokeWidth="17"
                strokeLinecap="butt"
                fill="none"
                opacity="0.2"
              />

              {/* Inlet Pipe 3 Main Casing */}
              <path
                d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                stroke="#CBD5E1"
                strokeWidth="13"
                strokeLinecap="butt"
                fill="none"
              />

              {/* Inlet Pipe 3 Inner Highlight */}
              <path
                d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="butt"
                fill="none"
                opacity="0.3"
              />

              {/* Fluid flow inside the inlet pipe 3 */}
              {isFilling3Flowing && (
                <g id="inlet-flow-core-3" style={{ pointerEvents: 'none' }}>
                  {/* Elegant Stream - Outer Shimmer Glow */}
                  <path
                    d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                    stroke={`url(#waterStreamShimmer3-${idSuffix})`}
                    strokeWidth="8"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.45"
                    className="shimmer-pulse"
                  />

                  {/* Elegant Stream - Core Fluid Flow */}
                  <path
                    d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                    stroke={`url(#waterStreamGradient3-${idSuffix})`}
                    strokeWidth="6.5"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.95"
                  />

                  {/* Flowing stream current lines */}
                  <path
                    d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="12, 16"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.85"
                  />

                  <path
                    d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeDasharray="8, 12"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-super"
                    opacity="0.95"
                  />

                  <path
                    d={`M ${INLET3_CENTER_X},${inlet3PipeStartY} L ${INLET3_CENTER_X},${INLET3_NOZZLE_Y}`}
                    stroke="#0D9488"
                    strokeWidth="1.5"
                    strokeDasharray="16, 20"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.75"
                  />
                </g>
              )}

              {/* Nozzle outer metallic bezel lip ring */}
              <ellipse
                cx={INLET3_CENTER_X}
                cy={173.1}
                rx="6.4"
                ry="2.0"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.4"
              />

              {/* Nozzle hollow orifice/opening */}
              <ellipse
                cx={INLET3_CENTER_X}
                cy={173}
                rx="6.0"
                ry="1.8"
                fill="#090D16"
                stroke="#1E293B"
                strokeWidth="0.3"
              />

              {/* Valve/Connection Design at Top of Pipe 3 */}
              <g id={`pipe-valve-top-inlet3-${idSuffix}`}>
                {/* 1. Pipe connecting flange (dark heavy plate) */}
                <rect
                  x={INLET3_CENTER_X - 12}
                  y={inlet3PipeStartY}
                  width="24"
                  height="4"
                  rx="1"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                {/* Flange Bolts */}
                <circle cx={INLET3_CENTER_X - 8} cy={inlet3PipeStartY + 2} r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                <circle cx={INLET3_CENTER_X + 8} cy={inlet3PipeStartY + 2} r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />

                {/* 2. Steel threaded coupler/connector hex nut fitting */}
                <rect
                  x={INLET3_CENTER_X - 10}
                  y={inlet3PipeStartY + 4}
                  width="20"
                  height="4"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#1E293B"
                  strokeWidth="0.5"
                />
                {/* Hex division lines for 3D realism */}
                <line x1={INLET3_CENTER_X - 3} y1={inlet3PipeStartY + 4} x2={INLET3_CENTER_X - 3} y2={inlet3PipeStartY + 8} stroke="#475569" strokeWidth="0.5" />
                <line x1={INLET3_CENTER_X + 3} y1={inlet3PipeStartY + 4} x2={INLET3_CENTER_X + 3} y2={inlet3PipeStartY + 8} stroke="#475569" strokeWidth="0.5" />
              </g>
            </>
          )}

          {/* ===== INLET PIPE 4 (Vertical, from top, inner-right) ===== */}
          {showInletPipe4 && (
            <>
              {/* Inlet Pipe 4 Shadow */}
              <path
                d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                stroke="#0F172A"
                strokeWidth="17"
                strokeLinecap="butt"
                fill="none"
                opacity="0.2"
              />

              {/* Inlet Pipe 4 Main Casing */}
              <path
                d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                stroke="#CBD5E1"
                strokeWidth="13"
                strokeLinecap="butt"
                fill="none"
              />

              {/* Inlet Pipe 4 Inner Highlight */}
              <path
                d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="butt"
                fill="none"
                opacity="0.3"
              />

              {/* Fluid flow inside the inlet pipe 4 */}
              {isFilling4Flowing && (
                <g id="inlet-flow-core-4" style={{ pointerEvents: 'none' }}>
                  {/* Elegant Stream - Outer Shimmer Glow */}
                  <path
                    d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                    stroke={`url(#waterStreamShimmer4-${idSuffix})`}
                    strokeWidth="8"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.45"
                    className="shimmer-pulse"
                  />

                  {/* Elegant Stream - Core Fluid Flow */}
                  <path
                    d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                    stroke={`url(#waterStreamGradient4-${idSuffix})`}
                    strokeWidth="6.5"
                    strokeLinecap="butt"
                    fill="none"
                    opacity="0.95"
                  />

                  {/* Flowing stream current lines */}
                  <path
                    d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    strokeDasharray="12, 16"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.85"
                  />

                  <path
                    d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeDasharray="8, 12"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-super"
                    opacity="0.95"
                  />

                  <path
                    d={`M ${INLET4_CENTER_X},${inlet4PipeStartY} L ${INLET4_CENTER_X},${INLET4_NOZZLE_Y}`}
                    stroke="#0D9488"
                    strokeWidth="1.5"
                    strokeDasharray="16, 20"
                    strokeLinecap="butt"
                    fill="none"
                    className="fill-stream-fast"
                    opacity="0.75"
                  />
                </g>
              )}

              {/* Nozzle outer metallic bezel lip ring */}
              <ellipse
                cx={INLET4_CENTER_X}
                cy={173.1}
                rx="6.4"
                ry="2.0"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.4"
              />

              {/* Nozzle hollow orifice/opening */}
              <ellipse
                cx={INLET4_CENTER_X}
                cy={173}
                rx="6.0"
                ry="1.8"
                fill="#090D16"
                stroke="#1E293B"
                strokeWidth="0.3"
              />

              {/* Valve/Connection Design at Top of Pipe 4 */}
              <g id={`pipe-valve-top-inlet4-${idSuffix}`}>
                {/* 1. Pipe connecting flange (dark heavy plate) */}
                <rect
                  x={INLET4_CENTER_X - 12}
                  y={inlet4PipeStartY}
                  width="24"
                  height="4"
                  rx="1"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                {/* Flange Bolts */}
                <circle cx={INLET4_CENTER_X - 8} cy={inlet4PipeStartY + 2} r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
                <circle cx={INLET4_CENTER_X + 8} cy={inlet4PipeStartY + 2} r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />

                {/* 2. Steel threaded coupler/connector hex nut fitting */}
                <rect
                  x={INLET4_CENTER_X - 10}
                  y={inlet4PipeStartY + 4}
                  width="20"
                  height="4"
                  fill={`url(#metalGradient-${idSuffix})`}
                  stroke="#1E293B"
                  strokeWidth="0.5"
                />
                {/* Hex division lines for 3D realism */}
                <line x1={INLET4_CENTER_X - 3} y1={inlet4PipeStartY + 4} x2={INLET4_CENTER_X - 3} y2={inlet4PipeStartY + 8} stroke="#475569" strokeWidth="0.5" />
                <line x1={INLET4_CENTER_X + 3} y1={inlet4PipeStartY + 4} x2={INLET4_CENTER_X + 3} y2={inlet4PipeStartY + 8} stroke="#475569" strokeWidth="0.5" />
              </g>
            </>
          )}

          {showOverflowPipe && (
            <>
              {/* Overflow pipe */}
              <path
                d={`M ${outerLeftX + 2},${TANK_CYLINDER_Y1 + 40} L ${outerLeftX - 26},${TANK_CYLINDER_Y1 + 40} A 10,10 0 0,0 ${outerLeftX - 36},${TANK_CYLINDER_Y1 + 50} L ${outerLeftX - 36},${TANK_CYLINDER_Y1 + 130}`}
                stroke={`url(#metalVerticalGradient-${idSuffix})`}
                strokeWidth="9"
                fill="none"
              />

              {/* Sleek metallic transition collar at the end of the overflow pipe */}
              <rect
                x={outerLeftX - 41.5}
                y={TANK_CYLINDER_Y1 + 130}
                width="11"
                height="2"
                fill="#475569"
                stroke="#1E293B"
                strokeWidth="0.5"
              />

              {/* Overflow hex-shaped compression coupling (Stainless steel replacing brass) */}
              <rect
                x={outerLeftX - 42.5}
                y={TANK_CYLINDER_Y1 + 132}
                width="13"
                height="2.5"
                fill={`url(#metalVerticalGradient-${idSuffix})`}
                stroke="#334155"
                strokeWidth="0.5"
              />
              {/* Hex vertical facet divider lines for overflow tip */}
              <line
                x1={outerLeftX - 36 - 2.2}
                y1={TANK_CYLINDER_Y1 + 132}
                x2={outerLeftX - 36 - 2.2}
                y2={TANK_CYLINDER_Y1 + 134.5}
                stroke="#334155"
                strokeWidth="0.5"
                opacity="0.7"
              />
              <line
                x1={outerLeftX - 36 + 2.2}
                y1={TANK_CYLINDER_Y1 + 132}
                x2={outerLeftX - 36 + 2.2}
                y2={TANK_CYLINDER_Y1 + 134.5}
                stroke="#334155"
                strokeWidth="0.5"
                opacity="0.7"
              />

              {/* Tapered Nozzle Tip for Overflow */}
              <path
                d={`M ${outerLeftX - 41.5},${TANK_CYLINDER_Y1 + 134.5} 
                    L ${outerLeftX - 30.5},${TANK_CYLINDER_Y1 + 134.5} 
                    L ${outerLeftX - 32.5},${TANK_CYLINDER_Y1 + 140} 
                    L ${outerLeftX - 39.5},${TANK_CYLINDER_Y1 + 140} Z`}
                fill={`url(#metalVerticalGradient-${idSuffix})`}
                stroke="#1E293B"
                strokeWidth="0.5"
              />

              {/* Overflow nozzle outer lip ring */}
              <ellipse
                cx={outerLeftX - 36}
                cy={TANK_CYLINDER_Y1 + 140.1}
                rx="3.8"
                ry="1.1"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.3"
              />

              {/* Overflow nozzle orifice */}
              <ellipse
                cx={outerLeftX - 36}
                cy={TANK_CYLINDER_Y1 + 140}
                rx="3.5"
                ry="1.0"
                fill="#090D16"
                stroke="#1E293B"
                strokeWidth="0.3"
              />
            </>
          )}
        </g>



        {/* Tank transparent background glass shell */}
        <path
          id="tank-shell-bg"
          d={outerPathD}
          fill={`url(#glassGradient-${idSuffix})`}
        />

        {/* Thermal convection background glow */}
        {clampedFill > 0 && thermalIntensity > 0 && (
          <g id="thermal-backdrop-layer" clipPath={`url(#tank-inner-${idSuffix})`} className="thermal-glow-convection" style={{ mixBlendMode: 'screen' }}>
            <rect
              x={outerLeftX}
              y={Y_water}
              width={TANK_WIDTH}
              height={Y_BOTTOM - Y_water + 20}
              fill={`url(#thermalConvectionGradient-${idSuffix})`}
              opacity={thermalIntensity * 0.7}
            />
          </g>
        )}

        {/* Dynamic fluid container and waves */}
        {clampedFill > 0 && (
          <g id="animated-water" clipPath={`url(#tank-inner-${idSuffix})`}>
            {/* Back Wave */}
            <g transform={`translate(0, ${Y_water})`}>
              <path
                d={backWaveD}
                fill={`url(#waterGradientBack-${idSuffix})`}
                className="wave-back"
              />
            </g>

            {/* Middle Wave */}
            <g transform={`translate(0, ${Y_water})`}>
              <path
                d={midWaveD}
                fill={`url(#waterGradientMiddle-${idSuffix})`}
                className="wave-middle"
              />
            </g>

            {/* Front Wave */}
            <g transform={`translate(0, ${Y_water})`}>
              <path
                d={frontWaveD}
                fill={`url(#waterGradientFront-${idSuffix})`}
                className="wave-front"
              />
            </g>

            {/* Thermal overlay for top of water glow */}
            {thermalIntensity > 0 && (
              <g id="thermal-water-overlay" style={{ mixBlendMode: 'screen' }}>
                <rect
                  x={outerLeftX - 10}
                  y={Y_water - 15}
                  width={TANK_WIDTH + 20}
                  height={Y_BOTTOM - Y_water + 30}
                  fill={`url(#thermalConvectionGradient-${idSuffix})`}
                  opacity={thermalIntensity * 0.55}
                />
              </g>
            )}

            {/* Floating bubbles */}
            <g id="water-bubbles" clipPath={`url(#water-level-clip-${idSuffix})`}>
              <circle cx="0" cy="0" r="3.2" fill="#FFFFFF" opacity="0.65" className="bubble-1" />
              <circle cx="0" cy="0" r="2.0" fill="#FFFFFF" opacity="0.50" className="bubble-2" />
              <circle cx="0" cy="0" r="4.2" fill="#FFFFFF" opacity="0.75" className="bubble-3" />
              
              <circle cx="0" cy="0" r="1.5" fill="#E0F2FE" opacity="0.45" className="bubble-slow" />
              <circle cx="0" cy="0" r="2.8" fill="#A5F3FC" opacity="0.60" className="bubble-slow" style={{ animationDelay: '2.5s' }} />

              {(isFilling1Flowing || isFilling2Flowing || isDraining1Flowing || isDraining2Flowing) && (
                <>
                  <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" opacity="0.80" className="bubble-fast" />
                  <circle cx="0" cy="0" r="3.5" fill="#22D3EE" opacity="0.70" className="bubble-fast" style={{ animationDelay: '1.1s' }} />
                  <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" opacity="0.85" className="bubble-fast" style={{ animationDelay: '1.9s' }} />
                </>
              )}
            </g>
          </g>
        )}        {/* Outlet Pump Suction Pipe Assembly */}
        {showOutletPipe && (
          <g id="outlet-pump-pipe-assembly">
            {/* Main solid pipe shadow/glow */}
            <path
              d={pumpPipePathD}
              stroke="#0F172A"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
              opacity="0.25"
            />
            {/* Main pipe cylinder */}
            <path
              d={pumpPipePathD}
              stroke={`url(#metalVerticalGradient-${idSuffix})`}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            {/* 3D highlights */}
            <path
              d={pumpPipePathD}
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.28"
            />



            {/* Mounting bracket holding the pipe at the top edge of the tank */}
            <g id="pump-pipe-bracket">
              <rect x={PUMP_PIPE_X - 14} y={TANK_CYLINDER_Y1 + 10} width="28" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />
              <circle cx={PUMP_PIPE_X - 9} cy={TANK_CYLINDER_Y1 + 13} r="1.2" fill="#94A3B8" />
              <circle cx={PUMP_PIPE_X + 9} cy={TANK_CYLINDER_Y1 + 13} r="1.2" fill="#94A3B8" />
            </g>

            {/* Fluid flow inside the suction pump pipe */}
            {isDraining1Flowing && clampedFill > 1 && (
              <g id="pump-flow-core" style={{ pointerEvents: 'none' }}>
                {/* Elegant Tapered Stream - Outer Shimmer Glow */}
                <path
                  d={pumpPipePathD}
                  stroke={`url(#waterStreamShimmer-${idSuffix})`}
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                  className="shimmer-pulse"
                />

                {/* Elegant Tapered Stream - Core Fluid Flow */}
                <path
                  d={pumpPipePathD}
                  stroke={`url(#waterStreamGradient-${idSuffix})`}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.95"
                />

                {/* Left flowing stream current line */}
                <path
                  d={pumpPipePathD}
                  stroke="#22D3EE"
                  strokeWidth="1.5"
                  strokeDasharray="12, 16"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-fast"
                  opacity="0.85"
                />

                {/* Central high-velocity stream line */}
                <path
                  d={pumpPipePathD}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="8, 12"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-super"
                  opacity="0.95"
                />

                {/* Right flowing stream current line */}
                <path
                  d={pumpPipePathD}
                  stroke="#0D9488"
                  strokeWidth="1.5"
                  strokeDasharray="16, 20"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-fast"
                  opacity="0.75"
                />
              </g>
            )}

            {/* Valve/Connection Design at End of Pipe (Right side, horizontal end at X=387, Y=110) */}
            <g id={`pipe-valve-right-outlet-${idSuffix}`}>
              {/* 1. Pipe connecting flange (dark heavy plate) */}
              <rect
                x={inlet2PipeStartX + 4}
                y="98"
                width="4"
                height="24"
                rx="1"
                fill={`url(#metalGradient-${idSuffix})`}
                stroke="#0F172A"
                strokeWidth="0.8"
              />
              {/* Flange Bolts */}
              <circle cx={inlet2PipeStartX + 6} cy="102" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
              <circle cx={inlet2PipeStartX + 6} cy="118" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
              
              {/* 2. Steel threaded coupler/connector hex nut fitting */}
              <rect
                x={inlet2PipeStartX}
                y="100"
                width="4"
                height="20"
                fill={`url(#metalGradient-${idSuffix})`}
                stroke="#1E293B"
                strokeWidth="0.5"
              />
              {/* Hex division lines */}
              <line x1={inlet2PipeStartX} y1="107" x2={inlet2PipeStartX + 4} y2="107" stroke="#475569" strokeWidth="0.5" />
              <line x1={inlet2PipeStartX} y1="113" x2={inlet2PipeStartX + 4} y2="113" stroke="#475569" strokeWidth="0.5" />
            </g>
          </g>
        )}

        {/* Outlet Pump Suction Pipe Assembly 2 */}
        {showOutletPipe2 && (
          <g id="outlet-pump-pipe-assembly-2">
            {/* Main solid pipe shadow/glow */}
            <path
              d={pump2PipePathD}
              stroke="#0F172A"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
              opacity="0.25"
            />
            {/* Main pipe cylinder */}
            <path
              d={pump2PipePathD}
              stroke={`url(#metalVerticalGradient-${idSuffix})`}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            {/* 3D highlights */}
            <path
              d={pump2PipePathD}
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.28"
            />



            {/* Mounting bracket holding the pipe at the top edge of the tank */}
            <g id="pump-pipe-bracket-2">
              <rect x={PUMP2_PIPE_X - 14} y={TANK_CYLINDER_Y1 + 10} width="28" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />
              <circle cx={PUMP2_PIPE_X - 9} cy={TANK_CYLINDER_Y1 + 13} r="1.2" fill="#94A3B8" />
              <circle cx={PUMP2_PIPE_X + 9} cy={TANK_CYLINDER_Y1 + 13} r="1.2" fill="#94A3B8" />
            </g>

            {/* Fluid flow inside the suction pump pipe 2 */}
            {isDraining2Flowing && clampedFill > 1 && (
              <g id="pump-flow-core-2" style={{ pointerEvents: 'none' }}>
                {/* Elegant Tapered Stream - Outer Shimmer Glow */}
                <path
                  d={pump2PipePathD}
                  stroke={`url(#waterStreamShimmer-${idSuffix})`}
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                  className="shimmer-pulse"
                />

                {/* Elegant Tapered Stream - Core Fluid Flow */}
                <path
                  d={pump2PipePathD}
                  stroke={`url(#waterStreamGradient-${idSuffix})`}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.95"
                />

                {/* Left flowing stream current line */}
                <path
                  d={pump2PipePathD}
                  stroke="#22D3EE"
                  strokeWidth="1.5"
                  strokeDasharray="12, 16"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-fast"
                  opacity="0.85"
                />

                {/* Central high-velocity stream line */}
                <path
                  d={pump2PipePathD}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="8, 12"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-super"
                  opacity="0.95"
                />

                {/* Right flowing stream current line */}
                <path
                  d={pump2PipePathD}
                  stroke="#0D9488"
                  strokeWidth="1.5"
                  strokeDasharray="16, 20"
                  strokeLinecap="round"
                  fill="none"
                  className="fill-stream-fast"
                  opacity="0.75"
                />
              </g>
            )}

            {/* Valve/Connection Design at End of Pipe (Left side, horizontal end at X=13, Y=110) */}
            <g id={`pipe-valve-left-outlet-${idSuffix}`}>
              {/* 1. Pipe connecting flange (dark heavy plate) */}
              <rect
                x={inletPipeStartX - 8}
                y="98"
                width="4"
                height="24"
                rx="1"
                fill={`url(#metalGradient-${idSuffix})`}
                stroke="#0F172A"
                strokeWidth="0.8"
              />
              {/* Flange Bolts */}
              <circle cx={inletPipeStartX - 6} cy="102" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
              <circle cx={inletPipeStartX - 6} cy="118" r="1" fill="#E2E8F0" stroke="#334155" strokeWidth="0.3" />
              
              {/* 2. Steel threaded coupler/connector hex nut fitting */}
              <rect
                x={inletPipeStartX - 4}
                y="100"
                width="4"
                height="20"
                fill={`url(#metalGradient-${idSuffix})`}
                stroke="#1E293B"
                strokeWidth="0.5"
              />
              {/* Hex division lines for 3D realism */}
              <line x1={inletPipeStartX - 4} y1="107" x2={inletPipeStartX} y2="107" stroke="#475569" strokeWidth="0.5" />
              <line x1={inletPipeStartX - 4} y1="113" x2={inletPipeStartX} y2="113" stroke="#475569" strokeWidth="0.5" />
            </g>
          </g>
        )}

        {/* Inlet pour stream */}
        {isFilling1Flowing && showInletPipe && Y_water > INLET_NOZZLE_Y && (
          <g 
            id="inlet-pour-stream" 
            style={{ 
              pointerEvents: 'none',
              '--stream-height': `${Math.max(0, Y_water - INLET_NOZZLE_Y)}px`
            } as React.CSSProperties}
          >
            {/* Elegant Tapered Stream - Outer Shimmer Glow */}
            <path
              d={`M ${INLET_CENTER_X - 6.0},${INLET_NOZZLE_Y} 
                  Q ${INLET_CENTER_X - 5.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X - 4.0},${Y_water}
                  L ${INLET_CENTER_X + 4.0},${Y_water}
                  Q ${INLET_CENTER_X + 5.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X + 6.0},${INLET_NOZZLE_Y} Z`}
              fill={`url(#waterStreamShimmer-${idSuffix})`}
              opacity="0.45"
              className="shimmer-pulse"
            />

            {/* Elegant Tapered Stream - Core Fluid Flow */}
            <path
              d={`M ${INLET_CENTER_X - 5.0},${INLET_NOZZLE_Y} 
                  Q ${INLET_CENTER_X - 4.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X - 3.0},${Y_water}
                  L ${INLET_CENTER_X + 3.0},${Y_water}
                  Q ${INLET_CENTER_X + 4.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X + 5.0},${INLET_NOZZLE_Y} Z`}
              fill={`url(#waterStreamGradient-${idSuffix})`}
              opacity="0.95"
            />

            {/* Left flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET_CENTER_X - 3.5},${INLET_NOZZLE_Y} 
                  Q ${INLET_CENTER_X - 2.5},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X - 1.5},${Y_water}`}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeDasharray="12, 16"
              fill="none"
              className="fill-stream-fast"
              opacity="0.85"
            />

            {/* Central high-velocity stream line */}
            <path
              d={`M ${INLET_CENTER_X},${INLET_NOZZLE_Y} 
                  L ${INLET_CENTER_X},${Y_water}`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8, 12"
              fill="none"
              className="fill-stream-super"
              opacity="0.95"
            />

            {/* Right flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET_CENTER_X + 3.5},${INLET_NOZZLE_Y} 
                  Q ${INLET_CENTER_X + 2.5},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET_CENTER_X + 1.5},${Y_water}`}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="16, 20"
              fill="none"
              className="fill-stream-fast"
              opacity="0.75"
            />

            {/* Splash group on water surface */}
            <g id="inflow-splash-group" transform={`translate(${INLET_CENTER_X}, ${Y_water})`} opacity="0.95">
              <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={{ animation: 'ripplePulseOuter 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite' }} />
              <ellipse cx="0" cy="0" rx="8" ry="2.5" fill="none" stroke="#22D3EE" strokeWidth="1" style={{ animation: 'ripplePulseInner 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite', animationDelay: '0.4s' }} />

              <circle cx="-3" cy="0" r="2.2" fill="#E0F2FE" className="inflow-splash-l" />
              <circle cx="3" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-r" />
              <circle cx="0" cy="-2" r="2.0" fill="#FFFFFF" className="inflow-splash-h" />
              
              <circle cx="-5" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-l" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
              <circle cx="5" cy="0" r="1.5" fill="#FFFFFF" className="inflow-splash-r" style={{ animationDelay: '0.3s', animationDuration: '0.55s' }} />
              <circle cx="2" cy="-1" r="1.3" fill="#E0F2FE" className="inflow-splash-h" style={{ animationDelay: '0.15s', animationDuration: '0.45s' }} />
            </g>
          </g>
        )}

        {/* Inlet pour stream 2 */}
        {isFilling2Flowing && showInletPipe2 && Y_water > INLET_NOZZLE_Y && (
          <g 
            id="inlet-pour-stream-2" 
            style={{ 
              pointerEvents: 'none',
              '--stream-height': `${Math.max(0, Y_water - INLET_NOZZLE_Y)}px`
            } as React.CSSProperties}
          >
            {/* Elegant Tapered Stream - Outer Shimmer Glow */}
            <path
              d={`M ${INLET2_CENTER_X - 6.0},${INLET_NOZZLE_Y} 
                  Q ${INLET2_CENTER_X - 5.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X - 4.0},${Y_water}
                  L ${INLET2_CENTER_X + 4.0},${Y_water}
                  Q ${INLET2_CENTER_X + 5.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X + 6.0},${INLET_NOZZLE_Y} Z`}
              fill={`url(#waterStreamShimmer2-${idSuffix})`}
              opacity="0.45"
              className="shimmer-pulse"
            />

            {/* Elegant Tapered Stream - Core Fluid Flow */}
            <path
              d={`M ${INLET2_CENTER_X - 5.0},${INLET_NOZZLE_Y} 
                  Q ${INLET2_CENTER_X - 4.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X - 3.0},${Y_water}
                  L ${INLET2_CENTER_X + 3.0},${Y_water}
                  Q ${INLET2_CENTER_X + 4.0},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X + 5.0},${INLET_NOZZLE_Y} Z`}
              fill={`url(#waterStreamGradient2-${idSuffix})`}
              opacity="0.95"
            />

            {/* Left flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET2_CENTER_X - 3.5},${INLET_NOZZLE_Y} 
                  Q ${INLET2_CENTER_X - 2.5},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X - 1.5},${Y_water}`}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeDasharray="12, 16"
              fill="none"
              className="fill-stream-fast"
              opacity="0.85"
            />

            {/* Central high-velocity stream line */}
            <path
              d={`M ${INLET2_CENTER_X},${INLET_NOZZLE_Y} 
                  L ${INLET2_CENTER_X},${Y_water}`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8, 12"
              fill="none"
              className="fill-stream-super"
              opacity="0.95"
            />

            {/* Right flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET2_CENTER_X + 3.5},${INLET_NOZZLE_Y} 
                  Q ${INLET2_CENTER_X + 2.5},${(INLET_NOZZLE_Y + Y_water) / 2} ${INLET2_CENTER_X + 1.5},${Y_water}`}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="16, 20"
              fill="none"
              className="fill-stream-fast"
              opacity="0.75"
            />

            {/* Splash group on water surface */}
            <g id="inflow-splash-group-2" transform={`translate(${INLET2_CENTER_X}, ${Y_water})`} opacity="0.95">
              <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={{ animation: 'ripplePulseOuter 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite' }} />
              <ellipse cx="0" cy="0" rx="8" ry="2.5" fill="none" stroke="#22D3EE" strokeWidth="1" style={{ animation: 'ripplePulseInner 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite', animationDelay: '0.4s' }} />

              <circle cx="-3" cy="0" r="2.2" fill="#E0F2FE" className="inflow-splash-l" />
              <circle cx="3" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-r" />
              <circle cx="0" cy="-2" r="2.0" fill="#FFFFFF" className="inflow-splash-h" />
              
              <circle cx="-5" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-l" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
              <circle cx="5" cy="0" r="1.5" fill="#FFFFFF" className="inflow-splash-r" style={{ animationDelay: '0.3s', animationDuration: '0.55s' }} />
              <circle cx="2" cy="-1" r="1.3" fill="#E0F2FE" className="inflow-splash-h" style={{ animationDelay: '0.15s', animationDuration: '0.45s' }} />
            </g>
          </g>
        )}

        {/* Inlet pour stream 3 */}
        {isFilling3Flowing && showInletPipe3 && Y_water > INLET3_NOZZLE_Y && (
          <g 
            id="inlet-pour-stream-3" 
            style={{ 
              pointerEvents: 'none',
              '--stream-height': `${Math.max(0, Y_water - INLET3_NOZZLE_Y)}px`
            } as React.CSSProperties}
          >
            {/* Elegant Tapered Stream - Outer Shimmer Glow */}
            <path
              d={`M ${INLET3_CENTER_X - 6.0},${INLET3_NOZZLE_Y} 
                  Q ${INLET3_CENTER_X - 5.0},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X - 4.0},${Y_water}
                  L ${INLET3_CENTER_X + 4.0},${Y_water}
                  Q ${INLET3_CENTER_X + 5.0},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X + 6.0},${INLET3_NOZZLE_Y} Z`}
              fill={`url(#waterStreamShimmer3-${idSuffix})`}
              opacity="0.45"
              className="shimmer-pulse"
            />

            {/* Elegant Tapered Stream - Core Fluid Flow */}
            <path
              d={`M ${INLET3_CENTER_X - 5.0},${INLET3_NOZZLE_Y} 
                  Q ${INLET3_CENTER_X - 4.0},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X - 3.0},${Y_water}
                  L ${INLET3_CENTER_X + 3.0},${Y_water}
                  Q ${INLET3_CENTER_X + 4.0},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X + 5.0},${INLET3_NOZZLE_Y} Z`}
              fill={`url(#waterStreamGradient3-${idSuffix})`}
              opacity="0.95"
            />

            {/* Left flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET3_CENTER_X - 3.5},${INLET3_NOZZLE_Y} 
                  Q ${INLET3_CENTER_X - 2.5},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X - 1.5},${Y_water}`}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeDasharray="12, 16"
              fill="none"
              className="fill-stream-fast"
              opacity="0.85"
            />

            {/* Central high-velocity stream line */}
            <path
              d={`M ${INLET3_CENTER_X},${INLET3_NOZZLE_Y} 
                  L ${INLET3_CENTER_X},${Y_water}`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8, 12"
              fill="none"
              className="fill-stream-super"
              opacity="0.95"
            />

            {/* Right flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET3_CENTER_X + 3.5},${INLET3_NOZZLE_Y} 
                  Q ${INLET3_CENTER_X + 2.5},${(INLET3_NOZZLE_Y + Y_water) / 2} ${INLET3_CENTER_X + 1.5},${Y_water}`}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="16, 20"
              fill="none"
              className="fill-stream-fast"
              opacity="0.75"
            />

            {/* Splash group on water surface */}
            <g id="inflow-splash-group-3" transform={`translate(${INLET3_CENTER_X}, ${Y_water})`} opacity="0.95">
              <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={{ animation: 'ripplePulseOuter 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite' }} />
              <ellipse cx="0" cy="0" rx="8" ry="2.5" fill="none" stroke="#22D3EE" strokeWidth="1" style={{ animation: 'ripplePulseInner 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite', animationDelay: '0.4s' }} />

              <circle cx="-3" cy="0" r="2.2" fill="#E0F2FE" className="inflow-splash-l" />
              <circle cx="3" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-r" />
              <circle cx="0" cy="-2" r="2.0" fill="#FFFFFF" className="inflow-splash-h" />
              
              <circle cx="-5" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-l" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
              <circle cx="5" cy="0" r="1.5" fill="#FFFFFF" className="inflow-splash-r" style={{ animationDelay: '0.3s', animationDuration: '0.55s' }} />
              <circle cx="2" cy="-1" r="1.3" fill="#E0F2FE" className="inflow-splash-h" style={{ animationDelay: '0.15s', animationDuration: '0.45s' }} />
            </g>
          </g>
        )}

        {/* Inlet pour stream 4 */}
        {isFilling4Flowing && showInletPipe4 && Y_water > INLET4_NOZZLE_Y && (
          <g 
            id="inlet-pour-stream-4" 
            style={{ 
              pointerEvents: 'none',
              '--stream-height': `${Math.max(0, Y_water - INLET4_NOZZLE_Y)}px`
            } as React.CSSProperties}
          >
            {/* Elegant Tapered Stream - Outer Shimmer Glow */}
            <path
              d={`M ${INLET4_CENTER_X - 6.0},${INLET4_NOZZLE_Y} 
                  Q ${INLET4_CENTER_X - 5.0},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X - 4.0},${Y_water}
                  L ${INLET4_CENTER_X + 4.0},${Y_water}
                  Q ${INLET4_CENTER_X + 5.0},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X + 6.0},${INLET4_NOZZLE_Y} Z`}
              fill={`url(#waterStreamShimmer4-${idSuffix})`}
              opacity="0.45"
              className="shimmer-pulse"
            />

            {/* Elegant Tapered Stream - Core Fluid Flow */}
            <path
              d={`M ${INLET4_CENTER_X - 5.0},${INLET4_NOZZLE_Y} 
                  Q ${INLET4_CENTER_X - 4.0},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X - 3.0},${Y_water}
                  L ${INLET4_CENTER_X + 3.0},${Y_water}
                  Q ${INLET4_CENTER_X + 4.0},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X + 5.0},${INLET4_NOZZLE_Y} Z`}
              fill={`url(#waterStreamGradient4-${idSuffix})`}
              opacity="0.95"
            />

            {/* Left flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET4_CENTER_X - 3.5},${INLET4_NOZZLE_Y} 
                  Q ${INLET4_CENTER_X - 2.5},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X - 1.5},${Y_water}`}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeDasharray="12, 16"
              fill="none"
              className="fill-stream-fast"
              opacity="0.85"
            />

            {/* Central high-velocity stream line */}
            <path
              d={`M ${INLET4_CENTER_X},${INLET4_NOZZLE_Y} 
                  L ${INLET4_CENTER_X},${Y_water}`}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8, 12"
              fill="none"
              className="fill-stream-super"
              opacity="0.95"
            />

            {/* Right flowing stream current line (converges towards center) */}
            <path
              d={`M ${INLET4_CENTER_X + 3.5},${INLET4_NOZZLE_Y} 
                  Q ${INLET4_CENTER_X + 2.5},${(INLET4_NOZZLE_Y + Y_water) / 2} ${INLET4_CENTER_X + 1.5},${Y_water}`}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="16, 20"
              fill="none"
              className="fill-stream-fast"
              opacity="0.75"
            />

            {/* Splash group on water surface */}
            <g id="inflow-splash-group-4" transform={`translate(${INLET4_CENTER_X}, ${Y_water})`} opacity="0.95">
              <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={{ animation: 'ripplePulseOuter 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite' }} />
              <ellipse cx="0" cy="0" rx="8" ry="2.5" fill="none" stroke="#22D3EE" strokeWidth="1" style={{ animation: 'ripplePulseInner 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite', animationDelay: '0.4s' }} />

              <circle cx="-3" cy="0" r="2.2" fill="#E0F2FE" className="inflow-splash-l" />
              <circle cx="3" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-r" />
              <circle cx="0" cy="-2" r="2.0" fill="#FFFFFF" className="inflow-splash-h" />
              
              <circle cx="-5" cy="0" r="1.8" fill="#22D3EE" className="inflow-splash-l" style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
              <circle cx="5" cy="0" r="1.5" fill="#FFFFFF" className="inflow-splash-r" style={{ animationDelay: '0.3s', animationDuration: '0.55s' }} />
              <circle cx="2" cy="-1" r="1.3" fill="#E0F2FE" className="inflow-splash-h" style={{ animationDelay: '0.15s', animationDuration: '0.45s' }} />
            </g>
          </g>
        )}

        {/* Overflow drain stream */}
        {showOverflowPipe && clampedFill > 95.5 && (() => {
          const OVERFLOW_X = outerLeftX - 36;
          const OVERFLOW_Y_START = TANK_CYLINDER_Y1 + 140;
          const OVERFLOW_Y_END = 550;
          return (
            <g id="overflow-stream" style={{ pointerEvents: 'none' }}>
              {/* Elegant Tapered Stream - Outer Shimmer Glow */}
              <path
                d={`M ${OVERFLOW_X - 3.5},${OVERFLOW_Y_START} 
                    Q ${OVERFLOW_X - 2.8},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X - 2.2},${OVERFLOW_Y_END}
                    L ${OVERFLOW_X + 2.2},${OVERFLOW_Y_END}
                    Q ${OVERFLOW_X + 2.8},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X + 3.5},${OVERFLOW_Y_START} Z`}
                fill={`url(#waterStreamShimmer-${idSuffix})`}
                opacity="0.45"
                className="shimmer-pulse"
              />

              {/* Elegant Tapered Stream - Core Fluid Flow */}
              <path
                d={`M ${OVERFLOW_X - 2.8},${OVERFLOW_Y_START} 
                    Q ${OVERFLOW_X - 2.2},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X - 1.5},${OVERFLOW_Y_END}
                    L ${OVERFLOW_X + 1.5},${OVERFLOW_Y_END}
                    Q ${OVERFLOW_X + 2.2},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X + 2.8},${OVERFLOW_Y_START} Z`}
                fill={`url(#waterStreamGradient-${idSuffix})`}
                opacity="0.95"
              />

              {/* Left flowing stream current line */}
              <path
                d={`M ${OVERFLOW_X - 2.0},${OVERFLOW_Y_START} 
                    Q ${OVERFLOW_X - 1.5},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X - 0.8},${OVERFLOW_Y_END}`}
                stroke="#22D3EE"
                strokeWidth="1.2"
                strokeDasharray="10, 14"
                fill="none"
                className="fill-stream-fast"
                opacity="0.8"
              />

              {/* Central high-velocity stream line */}
              <path
                d={`M ${OVERFLOW_X},${OVERFLOW_Y_START} 
                    L ${OVERFLOW_X},${OVERFLOW_Y_END}`}
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeDasharray="6, 10"
                fill="none"
                className="fill-stream-super"
                opacity="0.9"
              />

              {/* Right flowing stream current line */}
              <path
                d={`M ${OVERFLOW_X + 2.0},${OVERFLOW_Y_START} 
                    Q ${OVERFLOW_X + 1.5},${(OVERFLOW_Y_START + OVERFLOW_Y_END) / 2} ${OVERFLOW_X + 0.8},${OVERFLOW_Y_END}`}
                stroke="#0D9488"
                strokeWidth="1.2"
                strokeDasharray="14, 18"
                fill="none"
                className="fill-stream-fast"
                opacity="0.75"
              />
            </g>
          );
        })()}

        {/* Top & Bottom Seam collars */}
        <g id="heavy-seam-collars" opacity="0.95">
          {/* Flat top lip */}
          <line x1={outerLeftX - 2} y1={TANK_CYLINDER_Y1} x2={outerRightX + 2} y2={TANK_CYLINDER_Y1} stroke={`url(#metalGradient-${idSuffix})`} strokeWidth="6.5" />
          {topCollarBolts.map((bolt, idx) => (
            <circle key={`top-bolt-${idx}`} cx={bolt.cx} cy={bolt.cy} r="1.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="0.5" />
          ))}

          {/* Flat bottom collar */}
          <line x1={outerLeftX - 2} y1={TANK_CYLINDER_Y2} x2={outerRightX + 2} y2={TANK_CYLINDER_Y2} stroke={`url(#metalGradient-${idSuffix})`} strokeWidth="6.5" />
          {bottomCollarBolts.map((bolt, idx) => (
            <circle key={`bottom-bolt-${idx}`} cx={bolt.cx} cy={bolt.cy} r="1.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="0.5" />
          ))}
        </g>

        {/* Analog pressure gauge */}
        {showGauge && (
          <g id="scada-pressure-gauge">
            <rect x={outerRightX} y={GAUGE_CENTER_Y - 6} width="28" height="12" fill={`url(#metalVerticalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
            
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y} r="28" fill={`url(#metalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="1" />
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y} r="26" fill="none" stroke="#FFFFFF" strokeWidth="0.75" opacity="0.4" />
            
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y} r="23" fill={`url(#gaugeFace-${idSuffix})`} />

            {/* Color sectors */}
            <path d={`M ${outerRightX + 28.5},${GAUGE_CENTER_Y - 11.5} A 22,22 0 0,1 ${outerRightX + 34},${GAUGE_CENTER_Y - 19}`} stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.65" />
            <path d={`M ${outerRightX + 34},${GAUGE_CENTER_Y - 19} A 22,22 0 0,1 ${outerRightX + 62},${GAUGE_CENTER_Y - 19}`} stroke="#10B981" strokeWidth="1.5" fill="none" opacity="0.65" />
            <path d={`M ${outerRightX + 62},${GAUGE_CENTER_Y - 19} A 22,22 0 0,1 ${outerRightX + 67.5},${GAUGE_CENTER_Y - 11.5}`} stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.65" />

            {/* Tick marks */}
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#EF4444" strokeWidth="1.3" transform={`rotate(-120, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#EF4444" strokeWidth="1.3" transform={`rotate(-100, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#F59E0B" strokeWidth="1.3" transform={`rotate(-80, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#F59E0B" strokeWidth="1.3" transform={`rotate(-60, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#10B981" strokeWidth="1.3" transform={`rotate(-40, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#10B981" strokeWidth="1.3" transform={`rotate(-20, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#10B981" strokeWidth="1.3" transform={`rotate(0, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#10B981" strokeWidth="1.3" transform={`rotate(20, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#10B981" strokeWidth="1.3" transform={`rotate(40, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#F59E0B" strokeWidth="1.3" transform={`rotate(60, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#F59E0B" strokeWidth="1.3" transform={`rotate(80, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#EF4444" strokeWidth="1.3" transform={`rotate(100, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
            <line x1={outerRightX + 48} y1={GAUGE_CENTER_Y - 23} x2={outerRightX + 48} y2={GAUGE_CENTER_Y - 19} stroke="#EF4444" strokeWidth="1.3" transform={`rotate(120, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`} />
 
            <text x={outerRightX + 48} y={GAUGE_CENTER_Y - 7} fill="#64748B" fontSize="4.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PSI</text>
 
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y + 11} r="2.2" fill={gaugeStatus.color} className={gaugeStatus.glowClass} style={{ transition: 'fill 0.3s ease' }} />
            <text x={outerRightX + 48} y={GAUGE_CENTER_Y + 18} fill={gaugeStatus.color} fontSize="4.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="0.2" style={{ transition: 'fill 0.3s ease' }}>{gaugeStatus.label}</text>
 
            <path 
              d={`M ${outerRightX + 48},${GAUGE_CENTER_Y} L ${outerRightX + 48},${GAUGE_CENTER_Y - 20}`} 
              stroke={gaugeStatus.color} 
              strokeWidth="2.0" 
              strokeLinecap="round" 
              transform={`rotate(${gaugeAngle}, ${outerRightX + 48}, ${GAUGE_CENTER_Y})`}
              style={{ transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease' }}
            />
 
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y} r="3.2" fill="#F59E0B" stroke="#92400E" strokeWidth="0.5" />
            <circle cx={outerRightX + 48} cy={GAUGE_CENTER_Y} r="1" fill="#FFFFFF" />
          </g>
        )}

        {/* Specular highlights & reflections */}
        <g id="glass-specular-highlights" pointerEvents="none">
          <path
            d={openOuterPathStrokeD}
            stroke={`url(#tankOutlineGradient-${idSuffix})`}
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Flat Glass Diagonal Sheen & Glares */}
          <g id="glass-diagonal-sheen" clipPath={`url(#tank-inner-${idSuffix})`}>
            {/* Primary soft broad diagonal glare */}
            <path
              d={`M ${outerLeftX - 40},${TANK_CYLINDER_Y1} L ${outerLeftX + 30},${TANK_CYLINDER_Y1} L ${outerRightX - 30},${TANK_CYLINDER_Y2} L ${outerRightX - 100},${TANK_CYLINDER_Y2} Z`}
              fill={`url(#diagonalGlareGradient-${idSuffix})`}
              opacity="0.3"
            />
            {/* Secondary sharper diagonal glare */}
            <path
              d={`M ${outerLeftX + 50},${TANK_CYLINDER_Y1} L ${outerLeftX + 70},${TANK_CYLINDER_Y1} L ${outerRightX + 10},${TANK_CYLINDER_Y2} L ${outerRightX - 10},${TANK_CYLINDER_Y2} Z`}
              fill={`url(#diagonalGlareGradient-${idSuffix})`}
              opacity="0.45"
            />
          </g>

          <g opacity="0.32">
            <line x1={outerLeftX} y1={ribY1} x2={outerRightX} y2={ribY1} stroke="#0F766E" strokeWidth="1.8" />
            <line x1={outerLeftX} y1={ribY1 + 1} x2={outerRightX} y2={ribY1 + 1} stroke="#FFFFFF" strokeWidth="1" opacity="0.75" />

            <line x1={outerLeftX} y1={ribY2} x2={outerRightX} y2={ribY2} stroke="#0F766E" strokeWidth="1.8" />
            <line x1={outerLeftX} y1={ribY2 + 1} x2={outerRightX} y2={ribY2 + 1} stroke="#FFFFFF" strokeWidth="1" opacity="0.75" />

            <line x1={outerLeftX} y1={ribY3} x2={outerRightX} y2={ribY3} stroke="#0F766E" strokeWidth="1.8" />
            <line x1={outerLeftX} y1={ribY3 + 1} x2={outerRightX} y2={ribY3 + 1} stroke="#FFFFFF" strokeWidth="1" opacity="0.75" />
          </g>

          <path d={`M ${outerLeftX + 3.5},${TANK_CYLINDER_Y1 + 5} L ${outerLeftX + 3.5},${TANK_CYLINDER_Y2 - 5}`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          <path d={`M ${outerLeftX + 6.5},${TANK_CYLINDER_Y1 + 20} L ${outerLeftX + 6.5},${TANK_CYLINDER_Y2 - 20}`} stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
          <path d={`M ${outerRightX - 3.5},${TANK_CYLINDER_Y1 + 5} L ${outerRightX - 3.5},${TANK_CYLINDER_Y2 - 5}`} stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
};

export { CentralWaterTank as WaterTank };
export default CentralWaterTank;
