import { Router, type IRouter } from "express";
import { OddEvenDecomposeBody, OddEvenDecomposeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/signal/odd-even", (req, res) => {
  const parsed = OddEvenDecomposeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nValues, xValues, domain } = parsed.data;

  if (nValues.length !== xValues.length) {
    res.status(400).json({ error: "nValues and xValues must have equal length" });
    return;
  }

  const varName = domain === "discrete" ? "n" : "t";

  // Build lookup for x[n] → interpolate x[-n] from the given data
  const lookup = new Map<number, number>();
  nValues.forEach((n, i) => lookup.set(n, xValues[i]));

  const steps: Array<{
    n: number;
    xN: number;
    xNeg: number;
    evenStep: string;
    oddStep: string;
    evenValue: number;
    oddValue: number;
  }> = [];

  const evenValues: number[] = [];
  const oddValues: number[] = [];

  nValues.forEach((n, i) => {
    const xN = xValues[i];
    // x[-n]: look up the value at -n
    const xNeg = lookup.has(-n) ? lookup.get(-n)! : 0;
    const evenVal = (xN + xNeg) / 2;
    const oddVal = (xN - xNeg) / 2;

    evenValues.push(evenVal);
    oddValues.push(oddVal);

    steps.push({
      n,
      xN,
      xNeg,
      evenStep: `(${xN} + ${xNeg}) / 2 = ${evenVal.toFixed(4)}`,
      oddStep: `(${xN} - ${xNeg}) / 2 = ${oddVal.toFixed(4)}`,
      evenValue: Math.round(evenVal * 1e6) / 1e6,
      oddValue: Math.round(oddVal * 1e6) / 1e6,
    });
  });

  // Verification: x_e + x_o should equal x
  const verificationSteps = nValues.map((n, i) => {
    const reconstructed = (evenValues[i] + oddValues[i]).toFixed(4);
    return `x_e[${n}] + x_o[${n}] = ${evenValues[i].toFixed(4)} + ${oddValues[i].toFixed(4)} = ${reconstructed} = x[${n}] = ${xValues[i]} ✓`;
  });

  const result = OddEvenDecomposeResponse.parse({
    latexEven: `x_e[${varName}] = \\frac{x[${varName}] + x[-${varName}]}{2}`,
    latexOdd: `x_o[${varName}] = \\frac{x[${varName}] - x[-${varName}]}{2}`,
    nValues,
    evenValues,
    oddValues,
    originalValues: xValues,
    steps,
    verificationSteps,
    summary: `The signal is decomposed into its even part x_e[${varName}] and odd part x_o[${varName}]. x[-${varName}] is obtained by reflecting the signal. Verification: x_e[${varName}] + x_o[${varName}] = x[${varName}] for all points.`,
  });

  res.json(result);
});

export default router;
