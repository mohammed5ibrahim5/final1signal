import { Router, type IRouter } from "express";
import { ComputeEnergyPowerBody, ComputeEnergyPowerResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/energy-power", (req, res) => {
  const parsed = ComputeEnergyPowerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tValues, xValues, domain } = parsed.data;

  if (tValues.length !== xValues.length || tValues.length === 0) {
    res.status(400).json({ error: "tValues and xValues must be equal length and non-empty" });
    return;
  }

  const steps: Array<{
    index: number;
    t: number;
    xSquared: string;
    contribution: string;
    runningEnergy: number;
  }> = [];

  let energy = 0;

  if (domain === "discrete") {
    for (let i = 0; i < xValues.length; i++) {
      const xSq = xValues[i] ** 2;
      energy += xSq;
      steps.push({
        index: i,
        t: tValues[i],
        xSquared: `|x[${tValues[i]}]|² = |${xValues[i]}|² = ${xSq.toFixed(6)}`,
        contribution: `+${xSq.toFixed(6)}`,
        runningEnergy: Math.round(energy * 1e6) / 1e6,
      });
    }
  } else {
    for (let i = 1; i < tValues.length; i++) {
      const dt = tValues[i] - tValues[i - 1];
      if (dt <= 0) continue;
      const avgXSq = (xValues[i - 1] ** 2 + xValues[i] ** 2) / 2;
      const contrib = avgXSq * dt;
      energy += contrib;
      steps.push({
        index: i,
        t: tValues[i],
        xSquared: `avg(|x|²) at [${tValues[i-1]}, ${tValues[i]}] = ${avgXSq.toFixed(6)}`,
        contribution: `× Δt=${dt.toFixed(4)} → +${contrib.toFixed(6)}`,
        runningEnergy: Math.round(energy * 1e6) / 1e6,
      });
    }
  }

  const T =
    domain === "continuous"
      ? tValues[tValues.length - 1] - tValues[0]
      : xValues.length;
  const power = T > 0 ? energy / T : 0;

  // Classification: finite energy → energy signal; finite nonzero power → power signal
  let classification: "energy" | "power" | "neither" = "neither";
  let classificationReason = "";
  if (isFinite(energy) && energy > 0) {
    classification = "energy";
    classificationReason = `E = ${energy.toFixed(4)} < ∞ and P = E/T → 0 as T→∞, so this is an Energy Signal.`;
  } else if (isFinite(power) && power > 0) {
    classification = "power";
    classificationReason = `E = ∞ but P = ${power.toFixed(4)} < ∞, so this is a Power Signal.`;
  } else {
    classificationReason = `Both E and P are either 0 or ∞. Signal is neither an energy nor power signal.`;
  }

  const varName = domain === "discrete" ? "n" : "t";

  const result = ComputeEnergyPowerResponse.parse({
    latexEnergy:
      domain === "discrete"
        ? `E = \\sum_{n=-\\infty}^{\\infty} |x[n]|^2`
        : `E = \\int_{-\\infty}^{\\infty} |x(t)|^2 \\, dt`,
    latexPower:
      domain === "discrete"
        ? `P = \\lim_{N \\to \\infty} \\frac{1}{2N+1} \\sum_{n=-N}^{N} |x[n]|^2`
        : `P = \\lim_{T \\to \\infty} \\frac{1}{2T} \\int_{-T}^{T} |x(t)|^2 \\, dt`,
    energy: Math.round(energy * 1e6) / 1e6,
    power: Math.round(power * 1e6) / 1e6,
    classification,
    classificationReason,
    steps,
    summary: `Energy E = ${energy.toFixed(4)} J (${domain}), Power P = ${power.toFixed(4)} W. ${classificationReason}`,
  });

  res.json(result);
});

export default router;
