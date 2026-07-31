import { Router, Request, Response } from 'express';
import { HydroAiCoordinator } from '../services/hydro-ai/hydro-coordinator';

const router = Router();

// GET /api/hydro/ai/live-status
router.get('/live-status', async (req: Request, res: Response): Promise<any> => {
  try {
    const summary = await HydroAiCoordinator.getLiveStatus();
    return res.json({ summary });
  } catch (error) {
    console.error('Error in /live-status route:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI live status' });
  }
});

// POST /api/hydro/ai/diagnose-node
router.post('/diagnose-node', async (req: Request, res: Response): Promise<any> => {
  try {
    const { nodeSlug } = req.body;
    if (!nodeSlug) {
      return res.status(400).json({ error: 'nodeSlug is required' });
    }
    const diagnosis = await HydroAiCoordinator.checkNode(nodeSlug);
    return res.json({ diagnosis });
  } catch (error) {
    console.error('Error in /diagnose-node route:', error);
    return res.status(500).json({ error: 'Failed to diagnose node' });
  }
});

// POST /api/hydro/ai/grafana-query (Historical SQL agent)
router.post('/grafana-query', async (req: Request, res: Response): Promise<any> => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }
    const result = await HydroAiCoordinator.queryHistory(question);
    return res.json(result);
  } catch (error) {
    console.error('Error in /grafana-query route:', error);
    return res.status(500).json({ error: 'Failed to analyze database history' });
  }
});

// POST /api/hydro/ai/analyze-logs (Troubleshooting log agent)
router.post('/analyze-logs', async (req: Request, res: Response): Promise<any> => {
  try {
    const { logs } = req.body;
    if (!logs) {
      return res.status(400).json({ error: 'logs is required' });
    }
    const diagnosis = await HydroAiCoordinator.analyzeHistoryLogs(logs);
    return res.json({ diagnosis });
  } catch (error) {
    console.error('Error in /analyze-logs route:', error);
    return res.status(500).json({ error: 'Failed to analyze logs' });
  }
});

// POST /api/hydro/ai/simulation-forecast (Physics & Dosing agent)
router.post('/simulation-forecast', async (req: Request, res: Response): Promise<any> => {
  try {
    const { scenario } = req.body;
    if (!scenario) {
      return res.status(400).json({ error: 'scenario is required' });
    }
    const result = await HydroAiCoordinator.runSimulation(scenario);
    return res.json(result);
  } catch (error) {
    console.error('Error in /simulation-forecast route:', error);
    return res.status(500).json({ error: 'Failed to execute simulation forecast' });
  }
});

// GET /api/hydro/ai/registry (State payload for Tier 1 Global Coordinator)
router.get('/registry', (req: Request, res: Response): any => {
  try {
    const registryData = HydroAiCoordinator.getRegistry();
    return res.json(registryData);
  } catch (error) {
    console.error('Error fetching AI state registry:', error);
    return res.status(500).json({ error: 'Failed to retrieve AI state registry' });
  }
});

// POST /api/hydro/ai/coordinator (Unified dispatch endpoint for Tier 1 Global Agent)
router.post('/coordinator', async (req: Request, res: Response): Promise<any> => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    const response = await HydroAiCoordinator.handleCoordinatorRequest(query);
    return res.json({ response });
  } catch (error) {
    console.error('Error in /coordinator dispatch endpoint:', error);
    return res.status(500).json({ error: 'Failed inside Hydroponics Coordinator' });
  }
});

export default router;
