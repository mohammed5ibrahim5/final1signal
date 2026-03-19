import { Router, type IRouter } from "express";
import { ComputeConvolutionBody, ComputeConvolutionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/convolution", (req, res) => {
  const parsed = ComputeConvolutionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { xValues, xStart, hValues, hStart, domain } = parsed.data;
  const Nx = xValues.length;
  const Nh = hValues.length;

  if (Nx === 0 || Nh === 0) {
    res.status(400).json({ error: "Both signals must be non-empty" });
    return;
  }

  // y[n] = sum_{m} x[m] * h[n-m]
  // y length = Nx + Nh - 1, starting at xStart + hStart
  const Ny = Nx + Nh - 1;
  const yStart = xStart + hStart;
  const yValues: number[] = new Array(Ny).fill(0);

  const steps: Array<{
    k: number;
    terms: string[];
    result: number;
  }> = [];

  for (let k = 0; k < Ny; k++) {
    const n = yStart + k;
    const terms: string[] = [];

    for (let m = 0; m < Nx; m++) {
      const xIdx = m;
      // h index: (n - (xStart + m)) - hStart
      const hIdx = n - (xStart + m) - hStart;
      if (hIdx >= 0 && hIdx < Nh) {
        const xVal = xValues[xIdx];
        const hVal = hValues[hIdx];
        const product = xVal * hVal;
        yValues[k] += product;
        terms.push(`x[${xStart + m}]·h[${n - (xStart + m)}] = (${xVal})·(${hVal}) = ${product}`);
      }
    }

    yValues[k] = Math.round(yValues[k] * 1e9) / 1e9;

    steps.push({
      k: n,
      terms: terms.length > 0 ? terms : [`y[${n}] = 0 (no overlapping terms)`],
      result: yValues[k],
    });
  }

  const yIndices = Array.from({ length: Ny }, (_, i) => yStart + i);
  const varName = domain === "discrete" ? "n" : "t";

  const result = ComputeConvolutionResponse.parse({
    latexFormula:
      domain === "discrete"
        ? `y[${varName}] = x[${varName}] * h[${varName}] = \\sum_{m=-\\infty}^{\\infty} x[m] \\cdot h[${varName}-m]`
        : `y(${varName}) = x(${varName}) * h(${varName}) = \\int_{-\\infty}^{\\infty} x(\\tau) h(${varName}-\\tau)\\,d\\tau`,
    yValues,
    yStart,
    yIndices,
    steps,
    length: Ny,
    summary: `x has ${Nx} points starting at ${xStart}, h has ${Nh} points starting at ${hStart}. y = x*h has ${Ny} points starting at ${yStart} (length = Nx + Nh - 1 = ${Nx} + ${Nh} - 1 = ${Ny}).`,
  });

  res.json(result);
});

export default router;
