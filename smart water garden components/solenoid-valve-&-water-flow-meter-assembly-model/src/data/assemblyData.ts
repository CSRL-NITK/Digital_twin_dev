import { AssemblyComponentSpec } from '../types';

export const ASSEMBLY_SPECS: Record<string, AssemblyComponentSpec> = {
  inlet: {
    id: 'inlet',
    name: 'Metallic Barbed Threaded Inlet Nozzle',
    category: 'Fittings',
    shortDesc: '1/2" NPT Male Brass / Chrome-plated Inlet Fitting',
    material: 'Forged Brass (C36000) / Chrome Plated',
    dimensions: '68mm x 24mm Ø',
    operatingTemp: '1°C to 80°C',
    pressureRating: '10 Bar (145 PSI) Max',
    details: [
      'Barbed outer ridges for quick-connect high-pressure hose engagement',
      'Hexagonal wrench flat for torque-controlled installation',
      'Internal tapered NPT thread with EPDM O-ring seal'
    ]
  },
  solenoid_body: {
    id: 'solenoid_body',
    name: 'Electromagnetic Solenoid Valve Main Body',
    category: 'Valves',
    shortDesc: '2/2-Way Normally Closed Pilot Diaphragm Valve Body',
    material: 'PA66 Glass Fiber Reinforced Nylon Body, NBR Diaphragm',
    dimensions: '115mm x 62mm x 85mm',
    operatingTemp: '0°C to 65°C',
    pressureRating: '0.02 MPa to 0.8 MPa (0.2 to 8.0 Bar)',
    voltageOrOutput: '12V DC (Pilot Operated)',
    details: [
      'Normally Closed (NC) pilot-operated diaphragm mechanism',
      'Dual threaded cylindrical end couplings with internal alignment tabs',
      'Central brushed spec label showing operating pressure and directional flow arrow',
      'Zero-leak internal rubber plunger seat'
    ]
  },
  solenoid_coil: {
    id: 'solenoid_coil',
    name: 'Solenoid Electromagnetic Actuator Coil',
    category: 'Valves',
    shortDesc: '12V DC IP65 Sealed Electromagnetic Coil Top Housing',
    material: 'Thermoset Epoxy Encapsulated Copper Winding',
    dimensions: '38mm x 32mm Ø',
    operatingTemp: '-10°C to 70°C',
    pressureRating: 'N/A (Electrical Actuator)',
    voltageOrOutput: '12V DC @ 450mA (5.4W)',
    details: [
      'IP65 water-resistant top cap with strain-relief black cable gland',
      'Generates 18N magnetic hold force to lift stainless steel armature plunger',
      'Duty cycle: 100% ED Continuous Operation'
    ],
    pinout: [
      { pin: 'Red Cable (+)', function: '+12V DC Power / MOSFET Driver' },
      { pin: 'Black Cable (-)', function: 'GND Return / Flyback Diode Protected' }
    ]
  },
  solenoid_lower: {
    id: 'solenoid_lower',
    name: 'Lower Auxiliary Drain & Wiring Connector',
    category: 'Wiring',
    shortDesc: 'Bottom Auxiliary Drain Port & Conduit Junction',
    material: 'Anodized Aluminum & High-Density Polyethylene',
    dimensions: '42mm x 22mm Ø',
    operatingTemp: '1°C to 60°C',
    pressureRating: '6 Bar Max',
    details: [
      'Dual-function lower section for secondary electrical conduit routing and manual bleed',
      'White flexible PVC insulated signal sleeve extending downward',
      'Vibration-resistant threaded lock nut'
    ]
  },
  pvc_connector: {
    id: 'pvc_connector',
    name: 'Mid-Assembly Gray PVC Union & Lock Fitting',
    category: 'Piping',
    shortDesc: 'Threaded Gray PVC Coupling with Nitrile Lock Ring',
    material: 'Unplasticized Polyvinyl Chloride (uPVC)',
    dimensions: '55mm x 38mm Outer Ø',
    operatingTemp: '0°C to 50°C',
    pressureRating: '16 Bar PN16 Rated',
    details: [
      'Dual female-to-female threaded sleeve connecting valve to flow meter',
      'Dark rubberized external grip collar for hand tightening',
      'Precision internal stop ridge prevents over-insertion'
    ]
  },
  flow_meter_housing: {
    id: 'flow_meter_housing',
    name: 'Translucent Polycarbonate Flow Meter Chamber',
    category: 'Sensors',
    shortDesc: 'Transparent Cylindrical Turbine Chamber with Sight Cap',
    material: 'Optical Grade Polycarbonate (PC) & UV Stabilizer',
    dimensions: '72mm Ø x 88mm Height',
    operatingTemp: '1°C to 75°C',
    pressureRating: '10 Bar Max Burst',
    details: [
      'High-clarity 360° transparent view dome for visual inspection of water movement',
      'Circular top structural cap with radial reinforcement ribs',
      'Dual O-ring sealing channels at top and bottom flange joints',
      'Subtle internal anti-vortex flow guides'
    ]
  },
  flow_meter_turbine: {
    id: 'flow_meter_turbine',
    name: 'Multi-Blade Internal Magnetic Rotor Assembly',
    category: 'Sensors',
    shortDesc: 'Dark Green Curved-Vane Turbine Rotor with Embedded Magnet',
    material: 'POM (Acetal) Turbine with Stainless Shaft & Ferrite Magnet',
    dimensions: '48mm Rotor Ø, 6 Curved Vanes',
    operatingTemp: '0°C to 80°C',
    pressureRating: 'Low head-loss (< 0.05 Bar @ 15 L/min)',
    voltageOrOutput: '450 Pulses per Liter (K-Factor = 0.45 P/mL)',
    details: [
      'Low-friction ceramic jewel bearings for micro-flow detection down to 0.3 L/min',
      'Integrated permanent neodymium magnet embedded in vane tips',
      'Dark green hydrodynamic curved blades engineered for minimal pressure drop'
    ]
  },
  flow_meter_base: {
    id: 'flow_meter_base',
    name: 'Hall-Effect Flow Sensor Base & Signal Conduit',
    category: 'Sensors',
    shortDesc: 'Bottom Transducer Base with White Cylindrical Stem',
    material: 'PBT Thermoplastic & White Polyurethane Cable',
    dimensions: '35mm Ø x 65mm Length',
    operatingTemp: '-10°C to 70°C',
    pressureRating: 'N/A (External Transducer)',
    voltageOrOutput: '5V - 24V DC Input, NPN Open-Collector Pulse Output',
    details: [
      'Monolithic Hall sensor detects rotating magnetic field from internal turbine',
      'White cylindrical lower connector with waterproof cable gland',
      'High-flex black sensor cable outputting square-wave pulse signal'
    ],
    pinout: [
      { pin: 'Red Wire', function: 'VCC (+5V to +24V DC)' },
      { pin: 'Black Wire', function: 'GND' },
      { pin: 'Yellow/White Wire', function: 'PULSE Output (Square Wave)' }
    ]
  },
  pipe_extension: {
    id: 'pipe_extension',
    name: 'Right-Side Gray PVC Horizontal Pipe Extension',
    category: 'Piping',
    shortDesc: 'Schedule 80 Gray PVC Rigid Conduit Pipe',
    material: 'Schedule 80 Industrial PVC',
    dimensions: '95mm Length x 26.7mm Outer Ø (3/4")',
    operatingTemp: '0°C to 60°C',
    pressureRating: '12 Bar (175 PSI)',
    details: [
      'Smooth internal wall (roughness coefficient C=150) for uniform laminar flow',
      'Solvent-welded junction to flow meter exit manifold'
    ]
  },
  bronze_elbow: {
    id: 'bronze_elbow',
    name: '90-Degree Heavy Bronze / Brass Elbow Junction',
    category: 'Fittings',
    shortDesc: 'Right Angle Female-Female Bronze Pipe Elbow',
    material: 'C83600 Leaded Red Brass / Bronze',
    dimensions: '58mm x 58mm Outer Span',
    operatingTemp: '-20°C to 120°C',
    pressureRating: '25 Bar (360 PSI)',
    details: [
      'Heavy-wall cast bronze elbow with warm metallic patina',
      'Right-angle 90° turn directing discharge vertically downward',
      'Deep female NPT internal threads for high vibration resistance'
    ]
  },
  outlet: {
    id: 'outlet',
    name: 'Downward Vertical Discharge Pipe Outlet',
    category: 'Piping',
    shortDesc: 'Downward Vertical Pipe Spout',
    material: 'Bronze / Gray PVC Composite',
    dimensions: '50mm Vertical Extension x 26mm Ø',
    operatingTemp: '1°C to 80°C',
    pressureRating: 'Atmospheric Discharge',
    details: [
      'Vertical downward orientation for direct manifold or drip line distribution',
      'Beveled bottom edge preventing back-siphon drip accumulation'
    ]
  }
};
