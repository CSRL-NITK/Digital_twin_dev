export type LayerId =
  | 'solar-panel'
  | 'solar-cells'
  | 'aluminum-frame'
  | 'junction-box'
  | 'pivot-hinge'
  | 'mounting-bracket'
  | 'support-arms'
  | 'u-bolts'
  | 'support-pole'
  | 'base-plate'
  | 'anchor-bolts'
  | 'cables'
  | 'grounding-wire';

export interface LayerConfig {
  id: LayerId;
  name: string;
  description: string;
  visible: boolean;
  opacity: number;
  highlighted: boolean;
  colorOverride?: string;
  category: 'photovoltaic' | 'structure' | 'electrical' | 'mounting';
}

export interface MaterialCustomization {
  cellType: 'mono-blue' | 'obsidian-black' | 'poly-cyan';
  frameFinish: 'brushed-silver' | 'anodized-black' | 'raw-zinc';
  poleFinish: 'galvanized-silver' | 'matte-black' | 'industrial-yellow';
  wireColor: 'standard-green-yellow' | 'all-black' | 'industrial-orange';
}

export interface TelemetryData {
  irradiance: number; // W/m2
  powerOutput: number; // Watts
  voltage: number; // Volts
  current: number; // Amps
  cellTemperature: number; // °C
  efficiency: number; // %
  dailyEnergy: number; // kWh
  sunAngle: number; // degrees (0 to 180)
  tiltAngle: number; // degrees (0 to 90)
  autoTracking?: boolean; // Single-axis tracking active
  trackerStatus?: 'nominal' | 'stowing' | 'manual' | 'cleaning';
  actuatorExtension?: number; // mm
  windSpeed?: number; // km/h
  hydroponicsLoadPumps: number; // W
  hydroponicsLoadFans: number; // W
  hydroponicsLoadDosing: number; // W
  batterySoc: number; // %
}

export type ScadaTheme = 'schneider-dark' | 'siemens-light' | 'victron-navy' | 'abb-slate' | 'cad-blueprint';

export interface TechnicalSpec {
  part: string;
  title: string;
  material: string;
  standard: string;
  details: string;
  x: number;
  y: number;
}
