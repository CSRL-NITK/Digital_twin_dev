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
  idSuffix?: string;
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

// Wave speed durations (seconds)
const WAVE_SPEED_SLOW = { front: '13s', mid: '10s', back: '16s' };
const WAVE_SPEED_MEDIUM = { front: '7.5s', mid: '5.5s', back: '9.5s' };
const WAVE_SPEED_FAST = { front: '3.8s', mid: '2.8s', back: '5s' };

export const WaterTank: React.FC<WaterTankProps> = ({
  fillPercentage,
  isFilling,
  isDraining,
  waveSpeed,
  waveHeight,
  temperature,
  waveHeightCalm = 4.5,
  waveHeightNormal = 11,
  waveHeightActive = 17,
  tempThreshold = 55.0,
  tempMaxThreshold = 75.0,
  idSuffix = 'default',
}) => {
  // Constrain fill percentage
  const clampedFill = Math.max(0, Math.min(100, fillPercentage));

  // TANK GEOMETRY CONSTANTS
  const TANK_WIDTH = 280;          // Total outer width
  const TANK_HEIGHT = 320;         // Cylinder height

  // FLUID DYNAMICS & THERMAL SETTINGS
  // Wave amplitudes (px) for different waveHeight states
  const WAVE_HEIGHT_CALM = waveHeightCalm;
  const WAVE_HEIGHT_NORMAL = waveHeightNormal;
  const WAVE_HEIGHT_ACTIVE = waveHeightActive;

    // Water Color & Thermal Temperature Thresholds
  const TEMP_THRESHOLD = tempThreshold;            // Temperature (°C) where water starts changing to warm color & boiling starts
  const TEMP_MAX_THRESHOLD = tempMaxThreshold;        // Temperature (°C) where water is completely warm & boiling is at max


  // Derived layout and positioning coordinates
  const TANK_CENTER_X = 200;       // Center of the tank in the SVG
  const TANK_CYLINDER_Y1 = 300 - TANK_HEIGHT / 2; // Top of cylindrical body
  const TANK_CYLINDER_Y2 = 300 + TANK_HEIGHT / 2; // Bottom of cylindrical body

  const TANK_OUTER_RADIUS_X = TANK_WIDTH / 2;
  const TANK_OUTER_RADIUS_Y = TANK_WIDTH * (40 / 180); // Curvature depth scaling with width

  const TANK_INNER_RADIUS_X = TANK_OUTER_RADIUS_X - 4; // Accounting for 4px wall thickness
  const TANK_INNER_RADIUS_Y = Math.max(2, TANK_OUTER_RADIUS_Y - 4);

  const INLET_CENTER_X = TANK_CENTER_X - TANK_OUTER_RADIUS_X * (40 / 90); // X-coord of the inlet stream

  // Dynamic viewBox margins to prevent any component clipping on the sides
  const viewBoxMargin = TANK_OUTER_RADIUS_X + 90;
  const viewBoxX = TANK_CENTER_X - viewBoxMargin;
  const viewBoxWidth = viewBoxMargin * 2;

  const outerLeftX = TANK_CENTER_X - TANK_OUTER_RADIUS_X;
  const outerRightX = TANK_CENTER_X + TANK_OUTER_RADIUS_X;
  const innerLeftX = TANK_CENTER_X - TANK_INNER_RADIUS_X;
  const innerRightX = TANK_CENTER_X + TANK_INNER_RADIUS_X;

  const inletPipeStartX = outerLeftX - 10;

  // Water volume height limits:
  const Y_TOP = TANK_CYLINDER_Y1 - TANK_INNER_RADIUS_Y; // Full level
  const Y_BOTTOM = TANK_CYLINDER_Y2 + TANK_INNER_RADIUS_Y; // Empty level
  const Y_SPAN = Y_BOTTOM - Y_TOP;

  // Current water level Y-coordinate
  const Y_water = Y_BOTTOM - Y_SPAN * (clampedFill / 100);

  // Dynamic path shapes
  const innerPathD = `M ${innerLeftX},${TANK_CYLINDER_Y1} A ${TANK_INNER_RADIUS_X},${TANK_INNER_RADIUS_Y} 0 0,1 ${innerRightX},${TANK_CYLINDER_Y1} L ${innerRightX},${TANK_CYLINDER_Y2} A ${TANK_INNER_RADIUS_X},${TANK_INNER_RADIUS_Y} 0 0,1 ${innerLeftX},${TANK_CYLINDER_Y2} Z`;
  const outerPathD = `M ${outerLeftX},${TANK_CYLINDER_Y1} A ${TANK_OUTER_RADIUS_X},${TANK_OUTER_RADIUS_Y} 0 0,1 ${outerRightX},${TANK_CYLINDER_Y1} L ${outerRightX},${TANK_CYLINDER_Y2} A ${TANK_OUTER_RADIUS_X},${TANK_OUTER_RADIUS_Y} 0 0,1 ${outerLeftX},${TANK_CYLINDER_Y2} Z`;

  // Calculated support leg geometry
  const legOL_x1 = TANK_CENTER_X - 0.84 * TANK_OUTER_RADIUS_X;
  const legOL_y1 = TANK_CYLINDER_Y2 + 15;
  const legOL_x2 = TANK_CENTER_X - 0.98 * TANK_OUTER_RADIUS_X;
  const legOL_y2 = 552;
  const legOL_x3 = TANK_CENTER_X - 0.82 * TANK_OUTER_RADIUS_X;
  const legOL_x4 = TANK_CENTER_X - 0.75 * TANK_OUTER_RADIUS_X;
  const legOL_y4 = TANK_CYLINDER_Y2 + 22;

  const legOR_x1 = TANK_CENTER_X + 0.84 * TANK_OUTER_RADIUS_X;
  const legOR_y1 = TANK_CYLINDER_Y2 + 15;
  const legOR_x2 = TANK_CENTER_X + 0.98 * TANK_OUTER_RADIUS_X;
  const legOR_y2 = 552;
  const legOR_x3 = TANK_CENTER_X + 0.82 * TANK_OUTER_RADIUS_X;
  const legOR_x4 = TANK_CENTER_X + 0.75 * TANK_OUTER_RADIUS_X;
  const legOR_y4 = TANK_CYLINDER_Y2 + 22;

  const legIL_x1 = TANK_CENTER_X - 0.46 * TANK_OUTER_RADIUS_X;
  const legIL_x2 = TANK_CENTER_X - 0.38 * TANK_OUTER_RADIUS_X;
  const legIR_x1 = TANK_CENTER_X + 0.46 * TANK_OUTER_RADIUS_X;
  const legIR_x2 = TANK_CENTER_X + 0.38 * TANK_OUTER_RADIUS_X;
  const legI_y1 = TANK_CYLINDER_Y2 + 28;
  const legI_y2 = TANK_CYLINDER_Y2 + 31;

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

  // Glossy reflection paths
  const topReflectionD = `M ${TANK_CENTER_X - 75 * (TANK_OUTER_RADIUS_X / 90)},${TANK_CYLINDER_Y1 - 16 * (TANK_OUTER_RADIUS_Y / 40)} A ${80 * (TANK_OUTER_RADIUS_X / 90)},${30 * (TANK_OUTER_RADIUS_Y / 40)} 0 0,1 ${TANK_CENTER_X + 75 * (TANK_OUTER_RADIUS_X / 90)},${TANK_CYLINDER_Y1 - 16 * (TANK_OUTER_RADIUS_Y / 40)}`;
  const bottomReflectionD = `M ${TANK_CENTER_X - 65 * (TANK_OUTER_RADIUS_X / 90)},${TANK_CYLINDER_Y2 + 16 * (TANK_OUTER_RADIUS_Y / 40)} A ${70 * (TANK_OUTER_RADIUS_X / 90)},${28 * (TANK_OUTER_RADIUS_Y / 40)} 0 0,0 ${TANK_CENTER_X + 65 * (TANK_OUTER_RADIUS_X / 90)},${TANK_CYLINDER_Y2 + 16 * (TANK_OUTER_RADIUS_Y / 40)}`;

  // Outlet spout path
  const spoutCurveD = `M ${outerRightX + 40},${TANK_CYLINDER_Y2 - 24} L ${outerRightX + 53},${TANK_CYLINDER_Y2 - 24} A 10,10 0 0,1 ${outerRightX + 63},${TANK_CYLINDER_Y2 - 14} L ${outerRightX + 63},${TANK_CYLINDER_Y2 + 4} L ${outerRightX + 53},${TANK_CYLINDER_Y2 + 4} L ${outerRightX + 53},${TANK_CYLINDER_Y2 - 14} A 2,2 0 0,0 ${outerRightX + 51},${TANK_CYLINDER_Y2 - 16} L ${outerRightX + 40},${TANK_CYLINDER_Y2 - 16} Z`;

  // Hatch and nozzle Y coordinates
  const HATCH_BASE_Y = TANK_CYLINDER_Y1 - TANK_OUTER_RADIUS_Y;
  const INLET_NOZZLE_Y = TANK_CYLINDER_Y1 - TANK_OUTER_RADIUS_Y + 12;

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
      className="relative w-full select-none filter drop-shadow-2xl"
      style={{ aspectRatio: `${viewBoxWidth} / 600`, willChange: 'transform', transform: 'translateZ(0)' }}
    >
      <svg
        id="water-tank-svg"
        viewBox={`${viewBoxX} 0 ${viewBoxWidth} 600`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ willChange: 'transform' }}
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
          `}
        </style>

        {/* SVG Defs & Gradients */}
        <defs>
          {/* Inner Tank Clip Path */}
          <clipPath id={`tank-inner-${idSuffix}`}>
            <path d={innerPathD} />
          </clipPath>

          {/* Water level clip path */}
          <clipPath id={`water-level-clip-${idSuffix}`}>
            <rect x={outerLeftX - 10} y={Y_water} width={TANK_WIDTH + 20} height={Y_BOTTOM - Y_water + 20} />
          </clipPath>

          {/* Glass Shell Gradient */}
          <linearGradient id={`glassGradient-${idSuffix}`} x1={outerLeftX} y1={(TANK_CYLINDER_Y1 + TANK_CYLINDER_Y2) / 2} x2={outerRightX} y2={(TANK_CYLINDER_Y1 + TANK_CYLINDER_Y2) / 2} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.25" />
            <stop offset="20%" stopColor="#0F766E" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="80%" stopColor="#0F766E" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.32" />
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
            <stop offset="0%" stopColor={waterColors.frontTop} stopOpacity="0.92" />
            <stop offset="100%" stopColor={waterColors.frontBottom} stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id={`waterGradientMiddle-${idSuffix}`} x1={TANK_CENTER_X} y1={Y_TOP} x2={TANK_CENTER_X} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={waterColors.midTop} stopOpacity="0.72" />
            <stop offset="100%" stopColor={waterColors.midBottom} stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id={`waterGradientBack-${idSuffix}`} x1={TANK_CENTER_X} y1={Y_TOP} x2={TANK_CENTER_X} y2={Y_BOTTOM} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={waterColors.backTop} stopOpacity="0.52" />
            <stop offset="100%" stopColor={waterColors.backBottom} stopOpacity="0.68" />
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
            <stop offset="0%" stopColor={waterColors.streamStart} stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.98" />
            <stop offset="100%" stopColor={waterColors.streamEnd} stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={`waterStreamShimmer-${idSuffix}`} x1={INLET_CENTER_X - 7} y1="0" x2={INLET_CENTER_X + 7} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.35" />
          </linearGradient>

          {/* Gauge Dial Face Gradient */}
          <radialGradient id={`gaugeFace-${idSuffix}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Supporting legs */}
        <g id="tank-legs">
          <path d={`M ${legOL_x1},${legOL_y1} L ${legOL_x2},${legOL_y2} L ${legOL_x3},${legOL_y2} L ${legOL_x4},${legOL_y4} Z`} fill={`url(#metalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
          <path d={`M ${legOR_x1},${legOR_y1} L ${legOR_x2},${legOR_y2} L ${legOR_x3},${legOR_y2} L ${legOR_x4},${legOR_y4} Z`} fill={`url(#metalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
          
          <path d={`M ${legIL_x1},${legI_y1} L ${legIL_x1},552 L ${legIL_x2},552 L ${legIL_x2},${legI_y2} Z`} fill="#334155" opacity="0.9" />
          <path d={`M ${legIR_x1},${legI_y1} L ${legIR_x1},552 L ${legIR_x2},552 L ${legIR_x2},${legI_y2} Z`} fill="#1E293B" opacity="0.95" />

          {/* Anchor plates & bolts */}
          <rect x={legOL_x2 - 4} y="552" width="22" height="5" rx="1.5" fill="#94A3B8" stroke="#334155" strokeWidth="0.5" />
          <rect x={legIL_x1 - 6} y="552" width="18" height="5" rx="1.5" fill="#64748B" />
          <rect x={legIR_x2 - 4} y="552" width="18" height="5" rx="1.5" fill="#475569" />
          <rect x={legOR_x3 - 4} y="552" width="22" height="5" rx="1.5" fill="#94A3B8" stroke="#334155" strokeWidth="0.5" />

          <circle cx={legOL_x2 + 0.5} cy="554.5" r="1.8" fill="#1E293B" />
          <circle cx={legOL_x3 - 0.5} cy="554.5" r="1.8" fill="#1E293B" />
          <circle cx={legOR_x3 + 4.5} cy="554.5" r="1.8" fill="#1E293B" />
          <circle cx={legOR_x2 - 0.5} cy="554.5" r="1.8" fill="#1E293B" />
        </g>

        {/* Piping system (connected behind the tank) */}
        <g id="background-piping">
          {/* Inlet Pipe Elbow */}
          <path
            d={`M ${inletPipeStartX},70 L ${INLET_CENTER_X - 12},70 A 12,12 0 0,1 ${INLET_CENTER_X},82 L ${INLET_CENTER_X},${INLET_NOZZLE_Y}`}
            stroke={`url(#metalVerticalGradient-${idSuffix})`}
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />
          {/* Flange plate & bolts */}
          <rect x={INLET_CENTER_X - 15} y={INLET_NOZZLE_Y - 7} width="30" height="7" rx="2" fill="#94A3B8" stroke="#334155" strokeWidth="0.75" />
          <circle cx={INLET_CENTER_X - 10} cy={INLET_NOZZLE_Y - 3.5} r="1.2" fill="#1E293B" />
          <circle cx={INLET_CENTER_X} cy={INLET_NOZZLE_Y - 3.5} r="1.2" fill="#1E293B" />
          <circle cx={INLET_CENTER_X + 10} cy={INLET_NOZZLE_Y - 3.5} r="1.2" fill="#1E293B" />

          {/* Overflow pipe */}
          <path
            d={`M ${outerLeftX + 2},${TANK_CYLINDER_Y1 + 40} L ${outerLeftX - 26},${TANK_CYLINDER_Y1 + 40} A 10,10 0 0,0 ${outerLeftX - 36},${TANK_CYLINDER_Y1 + 50} L ${outerLeftX - 36},${TANK_CYLINDER_Y1 + 130}`}
            stroke={`url(#metalVerticalGradient-${idSuffix})`}
            strokeWidth="9"
            fill="none"
          />
          <rect x={outerLeftX - 41} y={TANK_CYLINDER_Y1 + 130} width="10" height="4" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />
        </g>

        {/* Bottom center drain plug */}
        <g id="bottom-center-plug">
          <rect x={TANK_CENTER_X - 7} y={Y_BOTTOM - 1} width="14" height="12" fill={`url(#metalVerticalGradient-${idSuffix})`} />
          <rect x={TANK_CENTER_X - 14} y={Y_BOTTOM + 6} width="28" height="6" rx="1.5" fill="#64748B" stroke="#1E293B" strokeWidth="0.75" />
          <circle cx={TANK_CENTER_X - 8} cy={Y_BOTTOM + 9} r="1.2" fill="#1E293B" />
          <circle cx={TANK_CENTER_X} cy={Y_BOTTOM + 9} r="1.2" fill="#1E293B" />
          <circle cx={TANK_CENTER_X + 8} cy={Y_BOTTOM + 9} r="1.2" fill="#1E293B" />
        </g>

        {/* Tank transparent background glass shell */}
        <path
          id="tank-shell-bg"
          d={outerPathD}
          fill={`url(#glassGradient-${idSuffix})`}
        />

        {/* Thermal convection background glow */}
        {clampedFill > 0 && thermalIntensity > 0 && (
          <g id={`thermal-backdrop-layer-${idSuffix}`} clipPath={`url(#tank-inner-${idSuffix})`} className="thermal-glow-convection" style={{ mixBlendMode: 'screen' }}>
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
          <g id={`animated-water-${idSuffix}`} clipPath={`url(#tank-inner-${idSuffix})`}>
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
            <g id={`water-bubbles-${idSuffix}`} clipPath={`url(#water-level-clip-${idSuffix})`}>
              <circle cx="0" cy="0" r="3.2" fill="#FFFFFF" opacity="0.65" className="bubble-1" />
              <circle cx="0" cy="0" r="2.0" fill="#FFFFFF" opacity="0.50" className="bubble-2" />
              <circle cx="0" cy="0" r="4.2" fill="#FFFFFF" opacity="0.75" className="bubble-3" />
              
              <circle cx="0" cy="0" r="1.5" fill="#E0F2FE" opacity="0.45" className="bubble-slow" />
              <circle cx="0" cy="0" r="2.8" fill="#A5F3FC" opacity="0.60" className="bubble-slow" style={{ animationDelay: '2.5s' }} />

              {(isFilling || isDraining) && (
                <>
                  <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" opacity="0.80" className="bubble-fast" />
                  <circle cx="0" cy="0" r="3.5" fill="#22D3EE" opacity="0.70" className="bubble-fast" style={{ animationDelay: '1.1s' }} />
                  <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" opacity="0.85" className="bubble-fast" style={{ animationDelay: '1.9s' }} />
                </>
              )}
            </g>
          </g>
        )}

        {/* Outlet piping assembly */}
        <g id="outlet-pipe-assembly">
          <rect x={outerRightX - 6} y={TANK_CYLINDER_Y2 - 35} width="7" height="30" rx="1.5" fill="#CBD5E1" stroke="#334155" strokeWidth="0.5" />
          <circle cx={outerRightX - 2.5} cy={TANK_CYLINDER_Y2 - 31} r="1.1" fill="#1E293B" />
          <circle cx={outerRightX - 2.5} cy={TANK_CYLINDER_Y2 - 20} r="1.1" fill="#1E293B" />
          <circle cx={outerRightX - 2.5} cy={TANK_CYLINDER_Y2 - 9} r="1.1" fill="#1E293B" />

          <rect x={outerRightX + 1} y={TANK_CYLINDER_Y2 - 28} width="42" height="16" fill={`url(#metalVerticalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />

          <path
            d={`M ${outerRightX + 40},${TANK_CYLINDER_Y2 - 28} L ${outerRightX + 54},${TANK_CYLINDER_Y2 - 28} A 12,12 0 0,1 ${outerRightX + 66},${TANK_CYLINDER_Y2 - 16} L ${outerRightX + 66},${TANK_CYLINDER_Y2 + 4} L ${outerRightX + 50},${TANK_CYLINDER_Y2 + 4} L ${outerRightX + 50},${TANK_CYLINDER_Y2 - 12} A 4,4 0 0,0 ${outerRightX + 46},${TANK_CYLINDER_Y2 - 16} L ${outerRightX + 40},${TANK_CYLINDER_Y2 - 16} Z`}
            fill={`url(#metalVerticalGradient-${idSuffix})`}
            stroke="#1E293B"
            strokeWidth="0.5"
          />

          <rect x={outerRightX + 48} y={TANK_CYLINDER_Y2 + 4} width="20" height="4" rx="1" fill="#94A3B8" stroke="#1E293B" strokeWidth="0.5" />

          {/* Integrated valve handwheel */}
          <rect x={outerRightX + 29} y={TANK_CYLINDER_Y2 - 42} width="6" height="14" fill={`url(#metalVerticalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
          <rect x={outerRightX + 25} y={TANK_CYLINDER_Y2 - 36} width="14" height="4" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />

          <g className={isDraining ? 'valve-wheel-active' : ''}>
            <rect x={outerRightX + 16} y={TANK_CYLINDER_Y2 - 48} width="32" height="4" rx="1.5" fill="#94A3B8" stroke="#1E293B" strokeWidth="0.5" />
            <circle cx={outerRightX + 16} cy={TANK_CYLINDER_Y2 - 46} r="5" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
            <circle cx={outerRightX + 48} cy={TANK_CYLINDER_Y2 - 46} r="5" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
            <circle cx={outerRightX + 32} cy={TANK_CYLINDER_Y2 - 46} r="2.5" fill="#F59E0B" />
            <circle cx={outerRightX + 32} cy={TANK_CYLINDER_Y2 - 46} r="0.8" fill="#FFFFFF" />
          </g>

          {/* Fluid flow inside pipes */}
          {isDraining && clampedFill > 1 && (
            <g id="outlet-flow-core">
              <rect x={outerRightX - 2} y={TANK_CYLINDER_Y2 - 24} width="44" height="8" fill={`url(#waterGradientFront-${idSuffix})`} opacity="0.92" />
              <path
                d={spoutCurveD}
                fill={`url(#waterGradientFront-${idSuffix})`}
                opacity="0.92"
              />

              <line
                x1={outerRightX - 2}
                y1={TANK_CYLINDER_Y2 - 20}
                x2={outerRightX + 42}
                y2={TANK_CYLINDER_Y2 - 20}
                stroke="#67E8F9"
                strokeWidth="2.5"
                strokeDasharray="6, 8"
                className="drain-pipe-flow"
              />
            </g>
          )}
        </g>

        {/* Pour water stream */}
        {isDraining && clampedFill > 1 && (
          <g id="right-drain-stream">
            <rect
              x={outerRightX + 53}
              y={TANK_CYLINDER_Y2 + 8}
              width="10"
              height={Math.max(0, 552 - (TANK_CYLINDER_Y2 + 8))}
              fill={`url(#waterStreamGradient-${idSuffix})`}
              opacity="0.92"
            />
            <line
              x1={outerRightX + 58}
              y1={TANK_CYLINDER_Y2 + 8}
              x2={outerRightX + 58}
              y2="550"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="8, 12"
              className="fill-stream-flow"
              opacity="0.8"
            />

            {/* Splash group on ground */}
            <g id="drain-splash-group" transform={`translate(${outerRightX + 58}, 552)`} opacity="0.85">
              <ellipse cx="0" cy="0" rx="4" ry="1.2" stroke="#22D3EE" fill="none" className="splash-ripple" />
              <ellipse cx="0" cy="0" rx="4" ry="1.2" stroke="#FFFFFF" fill="none" className="splash-ripple" style={{ animationDelay: '0.3s' }} />
              <ellipse cx="0" cy="0" rx="4" ry="1.2" stroke="#0D9488" fill="none" className="splash-ripple" style={{ animationDelay: '0.6s' }} />

              <circle cx="0" cy="0" r="3.0" fill="#22D3EE" className="splash-left" />
              <circle cx="0" cy="0" r="2.2" fill="#E0F2FE" className="splash-right" />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" className="splash-high" />
              
              <circle cx="0" cy="0" r="2.5" fill="#E0F2FE" className="splash-left" style={{ animationDelay: '0.2s' }} />
              <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" className="splash-right" style={{ animationDelay: '0.3s' }} />
              <circle cx="0" cy="0" r="2.8" fill="#22D3EE" className="splash-high" style={{ animationDelay: '0.1s' }} />
            </g>
          </g>
        )}

        {/* Inlet pour stream */}
        {isFilling && Y_water > INLET_NOZZLE_Y && (
          <g id="inlet-pour-stream" style={{ pointerEvents: 'none' }}>
            <rect
              x={INLET_CENTER_X - 9}
              y={INLET_NOZZLE_Y}
              width="18"
              height={Math.max(0, Y_water - INLET_NOZZLE_Y)}
              fill={`url(#waterStreamShimmer-${idSuffix})`}
              className="shimmer-pulse"
              opacity="0.4"
            />

            <rect
              x={INLET_CENTER_X - 5}
              y={INLET_NOZZLE_Y}
              width="10"
              height={Math.max(0, Y_water - INLET_NOZZLE_Y)}
              fill={`url(#waterStreamGradient-${idSuffix})`}
              opacity="0.95"
              rx="3"
            />

            <line
              x1={INLET_CENTER_X - 2.5}
              y1={INLET_NOZZLE_Y}
              x2={INLET_CENTER_X - 2.5}
              y2={Y_water}
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeDasharray="15, 20"
              className="fill-stream-fast"
              opacity="0.85"
            />

            <line
              x1={INLET_CENTER_X}
              y1={INLET_NOZZLE_Y}
              x2={INLET_CENTER_X}
              y2={Y_water}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray="10, 15"
              className="fill-stream-super"
              opacity="0.95"
            />

            <line
              x1={INLET_CENTER_X + 2.5}
              y1={INLET_NOZZLE_Y}
              x2={INLET_CENTER_X + 2.5}
              y2={Y_water}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="20, 25"
              className="fill-stream-fast"
              opacity="0.75"
            />

            <ellipse
              cx={INLET_CENTER_X}
              cy={INLET_NOZZLE_Y}
              rx="12"
              ry="5"
              fill={`url(#waterStreamGradient-${idSuffix})`}
              className="nozzle-spray"
              opacity="0.9"
            />
            <ellipse
              cx={INLET_CENTER_X}
              cy={INLET_NOZZLE_Y}
              rx="7"
              ry="3"
              fill="#FFFFFF"
              className="nozzle-spray"
              style={{ animationDelay: '0.3s' }}
              opacity="0.95"
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

        {/* Overflow drain stream */}
        {clampedFill > 95.5 && (
          <g id="overflow-stream">
            <rect
              x={outerLeftX - 38}
              y={TANK_CYLINDER_Y1 + 130}
              width="4.5"
              height={Math.max(0, 552 - (TANK_CYLINDER_Y1 + 130))}
              fill={`url(#waterStreamGradient-${idSuffix})`}
              opacity="0.85"
            />
            <line
              x1={outerLeftX - 35.8}
              y1={TANK_CYLINDER_Y1 + 130}
              x2={outerLeftX - 35.8}
              y2="550"
              stroke="#E0F2FE"
              strokeWidth="2"
              strokeDasharray="4, 7"
              className="fill-stream-flow"
              opacity="0.70"
            />
          </g>
        )}

        {/* Top & Bottom Seam collars */}
        <g id="heavy-seam-collars" opacity="0.95">
          <path d={`M ${outerLeftX},${TANK_CYLINDER_Y1} A ${TANK_OUTER_RADIUS_X},14 0 0,0 ${outerRightX},${TANK_CYLINDER_Y1}`} stroke={`url(#metalGradient-${idSuffix})`} strokeWidth="6.5" fill="none" />
          {topCollarBolts.map((bolt, idx) => (
            <circle key={`top-bolt-${idx}`} cx={bolt.cx} cy={bolt.cy} r="1.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="0.5" />
          ))}

          <path d={`M ${outerLeftX},${TANK_CYLINDER_Y2} A ${TANK_OUTER_RADIUS_X},14 0 0,0 ${outerRightX},${TANK_CYLINDER_Y2}`} stroke={`url(#metalGradient-${idSuffix})`} strokeWidth="6.5" fill="none" />
          {bottomCollarBolts.map((bolt, idx) => (
            <circle key={`bottom-bolt-${idx}`} cx={bolt.cx} cy={bolt.cy} r="1.5" fill="#1E293B" stroke="#E2E8F0" strokeWidth="0.5" />
          ))}
        </g>

        {/* Analog pressure gauge */}
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

        {/* Specular highlights & reflections */}
        <g id="glass-specular-highlights" pointerEvents="none">
          <path
            d={outerPathD}
            stroke={`url(#tankOutlineGradient-${idSuffix})`}
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <g opacity="0.32">
            <path d={`M ${outerLeftX},${ribY1} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY1}`} stroke="#0F766E" strokeWidth="1.8" fill="none" />
            <path d={`M ${outerLeftX},${ribY1 + 1} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY1 + 1}`} stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.75" />

            <path d={`M ${outerLeftX},${ribY2} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY2}`} stroke="#0F766E" strokeWidth="1.8" fill="none" />
            <path d={`M ${outerLeftX},${ribY2 + 1} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY2 + 1}`} stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.75" />

            <path d={`M ${outerLeftX},${ribY3} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY3}`} stroke="#0F766E" strokeWidth="1.8" fill="none" />
            <path d={`M ${outerLeftX},${ribY3 + 1} A ${TANK_OUTER_RADIUS_X},16 0 0,0 ${outerRightX},${ribY3 + 1}`} stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.75" />
          </g>

          <path d={`M ${outerLeftX + 3.5},${TANK_CYLINDER_Y1 + 5} L ${outerLeftX + 3.5},${TANK_CYLINDER_Y2 - 5}`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          <path d={`M ${outerLeftX + 6.5},${TANK_CYLINDER_Y1 + 20} L ${outerLeftX + 6.5},${TANK_CYLINDER_Y2 - 20}`} stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.2" />

          <path d={`M ${outerRightX - 3.5},${TANK_CYLINDER_Y1 + 5} L ${outerRightX - 3.5},${TANK_CYLINDER_Y2 - 5}`} stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />

          <path d={topReflectionD} stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" opacity="0.25" fill="none" />
          <path d={bottomReflectionD} stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.2" fill="none" />

          {/* Top inspection hatch */}
          <g id="inspection-hatch">
            <rect x={TANK_CENTER_X - 18} y={HATCH_BASE_Y - 6} width="36" height="6" fill={`url(#metalVerticalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
            <rect x={TANK_CENTER_X - 23} y={HATCH_BASE_Y - 12} width="46" height="6" rx="1.5" fill={`url(#metalGradient-${idSuffix})`} stroke="#1E293B" strokeWidth="0.5" />
            
            <rect x={TANK_CENTER_X - 17} y={HATCH_BASE_Y - 17} width="5" height="5" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />
            <rect x={TANK_CENTER_X + 12} y={HATCH_BASE_Y - 17} width="5" height="5" rx="1" fill="#475569" stroke="#1E293B" strokeWidth="0.5" />
            <path d={`M ${TANK_CENTER_X - 6},${HATCH_BASE_Y - 12} A 6,6 0 0,1 ${TANK_CENTER_X + 6},${HATCH_BASE_Y - 12}`} stroke="#64748B" strokeWidth="2" fill="none" />
          </g>
        </g>
      </svg>
    </div>
  );
};
