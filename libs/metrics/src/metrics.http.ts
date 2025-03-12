import * as express from 'express';
import { MetricsService } from './metrics.service';

export function startMetricsServer(
  metricsService: MetricsService,
  port: number = 9100,
) {
  const app = express();

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(await metricsService.getMetrics());
  });

  app.listen(port, () => {
    console.log(
      `Metrics server is running on http://localhost:${port}/metrics`,
    );
  });
}
