import { Router, type IRouter } from "express";
import { EvaluateSinusoidBody, EvaluateSinusoidResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/sinusoid", (req, res) => {
  const parsed = EvaluateSinusoidBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amplitude, omega, phi, tStart, tEnd, numPoints, signalType, domain } = parsed.data;
  const N = Math.max(2, Math.min(500, numPoints));
  const step = (tEnd - tStart) / (N - 1);
  const varName = domain === "discrete" ? "n" : "t";

  const points = Array.from({ length: N }, (_, i) => {
    const t = tStart + i * step;
    const arg = omega * t + phi;
    let value: number;
    let detail: string;

    if (signalType === "sine") {
      value = amplitude * Math.sin(arg);
      detail = `sin(${omega.toFixed(3)}×${t.toFixed(3)} + ${phi.toFixed(3)}) = sin(${arg.toFixed(4)}) = ${Math.sin(arg).toFixed(6)} → ${value.toFixed(6)}`;
    } else if (signalType === "complex_exp") {
      value = amplitude * Math.cos(arg); // real part
      detail = `Re[A·e^{j(ωt+φ)}] = A·cos(${arg.toFixed(4)}) = ${value.toFixed(6)}`;
    } else {
      value = amplitude * Math.cos(arg);
      detail = `cos(${omega.toFixed(3)}×${t.toFixed(3)} + ${phi.toFixed(3)}) = cos(${arg.toFixed(4)}) = ${Math.cos(arg).toFixed(6)} → ${value.toFixed(6)}`;
    }

    return {
      t: Math.round(t * 1e9) / 1e9,
      value: Math.round(value * 1e9) / 1e9,
      stepDetail: detail,
    };
  });

  const period = omega !== 0 ? (2 * Math.PI) / Math.abs(omega) : Infinity;
  const frequency = omega !== 0 ? Math.abs(omega) / (2 * Math.PI) : 0;
  const isPeriodic = isFinite(period);

  const periodicitySteps = [
    `ω = ${omega} rad/${domain === "discrete" ? "sample" : "s"}`,
    isPeriodic
      ? `T = 2π / |ω| = 2π / ${Math.abs(omega).toFixed(4)} = ${period.toFixed(4)} ${domain === "discrete" ? "samples" : "seconds"}`
      : "ω = 0 → constant signal (trivially periodic with any period)",
    `f = 1/T = ${frequency.toFixed(6)} ${domain === "discrete" ? "cycles/sample" : "Hz"}`,
    isPeriodic
      ? `Signal is PERIODIC with T = ${period.toFixed(4)}`
      : "Signal is a constant value",
    `Phase φ = ${phi.toFixed(4)} rad = ${((phi * 180) / Math.PI).toFixed(2)}°`,
    `Amplitude A = ${amplitude}`,
  ];

  let latexFormula = "";
  if (signalType === "sine") {
    latexFormula = `x(${varName}) = ${amplitude} \\sin(${omega}${varName} + ${phi.toFixed(4)})`;
  } else if (signalType === "complex_exp") {
    latexFormula = `x(${varName}) = ${amplitude} e^{j(${omega}${varName} + ${phi.toFixed(4)})}`;
  } else {
    latexFormula = `x(${varName}) = ${amplitude} \\cos(${omega}${varName} + ${phi.toFixed(4)})`;
  }

  const result = EvaluateSinusoidResponse.parse({
    latexFormula,
    points,
    period: isPeriodic ? Math.round(period * 1e9) / 1e9 : 0,
    frequency: Math.round(frequency * 1e9) / 1e9,
    isPeriodic,
    periodicitySteps,
    summary: `${signalType === "sine" ? "Sine" : signalType === "complex_exp" ? "Complex Exponential" : "Cosine"} signal with A=${amplitude}, ω=${omega}, φ=${phi.toFixed(4)} rad. ${isPeriodic ? `Period T=${period.toFixed(4)}, f=${frequency.toFixed(4)} Hz.` : "Non-periodic (constant)."}`,
  });

  res.json(result);
});

export default router;
