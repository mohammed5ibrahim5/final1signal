import { Router, type IRouter } from "express";
import { ComputeSamplingBody, ComputeSamplingResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/sampling", (req, res) => {
  const parsed = ComputeSamplingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { signalFrequency, samplingFrequency, duration } = parsed.data;
  const f0 = signalFrequency;
  const fs = samplingFrequency;
  const T = duration;

  const nyquistRate = 2 * f0;
  const isAliasing = fs < nyquistRate;
  const aliasingFrequency = isAliasing ? Math.abs(f0 - Math.round(f0 / fs) * fs) : f0;

  const samplingSteps = [
    `Signal frequency: f₀ = ${f0} Hz`,
    `Sampling frequency: fₛ = ${fs} Hz`,
    `Nyquist rate: f_Nyquist = 2 × f₀ = 2 × ${f0} = ${nyquistRate} Hz`,
    `Nyquist condition: fₛ ≥ f_Nyquist → ${fs} ≥ ${nyquistRate} → ${isAliasing ? "FALSE ❌ ALIASING OCCURS!" : "TRUE ✓ No aliasing"}`,
    isAliasing
      ? `Aliased frequency: f_alias = |f₀ - round(f₀/fₛ)·fₛ| = ${aliasingFrequency.toFixed(4)} Hz`
      : `Signal is properly sampled. Reconstructed frequency = ${f0} Hz.`,
    `Sampling period: Tₛ = 1/fₛ = ${(1 / fs).toFixed(6)} s`,
  ];

  // Generate continuous signal points (high resolution)
  const numContinuous = 500;
  const continuousPoints = Array.from({ length: numContinuous }, (_, i) => {
    const t = (i / (numContinuous - 1)) * T;
    return { t: Math.round(t * 1e9) / 1e9, value: Math.round(Math.cos(2 * Math.PI * f0 * t) * 1e6) / 1e6 };
  });

  // Generate sampled points
  const numSamples = Math.floor(T * fs) + 1;
  const sampledPoints = Array.from({ length: Math.min(numSamples, 200) }, (_, i) => {
    const t = i / fs;
    return { t: Math.round(t * 1e6) / 1e6, value: Math.round(Math.cos(2 * Math.PI * f0 * t) * 1e6) / 1e6 };
  });

  // Reconstructed: what we'd hear if we play back samples at fs
  const reconstructedFreq = isAliasing ? aliasingFrequency : f0;
  const reconstructedPoints = Array.from({ length: numContinuous }, (_, i) => {
    const t = (i / (numContinuous - 1)) * T;
    return { t: Math.round(t * 1e9) / 1e9, value: Math.round(Math.cos(2 * Math.PI * reconstructedFreq * t) * 1e6) / 1e6 };
  });

  const result = ComputeSamplingResponse.parse({
    latexFormula: `x_s(t) = x(t) \\sum_{k=-\\infty}^{\\infty} \\delta(t - k T_s), \\quad T_s = \\frac{1}{f_s} = \\frac{1}{${fs}}`,
    nyquistRate,
    isAliasing,
    aliasingFrequency: Math.round(aliasingFrequency * 1e6) / 1e6,
    samplingSteps,
    continuousPoints,
    sampledPoints,
    reconstructedPoints,
    summary: `Signal f₀=${f0}Hz, fₛ=${fs}Hz. Nyquist rate=${nyquistRate}Hz. ${isAliasing ? `⚠️ ALIASING: Reconstructed frequency will be ${aliasingFrequency.toFixed(2)}Hz!` : "✓ Properly sampled, no aliasing."}`,
  });

  res.json(result);
});

export default router;
