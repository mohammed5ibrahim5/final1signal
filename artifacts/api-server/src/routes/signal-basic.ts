import { Router, type IRouter } from "express";
import { EvaluateBasicSignalsBody, EvaluateBasicSignalsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function unitStep(t: number): number {
  return t >= 0 ? 1 : 0;
}
function delta(t: number): number {
  return Math.abs(t) < 1e-9 ? 1 : 0;
}
function ramp(t: number): number {
  return t >= 0 ? t : 0;
}

router.post("/signal/basic", (req, res) => {
  const parsed = EvaluateBasicSignalsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tValues, domain, shiftValue } = parsed.data;
  const a = shiftValue ?? 0;
  const varName = domain === "discrete" ? "n" : "t";

  const rows = tValues.map((t) => {
    const u = unitStep(t);
    const d = delta(t);
    const r = ramp(t);
    const shifted = unitStep(t - a);

    const unitStepStep =
      t >= 0
        ? `t=${t} ≥ 0 → u(t) = 1`
        : `t=${t} < 0 → u(t) = 0`;
    const deltaStep =
      Math.abs(t) < 1e-9
        ? `t=${t} ≈ 0 → δ(t) = 1`
        : `t=${t} ≠ 0 → δ(t) = 0`;
    const rampStep =
      t >= 0
        ? `t=${t} ≥ 0 → r(t) = ${t}`
        : `t=${t} < 0 → r(t) = 0`;

    return {
      t,
      unitStep: u,
      delta: d,
      ramp: r,
      shiftedStep: shifted,
      unitStepStep,
      deltaStep,
      rampStep,
    };
  });

  const result = EvaluateBasicSignalsResponse.parse({
    latexUnitStep: `u(${varName}) = \\begin{cases} 1 & ${varName} \\ge 0 \\\\ 0 & ${varName} < 0 \\end{cases}`,
    latexDelta: `\\delta(${varName}) = \\begin{cases} 1 & ${varName} = 0 \\\\ 0 & ${varName} \\neq 0 \\end{cases}`,
    latexRamp: `r(${varName}) = ${varName} \\cdot u(${varName}) = \\begin{cases} ${varName} & ${varName} \\ge 0 \\\\ 0 & ${varName} < 0 \\end{cases}`,
    latexShifted: `u(${varName} - ${a}) = \\begin{cases} 1 & ${varName} \\ge ${a} \\\\ 0 & ${varName} < ${a} \\end{cases}`,
    rows,
    shiftValue: a,
    summary: `Basic signals evaluated at ${tValues.length} points. Unit step u(${varName}) is 1 for ${varName}≥0 and 0 otherwise. Delta δ(${varName}) is 1 only at ${varName}=0. Ramp r(${varName})=${varName}·u(${varName}). Shifted step u(${varName}-${a}) starts at ${varName}=${a}.`,
  });

  res.json(result);
});

export default router;
