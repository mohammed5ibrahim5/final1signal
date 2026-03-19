import { Router, type IRouter } from "express";
import { ComputeFourierBody, ComputeFourierResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/fourier", (req, res) => {
  const parsed = ComputeFourierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tValues, xValues, domain } = parsed.data;
  const N = xValues.length;

  if (N === 0) {
    res.status(400).json({ error: "xValues must not be empty" });
    return;
  }

  // Compute DFT
  const bins = Array.from({ length: N }, (_, k) => {
    let re = 0;
    let im = 0;
    const termDetails: string[] = [];

    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      const cosPart = Math.cos(angle);
      const sinPart = Math.sin(angle);
      re += xValues[n] * cosPart;
      im -= xValues[n] * sinPart;
      if (N <= 8) {
        termDetails.push(
          `x[${n}]·e^{-j2π·${k}·${n}/${N}} = ${xValues[n]}·(${cosPart.toFixed(3)} - j·${sinPart.toFixed(3)})`
        );
      }
    }

    re = Math.round(re * 1e6) / 1e6;
    im = Math.round(im * 1e6) / 1e6;
    const mag = Math.round(Math.sqrt(re ** 2 + im ** 2) * 1e6) / 1e6;
    const phase = Math.round(Math.atan2(im, re) * 1e6) / 1e6;

    const dt = tValues.length > 1 ? tValues[1] - tValues[0] : 1;
    const fs = 1 / dt;
    const frequency = Math.round((k * fs / N) * 1e6) / 1e6;

    const shortDetail =
      N <= 8
        ? termDetails.join(" + ") + ` = ${re} ${im >= 0 ? "+" : "-"} j${Math.abs(im)}`
        : `X[${k}] = Σ x[n]·e^{-j2π·${k}·n/${N}} = ${re} ${im >= 0 ? "+" : "-"} j${Math.abs(im)}`;

    return {
      k,
      frequency,
      magnitude: mag,
      phase,
      realPart: re,
      imagPart: im,
      computationDetail: shortDetail,
    };
  });

  const dt = tValues.length > 1 ? tValues[1] - tValues[0] : 1;
  const fs = Math.round((1 / dt) * 1e6) / 1e6;

  const maxMagBin = bins.reduce((best, b) => (b.magnitude > best.magnitude ? b : best), bins[0]);

  const varName = domain === "discrete" ? "n" : "t";
  const freqVar = domain === "discrete" ? "k" : "\\omega";

  const steps = [
    `N = ${N} points, sampling period Δt = ${dt.toFixed(4)}`,
    `Sampling frequency fs = 1/Δt = ${fs} Hz`,
    `DFT formula: X[k] = Σ_{n=0}^{N-1} x[n] · e^{-j2πkn/N}`,
    `Frequency resolution: Δf = fs/N = ${(fs / N).toFixed(4)} Hz per bin`,
    `Dominant frequency bin: k=${maxMagBin.k}, f=${maxMagBin.frequency} Hz, |X[${maxMagBin.k}]| = ${maxMagBin.magnitude}`,
  ];

  const result = ComputeFourierResponse.parse({
    latexFormula:
      domain === "discrete"
        ? `X[k] = \\sum_{n=0}^{N-1} x[n] \\, e^{-j \\frac{2\\pi k n}{N}}`
        : `X(\\omega) = \\int_{-\\infty}^{\\infty} x(t)\\, e^{-j\\omega t} \\, dt`,
    bins,
    dominantFrequency: maxMagBin.frequency,
    samplingFrequency: fs,
    steps,
    summary: `DFT of ${N}-point signal. Sampling frequency = ${fs} Hz. Dominant frequency = ${maxMagBin.frequency} Hz (bin k=${maxMagBin.k}, |X|=${maxMagBin.magnitude}).`,
  });

  res.json(result);
});

export default router;
