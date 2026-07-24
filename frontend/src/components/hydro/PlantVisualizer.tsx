import {
  NormalGrowthVisualizer,
  TipburnRiskVisualizer,
  AlgaeBloomVisualizer,
  PumpFailureVisualizer,
  UnattendedDecayVisualizer,
} from "./animations";
import type { LettuceEnvironmentalStats, LettuceMetrics } from "../../types";

interface PlantVisualizerProps {
  scenario?: string;
  stats: LettuceEnvironmentalStats;
  metrics: LettuceMetrics;
  reservoirLevel?: number;
  pumpRunning: boolean;
  onHarvest?: () => void;
  animationSpeed?: number;
}

export default function PlantVisualizer({
  scenario = "Normal Growth (Baseline)",
  stats,
  metrics,
  reservoirLevel,
  pumpRunning,
  onHarvest,
  animationSpeed = 1,
}: PlantVisualizerProps) {
  const normalizedScenario = scenario.toLowerCase();

  if (normalizedScenario.includes("unattended")) {
    return (
      <UnattendedDecayVisualizer
        stats={stats}
        metrics={metrics}
        reservoirLevel={reservoirLevel}
        pumpRunning={pumpRunning}
        animationSpeed={animationSpeed}
      />
    );
  }

  if (normalizedScenario.includes("tipburn")) {
    return (
      <TipburnRiskVisualizer
        stats={stats}
        metrics={metrics}
        reservoirLevel={reservoirLevel}
        pumpRunning={pumpRunning}
        onHarvest={onHarvest}
        animationSpeed={animationSpeed}
      />
    );
  }

  if (normalizedScenario.includes("algae")) {
    return (
      <AlgaeBloomVisualizer
        stats={stats}
        metrics={metrics}
        reservoirLevel={reservoirLevel}
        pumpRunning={pumpRunning}
        onHarvest={onHarvest}
        animationSpeed={animationSpeed}
      />
    );
  }

  if (normalizedScenario.includes("pump failure") || normalizedScenario.includes("cutoff")) {
    return (
      <PumpFailureVisualizer
        stats={stats}
        metrics={metrics}
        reservoirLevel={reservoirLevel}
        pumpRunning={pumpRunning}
        onHarvest={onHarvest}
        animationSpeed={animationSpeed}
      />
    );
  }

  // Default Baseline: Normal Growth
  return (
    <NormalGrowthVisualizer
      stats={stats}
      metrics={metrics}
      reservoirLevel={reservoirLevel}
      pumpRunning={pumpRunning}
      onHarvest={onHarvest}
      animationSpeed={animationSpeed}
    />
  );
}
