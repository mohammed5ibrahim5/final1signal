import { Router, type IRouter } from "express";
import { GenerateReportBody, GenerateReportResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function unitStep(t: number) { return t >= 0 ? 1 : 0; }
function delta(t: number) { return Math.abs(t) < 1e-9 ? 1 : 0; }
function ramp(t: number) { return t >= 0 ? t : 0; }

router.post("/signal/report", (req, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tValues, xValues, domain, label } = parsed.data;
  const N = xValues.length;
  const varName = domain === "discrete" ? "n" : "t";
  const signalLabel = label ?? `x[${varName}]`;

  if (N === 0 || tValues.length !== N) {
    res.status(400).json({ error: "tValues and xValues must be equal length and non-empty" });
    return;
  }

  // --- Energy & Power ---
  let energy = 0;
  if (domain === "discrete") {
    energy = xValues.reduce((s, x) => s + x ** 2, 0);
  } else {
    for (let i = 1; i < tValues.length; i++) {
      const dt = tValues[i] - tValues[i - 1];
      if (dt > 0) energy += ((xValues[i - 1] ** 2 + xValues[i] ** 2) / 2) * dt;
    }
  }
  const T = domain === "continuous" ? tValues[tValues.length - 1] - tValues[0] : N;
  const power = T > 0 ? energy / T : 0;
  const classification = isFinite(energy) && energy > 0 ? "Energy Signal" : (isFinite(power) && power > 0 ? "Power Signal" : "Neither");

  // --- DFT dominant ---
  let maxMag = 0;
  let dominantK = 0;
  let dominantFreq = 0;
  const dt = tValues.length > 1 ? tValues[1] - tValues[0] : 1;
  const fs = 1 / dt;
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += xValues[n] * Math.cos(angle);
      im -= xValues[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(re ** 2 + im ** 2);
    if (mag > maxMag) { maxMag = mag; dominantK = k; dominantFreq = (k * fs) / N; }
  }

  // --- Basic signals at t=0 ---
  const atZero = tValues.indexOf(0);
  const xAtZero = atZero >= 0 ? xValues[atZero] : "N/A";

  // --- Min, Max, Mean ---
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xMean = xValues.reduce((s, v) => s + v, 0) / N;

  const sections = [
    {
      title: "Signal Information",
      latex: `x[${varName}], \\quad N = ${N}`,
      result: `${N} samples, domain: ${domain}`,
      details: [
        `Min amplitude: ${xMin}`,
        `Max amplitude: ${xMax}`,
        `Mean amplitude: ${xMean.toFixed(4)}`,
        `Time range: ${tValues[0]} to ${tValues[N - 1]}`,
      ],
    },
    {
      title: "Energy & Power",
      latex: domain === "discrete"
        ? `E = \\sum |x[n]|^2 = ${energy.toFixed(4)}, \\quad P = \\frac{E}{N} = ${power.toFixed(4)}`
        : `E = \\int |x(t)|^2 dt = ${energy.toFixed(4)}, \\quad P = \\frac{E}{T} = ${power.toFixed(4)}`,
      result: classification,
      details: [
        `Total Energy E = ${energy.toFixed(6)} J`,
        `Average Power P = ${power.toFixed(6)} W`,
        `Classification: ${classification}`,
        isFinite(energy) && energy > 0
          ? "E < ∞ → Energy Signal (power → 0 as window → ∞)"
          : "E may be infinite → check Power classification",
      ],
    },
    {
      title: "Basic Signal Evaluation (at sample points)",
      latex: `u(${varName}), \\delta(${varName}), r(${varName})`,
      result: `Evaluated at ${N} points`,
      details: tValues.slice(0, 6).map((t) =>
        `t=${t}: u=${unitStep(t)}, δ=${delta(t)}, r=${ramp(t).toFixed(3)}`
      ).concat(N > 6 ? [`... and ${N - 6} more points`] : []),
    },
    {
      title: "Fourier / DFT Analysis",
      latex: `X[k] = \\sum_{n=0}^{N-1} x[n] \\, e^{-j2\\pi kn/N}`,
      result: `Dominant frequency: ${dominantFreq.toFixed(4)} Hz (k=${dominantK})`,
      details: [
        `Sampling frequency fs = ${fs.toFixed(4)} Hz`,
        `Frequency resolution = fs/N = ${(fs / N).toFixed(4)} Hz`,
        `Dominant bin k = ${dominantK}`,
        `Dominant frequency f = ${dominantFreq.toFixed(4)} Hz`,
        `Dominant magnitude |X[${dominantK}]| = ${maxMag.toFixed(4)}`,
      ],
    },
    {
      title: "Odd/Even Decomposition",
      latex: `x_e = \\frac{x[n]+x[-n]}{2}, \\quad x_o = \\frac{x[n]-x[-n]}{2}`,
      result: "Decomposed into even and odd components",
      details: tValues.slice(0, 5).map((t, i) => {
        const revIdx = tValues.indexOf(-t);
        const xNeg = revIdx >= 0 ? xValues[revIdx] : 0;
        const xe = (xValues[i] + xNeg) / 2;
        const xo = (xValues[i] - xNeg) / 2;
        return `n=${t}: x_e=${xe.toFixed(3)}, x_o=${xo.toFixed(3)}`;
      }),
    },
  ];

  const result = GenerateReportResponse.parse({
    signalLabel,
    domain,
    sections,
    signalPoints: tValues.map((t, i) => ({ t, x: xValues[i] })),
    summary: `Final report for signal "${signalLabel}": N=${N} samples, E=${energy.toFixed(4)}J, P=${power.toFixed(4)}W, Classification: ${classification}. Dominant frequency: ${dominantFreq.toFixed(4)} Hz.`,
  });

  res.json(result);
});

export default router;
