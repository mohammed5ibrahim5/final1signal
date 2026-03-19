import { Router, type IRouter } from "express";
import { ComputeZTransformBody, ComputeZTransformResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/ztransform", (req, res) => {
  const parsed = ComputeZTransformBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { xValues, nStart } = parsed.data;
  const N = xValues.length;

  if (N === 0) {
    res.status(400).json({ error: "xValues must not be empty" });
    return;
  }

  // Z-Transform: X(z) = sum x[n] * z^(-n)
  const zTerms = xValues.map((xn, i) => {
    const n = nStart + i;
    let term: string;
    if (n === 0) term = `${xn}`;
    else if (n === 1) term = `${xn} \\cdot z^{-1}`;
    else if (n === -1) term = `${xn} \\cdot z`;
    else if (n > 0) term = `${xn} \\cdot z^{-${n}}`;
    else term = `${xn} \\cdot z^{${Math.abs(n)}}`;

    return {
      n,
      xN: xn,
      term,
    };
  });

  // Build polynomial string
  const nonZeroTerms = zTerms.filter((t) => t.xN !== 0);
  const zPolyStr = nonZeroTerms.length > 0 ? nonZeroTerms.map((t) => t.term).join(" + ") : "0";

  // DFT
  const dftBins = Array.from({ length: N }, (_, k) => {
    let re = 0;
    let im = 0;
    const terms: string[] = [];

    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      const cosPart = Math.cos(angle);
      const sinPart = Math.sin(angle);
      re += xValues[n] * cosPart;
      im -= xValues[n] * sinPart;
      if (N <= 8) {
        terms.push(`${xValues[n]}·e^{-j2π·${k}·${n}/${N}}`);
      }
    }

    re = Math.round(re * 1e6) / 1e6;
    im = Math.round(im * 1e6) / 1e6;
    const mag = Math.round(Math.sqrt(re ** 2 + im ** 2) * 1e6) / 1e6;
    const phase = Math.round(Math.atan2(im, re) * 1e6) / 1e6;
    const detail =
      N <= 8
        ? `X[${k}] = ${terms.join(" + ")} = ${re} ${im >= 0 ? "+" : "-"} j${Math.abs(im)}`
        : `X[${k}] = Σ x[n]·W_N^{kn} = ${re} ${im >= 0 ? "+" : "-"} j${Math.abs(im)}`;

    return { k, magnitude: mag, phase, realPart: re, imagPart: im, formulaDetail: detail };
  });

  // ROC for finite-length sequences
  const hasNegative = nStart < 0;
  const lastN = nStart + N - 1;
  const hasPositive = lastN > 0;
  let rocDescription = "ROC (Region of Convergence): ";
  if (!hasNegative && !hasPositive) {
    rocDescription += "Entire z-plane (single sample at n=0)";
  } else if (!hasNegative) {
    rocDescription += `z ≠ 0 (causal finite-duration: n from ${nStart} to ${lastN})`;
  } else if (!hasPositive) {
    rocDescription += `z ≠ ∞ (anti-causal finite-duration: n from ${nStart} to ${lastN})`;
  } else {
    rocDescription += `0 < |z| < ∞ (two-sided finite-duration: n from ${nStart} to ${lastN})`;
  }

  const result = ComputeZTransformResponse.parse({
    latexZTransform: `X(z) = \\sum_{n=-\\infty}^{\\infty} x[n] \\, z^{-n}`,
    latexDFT: `X[k] = \\sum_{n=0}^{N-1} x[n] \\, e^{-j \\frac{2\\pi k n}{N}}, \\quad k = 0, 1, \\ldots, N-1`,
    zTransformTerms: zTerms,
    zTransformPolynomial: `X(z) = ${zPolyStr}`,
    dftBins,
    rocDescription,
    summary: `Z-Transform of ${N}-point signal starting at n=${nStart}. X(z) = ${zPolyStr.replace(/\\cdot/g, '·').replace(/z\^{-?[\d]+}/g, '·z^n')}. ${rocDescription}`,
  });

  res.json(result);
});

export default router;
