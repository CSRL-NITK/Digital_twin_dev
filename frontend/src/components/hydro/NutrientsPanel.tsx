import { useMemo } from "react";
import type { NutrientSolution } from "../../types";
import { useTheme } from "../ThemeProvider";

interface NutrientsPanelProps {
  currentTDS: number;
  scenario: string;
}

export default function NutrientsPanel({ currentTDS, scenario }: NutrientsPanelProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  // Base formulation at standard 900 ppm (EC 1.4 mS/cm)
  const baseSolution: NutrientSolution = {
    nitrogen:   150,
    calcium:     90,
    potassium:  210,
    phosphorus:  31,
    magnesium:   24,
    sulfur:      32,
    iron:        1.000,
    manganese:   0.250,
    boron:       0.160,
    zinc:        0.130,
    copper:      0.023,
    molybdenum:  0.024,
    chlorine:    4.900,
    calciumNitrate:          22.7,
    potassiumNitrate:        11.9,
    monoammoniumPhosphate:    3.0,
    epsomSalts:               6.5,
    ironChelate:              1.0,
    traceMicronutrientBlend:  0.5,
    phosphoricAcid:     5.3,
    nitricAcid:         4.0,
    potassiumHydroxide: 4.0,
    bacillusAmyloliquefaciens: 19.8,
    hypochlorousAcid:         39.6,
  };

  const currentSolution = useMemo(() => {
    const scale = currentTDS / 900;
    const sol: NutrientSolution = {
      nitrogen: parseFloat((baseSolution.nitrogen * scale).toFixed(1)),
      phosphorus: parseFloat((baseSolution.phosphorus * scale).toFixed(1)),
      potassium: parseFloat((baseSolution.potassium * scale).toFixed(1)),
      calcium: parseFloat((baseSolution.calcium * scale).toFixed(1)),
      magnesium: parseFloat((baseSolution.magnesium * scale).toFixed(1)),
      sulfur: parseFloat((baseSolution.sulfur * scale).toFixed(1)),
      iron: parseFloat((baseSolution.iron * scale).toFixed(2)),
      manganese: parseFloat((baseSolution.manganese * scale).toFixed(2)),
      boron: parseFloat((baseSolution.boron * scale).toFixed(2)),
      zinc: parseFloat((baseSolution.zinc * scale).toFixed(2)),
      copper: parseFloat((baseSolution.copper * scale).toFixed(3)),
      molybdenum: parseFloat((baseSolution.molybdenum * scale).toFixed(3)),
      chlorine: parseFloat((baseSolution.chlorine * scale).toFixed(2)),
      calciumNitrate: parseFloat((baseSolution.calciumNitrate * scale).toFixed(1)),
      potassiumNitrate: parseFloat((baseSolution.potassiumNitrate * scale).toFixed(1)),
      monoammoniumPhosphate: parseFloat((baseSolution.monoammoniumPhosphate * scale).toFixed(1)),
      epsomSalts: parseFloat((baseSolution.epsomSalts * scale).toFixed(1)),
      ironChelate: parseFloat((baseSolution.ironChelate * scale).toFixed(1)),
      traceMicronutrientBlend: parseFloat((baseSolution.traceMicronutrientBlend * scale).toFixed(1)),
      phosphoricAcid: parseFloat((baseSolution.phosphoricAcid * scale).toFixed(1)),
      nitricAcid: parseFloat((baseSolution.nitricAcid * scale).toFixed(1)),
      potassiumHydroxide: parseFloat((baseSolution.potassiumHydroxide * scale).toFixed(1)),
      bacillusAmyloliquefaciens: parseFloat((baseSolution.bacillusAmyloliquefaciens * scale).toFixed(1)),
      hypochlorousAcid: parseFloat((baseSolution.hypochlorousAcid * scale).toFixed(1)),
    };

    // Scenario impacts
    if (scenario === "Algae Bloom") {
      // Algae absorbs nitrogen and phosphorus rapidly
      sol.nitrogen = parseFloat((sol.nitrogen * 0.45).toFixed(1));
      sol.phosphorus = parseFloat((sol.phosphorus * 0.3).toFixed(1));
    }

    return sol;
  }, [currentTDS, scenario]);

  const macronutrients = [
    { name: "Nitrogen (N)", val: currentSolution.nitrogen, max: 250, target: 150, unit: "ppm", color: "bg-emerald-500", desc: "Leaves & canopy vegetative expansion" },
    { name: "Phosphorus (P)", val: currentSolution.phosphorus, max: 100, target: 50, unit: "ppm", color: "bg-teal-500", desc: "Root growth & cell division" },
    { name: "Potassium (K)", val: currentSolution.potassium, max: 300, target: 200, unit: "ppm", color: "bg-cyan-500", desc: "Osmoregulation & stomatal mechanics" },
    { name: "Calcium (Ca)", val: currentSolution.calcium, max: 250, target: 150, unit: "ppm", color: "bg-blue-500", desc: "Cell wall structural integrity" },
    { name: "Magnesium (Mg)", val: currentSolution.magnesium, max: 100, target: 50, unit: "ppm", color: "bg-indigo-500", desc: "Central atom of chlorophyll molecule" },
    { name: "Sulfur (S)", val: currentSolution.sulfur, max: 120, target: 64, unit: "ppm", color: "bg-purple-500", desc: "Protein synthesis & enzyme activation" },
  ];

  const micronutrients = [
    { name: "Iron (Fe)", val: currentSolution.iron, target: 4.5, unit: "ppm" },
    { name: "Manganese (Mn)", val: currentSolution.manganese, target: 0.5, unit: "ppm" },
    { name: "Boron (B)", val: currentSolution.boron, target: 0.5, unit: "ppm" },
    { name: "Zinc (Zn)", val: currentSolution.zinc, target: 0.05, unit: "ppm" },
    { name: "Copper (Cu)", val: currentSolution.copper, target: 0.02, unit: "ppm" },
    { name: "Moly (Mo)", val: currentSolution.molybdenum, target: 0.01, unit: "ppm" },
  ];

  return (
    <div className={`border rounded-lg p-3.5 flex flex-col space-y-3.5 select-none ${isDark ? "bg-[#12141c]/60 border-slate-900" : "bg-white border-slate-200 shadow-sm text-slate-800"}`} id="nutrients-composition-panel">
      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-slate-900" : "border-slate-200"}`}>
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-yellow-500" : "text-amber-600"}`}>
            Macronutrient Composition
          </span>
          <span className={`text-[8px] uppercase mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500 font-bold"}`}>
            Active mineral ions in root solution
          </span>
        </div>
        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isDark ? "text-slate-400 bg-slate-900/60 border-slate-850" : "text-slate-700 bg-slate-100 border-slate-300"}`}>
          TDS: <span className={`font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>{currentTDS} ppm</span>
        </div>
      </div>

      {/* Macronutrient Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="macros-grid">
        {macronutrients.map((macro) => {
          const percentage = Math.min(100, (macro.val / macro.max) * 100);
          const isDeficient = macro.val < macro.target * 0.75;
          const isExcess = macro.val > macro.target * 1.3;

          let statusText = "Optimal";
          let statusColor = isDark ? "text-emerald-400" : "text-emerald-600 font-black";
          if (isDeficient) {
            statusText = "Deficient";
            statusColor = isDark ? "text-rose-400 animate-pulse" : "text-rose-600 font-black animate-pulse";
          } else if (isExcess) {
            statusText = "Excess Burn";
            statusColor = isDark ? "text-red-500" : "text-red-600 font-black";
          }

          if (macro.name.includes("Calcium") && scenario === "Tipburn Risk") {
            statusText = "Canopy Blocked";
            statusColor = isDark ? "text-amber-500 font-black animate-pulse" : "text-amber-600 font-black animate-pulse";
          }
          if ((macro.name.includes("Nitrogen") || macro.name.includes("Phosphorus")) && scenario === "Algae Bloom") {
            statusText = "Algae Depleted";
            statusColor = isDark ? "text-amber-500" : "text-amber-600 font-black";
          }

          return (
            <div key={macro.name} className={`p-2.5 rounded border flex flex-col justify-between ${isDark ? "bg-[#14151b] border-slate-950" : "bg-slate-50 border-slate-200"}`} id={`macro-card-${macro.name.split(" ")[0].toLowerCase()}`}>
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-800"}`}>{macro.name}</span>
                <span className={`font-black uppercase text-[8px] ${statusColor}`}>{statusText}</span>
              </div>
              <div className="flex items-baseline space-x-1.5 mb-1.5">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-slate-900"}`}>{macro.val}</span>
                <span className={`text-[8px] font-bold uppercase ${isDark ? "text-slate-500" : "text-slate-500"}`}>{macro.unit}</span>
                <span className={`text-[8px] font-bold ml-auto ${isDark ? "text-slate-600" : "text-slate-500"}`}>Target: {macro.target}</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-950" : "bg-slate-200"}`}>
                <div className={`${macro.color} h-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
              <span className={`text-[7.5px] mt-1.5 leading-tight ${isDark ? "text-slate-500" : "text-slate-500 font-medium"}`}>{macro.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Micronutrients Micro Row */}
      <div className={`border-t pt-2 flex flex-col space-y-1.5 ${isDark ? "border-slate-950" : "border-slate-200"}`}>
        <span className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Micronutrient Traces
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[8.5px]" id="micros-grid">
          {micronutrients.map((micro) => (
            <div key={micro.name} className={`border p-1.5 rounded flex flex-col items-center justify-center text-center ${isDark ? "bg-[#14151b]/45 border-slate-950" : "bg-slate-50 border-slate-200"}`}>
              <span className={`block text-[7.5px] ${isDark ? "text-slate-500" : "text-slate-600"}`}>{micro.name}</span>
              <span className={`font-bold block mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{micro.val}</span>
              <span className={`block text-[6.5px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-500 font-medium"}`}>Trgt: {micro.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
