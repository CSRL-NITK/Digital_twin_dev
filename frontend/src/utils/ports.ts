export const NODE_PORTS: Record<string, { outlets: string[]; inlets: string[] }> = {
  tank: {
    outlets: ['outlet-1'],
    inlets: ['inlet-1'],
  },
  central_tank: {
    outlets: ['outlet-1', 'outlet-2'],
    inlets: ['inlet-1', 'inlet-2'],
  },
  source_tank: {
    outlets: ['outlet-1'],
    inlets: [],
  },
  source: {
    outlets: ['outlet-1'],
    inlets: [],
  },
  pump: {
    outlets: ['outlet-1'],
    inlets: ['inlet-1'],
  },
  water_level: {
    outlets: [],
    inlets: [],
  },
  sensor: {
    outlets: [],
    inlets: [],
  },
};
