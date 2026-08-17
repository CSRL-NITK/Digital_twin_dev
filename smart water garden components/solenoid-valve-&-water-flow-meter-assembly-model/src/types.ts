export type ViewMode = 'twin' | 'cad' | 'fluid' | 'exploded';

export type AssemblyComponentId = 
  | 'inlet'
  | 'solenoid_body'
  | 'solenoid_coil'
  | 'solenoid_lower'
  | 'pvc_connector'
  | 'flow_meter_housing'
  | 'flow_meter_turbine'
  | 'flow_meter_base'
  | 'pipe_extension'
  | 'bronze_elbow'
  | 'outlet';

export interface AssemblyComponentSpec {
  id: AssemblyComponentId;
  name: string;
  category: 'Valves' | 'Sensors' | 'Piping' | 'Fittings' | 'Wiring';
  shortDesc: string;
  material: string;
  dimensions: string;
  operatingTemp: string;
  pressureRating: string;
  voltageOrOutput?: string;
  details: string[];
  pinout?: { pin: string; function: string }[];
}

export interface TelemetryData {
  valveState: boolean; // true = OPEN, false = CLOSED
  flowRateLmin: number; // 0 to 30 L/min
  inletPressureBar: number; // 0.5 to 8 Bar
  pulseFrequencyHz: number; // Hall effect pulses/sec
  totalVolumeLiters: number;
  solenoidCurrentmA: number;
  waterTempC: number;
  turbineRpm: number;
}
