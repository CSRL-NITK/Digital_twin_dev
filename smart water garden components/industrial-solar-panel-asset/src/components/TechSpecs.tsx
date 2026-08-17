import React from 'react';
import { LayerId } from '../types';
import { Shield, Zap, CheckCircle2, Box, Cpu, Anchor, Wrench } from 'lucide-react';

interface TechSpecsProps {
  selectedLayerId: LayerId | null;
  onSelectLayer: (id: LayerId) => void;
}

interface SpecDetail {
  id: LayerId;
  title: string;
  category: string;
  standards: string;
  material: string;
  specs: { label: string; value: string }[];
  description: string;
}

const SPEC_DATABASE: Record<LayerId, SpecDetail> = {
  'solar-panel': {
    id: 'solar-panel',
    title: '410W Monocrystalline PERC Solar Module',
    category: 'Photovoltaic Laminate',
    standards: 'IEC 61215 / IEC 61730 / UL 61730 Class C',
    material: 'High-Transmittance 3.2mm Tempered Anti-Reflective Glass',
    specs: [
      { label: 'Nominal Power (Pmax)', value: '410 Watts' },
      { label: 'Module Efficiency', value: '21.3%' },
      { label: 'Voltage at Pmax (Vmp)', value: '38.5 V' },
      { label: 'Current at Pmax (Imp)', value: '10.65 A' },
      { label: 'Open Circuit Voltage (Voc)', value: '45.8 V' },
      { label: 'Short Circuit Current (Isc)', value: '11.20 A' },
      { label: 'Tilt Mount Angle', value: '30° Fixed Tilt' },
      { label: 'Wind Load Rating', value: '2400 Pa (130 mph)' },
    ],
    description: 'Standalone high-efficiency monocrystalline PERC solar panel engineered for severe off-grid agricultural and SCADA monitoring environments.',
  },
  'solar-cells': {
    id: 'solar-cells',
    title: '6×10 Monocrystalline Cell Grid Array',
    category: 'Photovoltaic Cells',
    standards: '5-Busbar / 9-Busbar PERC Silicon',
    material: 'High-Purity Silicon Wafer with Anti-Reflective Silicon Nitride',
    specs: [
      { label: 'Cell Configuration', value: '60 Cells (6 Columns × 10 Rows)' },
      { label: 'Cell Shape', value: 'Pseudo-Square Monocrystalline with Cut Corners' },
      { label: 'Cell Dimensions', value: '156.75 mm × 156.75 mm' },
      { label: 'Busbar Layout', value: '3 Main Silver Busbars + Micro-Finger Grid' },
      { label: 'Temperature Coefficient', value: '-0.35% / °C' },
    ],
    description: 'Precision cut dark blue monocrystalline solar cells with silver busbars and chamfered corners for optimal light capture in hydroponics monitoring.',
  },
  'aluminum-frame': {
    id: 'aluminum-frame',
    title: 'Anodized Extruded Aluminum Alloy Frame',
    category: 'Mechanical Framing',
    standards: 'ASTM B221 / EN 755-2 Alloy 6063-T6',
    material: 'Brushed Anodized Aluminum with 15µm Coating Depth',
    specs: [
      { label: 'Frame Profile Depth', value: '35 mm' },
      { label: 'Corner Fastening', value: 'Mitered Corners with Internal Locking Key' },
      { label: 'Drainage Outlets', value: '4 Corner Anti-Freeze Drainage Slots' },
      { label: 'Corrosion Resistance', value: 'C5-M Severe Marine Environment' },
    ],
    description: 'Heavy-duty 35mm anodized aluminum frame with beveled edges and drainage cutouts designed to prevent snow/dust accumulation.',
  },
  'junction-box': {
    id: 'junction-box',
    title: 'IP67 Rear Weatherproof Junction Box',
    category: 'Electrical Enclosure',
    standards: 'IEC 62790 / IP67 Weatherproof Protection',
    material: 'UV-Stabilized Flame Retardant Polycarbonate PPO',
    specs: [
      { label: 'Ingress Protection', value: 'IP67 Waterproof / Dustproof' },
      { label: 'Bypass Diodes', value: '3 Schottky 15A Bypass Diodes' },
      { label: 'Gland Fittings', value: 'M16 Strain Relief Compression Glands' },
      { label: 'Heat Dissipation', value: 'Rear Aluminum Thermal Dissipation Fins' },
    ],
    description: 'Hermetically sealed rear junction box mounted beneath the backsheet to safeguard internal diodes against moisture and dust ingress.',
  },
  'pivot-hinge': {
    id: 'pivot-hinge',
    title: 'Single-Axis Single-Point Heavy Hinge Pivot Assembly',
    category: 'Kinematic Mounting Axis',
    standards: 'ISO 281 Bearing Life / DIN 631 Heavy Pin Standards',
    material: 'ASTM A36 Steel Housing + Self-Lubricating Bronze Bushing + Alloy Pin',
    specs: [
      { label: 'Rotation Axis Pin', value: 'Ø 24 mm High-Tensile Alloy Steel Bolt' },
      { label: 'Bushing Material', value: 'Sintered Oil-Impregnated Bronze Ring' },
      { label: 'Tilt Rotation Span', value: '0° (Horizontal) to 90° (Vertical) Full Arc' },
      { label: 'Stationary Collar', value: 'Heavy Duty Welded Pipe Collar (Fixed to Pole)' },
      { label: 'Actuator Drive Mount', value: 'Clevis End Pin Mount for Linear Servo Actuator' },
    ],
    description: 'Precision stationary pivot mechanism remaining firmly anchored to the support pole while permitting smooth, zero-distortion single-axis panel rotation.',
  },
  'mounting-bracket': {
    id: 'mounting-bracket',
    title: '30° Adjustable Tilt Angle Mounting Bracket',
    category: 'Structural Mounting',
    standards: 'ASCE 7-10 Wind Engineering Standards',
    material: 'Galvanized Structural Steel Channel C-Sections',
    specs: [
      { label: 'Fixed Tilt Angle', value: '30° Optimized for Mid-Latitudes' },
      { label: 'Adjustment Range', value: '15° to 60° Arc Slot Adjustment' },
      { label: 'Lock Mechanism', value: 'M12 Grade 8.8 Stainless Steel Pivot Bolt' },
    ],
    description: 'Heavy structural C-channel tilt mechanism permitting seasonal elevation angle tweaks for maximum solar output in hydroponic farms.',
  },
  'support-arms': {
    id: 'support-arms',
    title: 'Triangular Structural Support Struts',
    category: 'Structural Bracing',
    standards: 'EN 1090-2 Structural Steel',
    material: 'Cold-Formed Galvanized Steel Strut Channel',
    specs: [
      { label: 'Strut Profile', value: '41mm × 41mm Triangular Diagonal Channel' },
      { label: 'Fasteners', value: 'Grade 316 Stainless Steel Locking Hex Bolts' },
      { label: 'Vibration Resistance', value: 'DIN 65151 Junker Test Certified' },
    ],
    description: 'Triangular diagonal support struts braced beneath the solar module frame to transfer wind loads directly to the central pole shaft.',
  },
  'u-bolts': {
    id: 'u-bolts',
    title: 'Stainless Steel Heavy-Duty U-Bolts',
    category: 'Clamping Hardware',
    standards: 'DIN 3570 / ISO 3506-1 A4-80',
    material: 'Grade 316 Marine-Grade Stainless Steel',
    specs: [
      { label: 'Thread Size', value: 'M12 × 1.75 mm Pitch' },
      { label: 'Clamp Type', value: 'Heavy Duty Saddle Clamp Ring' },
      { label: 'Nuts & Washers', value: 'Dual Hex Lock Nuts + Flat Stainless Washer' },
    ],
    description: 'Precision curved U-bolts encircling the galvanized pole shaft to tightly lock the mounting bracket without crushing the pipe wall.',
  },
  'support-pole': {
    id: 'support-pole',
    title: 'Heavy-Duty Galvanized Steel Pipe Pole',
    category: 'Primary Pillar',
    standards: 'ISO 1461 Hot-Dip Galvanizing / ASTM A53 Grade B',
    material: 'Structural Carbon Steel Pipe with 85µm Zinc Coating',
    specs: [
      { label: 'Outer Diameter', value: '88.9 mm (3.5 in Nominal Pipe Size)' },
      { label: 'Wall Thickness', value: '5.5 mm Schedule 40 Steel' },
      { label: 'Height', value: '2400 mm Overall Ground Clearance' },
      { label: 'Coating', value: 'Hot-Dip Galvanized Zinc Spangle Finish' },
    ],
    description: 'Heavy cylindrical galvanized steel pole engineered to withstand severe outdoor agricultural environments without rust or corrosion.',
  },
  'base-plate': {
    id: 'base-plate',
    title: 'Welded Steel Base Flange Plate',
    category: 'Foundation Mounting',
    standards: 'AWS D1.1 Structural Welding Code',
    material: '16mm Thick Hot-Rolled S235JR Structural Steel Plate',
    specs: [
      { label: 'Flange Dimensions', value: '250 mm Octagonal Base' },
      { label: 'Plate Thickness', value: '16 mm Solid Steel' },
      { label: 'Stiffener Ribs', value: '4 Welded Triangular Gusset Plate Supports' },
      { label: 'Welding', value: 'Continuous Fillet Weld Joint' },
    ],
    description: 'Octagonal welded steel flange with 4 corner gusset plates designed to bolt securely to concrete pad footings.',
  },
  'anchor-bolts': {
    id: 'anchor-bolts',
    title: 'Grade 8.8 Concrete Anchor Bolt Assembly',
    category: 'Foundation Hardware',
    standards: 'ASTM F1554 Grade 55 / ISO 898-1',
    material: 'High-Tensile Galvanized Steel Threaded Studs',
    specs: [
      { label: 'Bolt Size', value: 'M16 × 250 mm J-Hook Concrete Studs' },
      { label: 'Bolt Circle', value: 'Ø 220 mm Pitch Diameter' },
      { label: 'Nut Configuration', value: 'Double Hex Jam Nuts + Heavy Flat Washer' },
    ],
    description: 'Four heavy industrial anchor bolts embedded into concrete foundations to secure the solar monitoring post against uplift and overturn forces.',
  },
  'cables': {
    id: 'cables',
    title: 'UV-Resistant Solar Cables & MC4 Connectors',
    category: 'Electrical Cabling',
    standards: 'EN 50618 H1Z2Z2-K / TÜV Approved',
    material: 'Tinned Copper Conductor with Cross-Linked Polyolefin (XLPO)',
    specs: [
      { label: 'Cable Gauge', value: '4 mm² (12 AWG) Solar Wire' },
      { label: 'Voltage Rating', value: '1500 VDC Max System Voltage' },
      { label: 'Connector Type', value: 'Stäubli MC4 IP68 Waterproof Plugs' },
      { label: 'Temperature Rating', value: '-40°C to +90°C Outdoor Rated' },
    ],
    description: 'Heavy dual-insulated solar cabling exiting the junction box with IP68 MC4 quick-connectors routed neatly down the pole shaft.',
  },
  'grounding-wire': {
    id: 'grounding-wire',
    title: 'Green/Yellow Earth Grounding Conductor',
    category: 'Electrical Safety',
    standards: 'NEC Article 690 / IEEE 142 Earthing Standard',
    material: 'Copper Conductor with Green/Yellow Striped PVC Insulation',
    specs: [
      { label: 'Wire Gauge', value: '6 mm² (10 AWG) Flexible Copper' },
      { label: 'Lug Connection', value: 'Brass Grounding Lug with Stainless Bolt' },
      { label: 'Earth Resistance', value: '< 5 Ohms System Ground Path' },
    ],
    description: 'Continuous green/yellow earth wire bonding the aluminum module frame and steel pole directly to the ground rod lug for lightning protection.',
  },
};

export const TechSpecs: React.FC<TechSpecsProps> = ({
  selectedLayerId,
  onSelectLayer,
}) => {
  const currentSpec = selectedLayerId ? SPEC_DATABASE[selectedLayerId] : SPEC_DATABASE['solar-panel'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5">
      {/* Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Engineering Datasheet & Specs</h3>
            <p className="text-xs text-slate-400">Industrial SCADA Asset Component Documentation</p>
          </div>
        </div>

        {/* Layer Dropdown */}
        <select
          value={currentSpec.id}
          onChange={(e) => onSelectLayer(e.target.value as LayerId)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          {Object.values(SPEC_DATABASE).map((spec) => (
            <option key={spec.id} value={spec.id}>
              {spec.title}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Spec Overview */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-purple-400 tracking-wider">
              {currentSpec.category}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">{currentSpec.standards}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">{currentSpec.title}</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{currentSpec.description}</p>
        </div>

        {/* Material Callout */}
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center gap-3">
          <Box className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400 font-medium">Material Composition: </span>
            <span className="text-slate-200 font-mono">{currentSpec.material}</span>
          </div>
        </div>

        {/* Specifications Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Technical Parameters</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {currentSpec.specs.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800/80">
                <span className="text-slate-400">{item.label}</span>
                <span className="font-mono text-slate-200 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
