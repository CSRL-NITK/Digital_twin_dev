export interface ComponentDetail {
  id: string;
  name: string;
  category: 'Enclosure' | 'PCB' | 'Relay' | 'LED' | 'Wiring' | 'Cable' | 'Mounting';
  description: string;
  specifications: Record<string, string>;
  position: { x: number; y: number; width?: number; height?: number };
}

export interface ModelViewState {
  zoom: number;
  pan: { x: number; y: number };
  lidOpacity: number; // 0 to 1
  ledPower: boolean;
  redLedBrightness: number; // 0 to 100
  amberLedBrightness: number; // 0 to 100
  highlightedComponentId: string | null;
  showTraceOverlays: boolean;
  activeMode: 'model' | 'xray' | 'schematic';
  backgroundColor: 'white' | 'neutral' | 'blueprint' | 'dark';
}
