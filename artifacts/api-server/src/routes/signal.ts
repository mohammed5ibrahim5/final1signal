import { Router, type IRouter } from "express";
import { TransformSignalBody, TransformSignalResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function evalExpression(expr: string, t: number): number {
  const normalized = expr
    .replace(/\^/g, "**")
    .replace(/(\d)(t)/g, "$1*$2")
    .replace(/(t)(\d+)/g, "$1**$2");
  const fn = new Function("t", `"use strict"; return (${normalized});`);
  return fn(t);
}

function buildSubstitutionStr(expr: string, t: number): string {
  const s = expr.replace(/t/g, `(${t})`);
  return s;
}

function buildLatex(expr: string): string {
  let latex = expr
    .replace(/\*\*/g, "^")
    .replace(/\*/g, " \\cdot ")
    .replace(/t/g, "t");
  return `t' = ${latex}`;
}

router.post("/signal/transform", (req, res) => {
  const parseResult = TransformSignalBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body: " + parseResult.error.message });
    return;
  }

  const { tValues, xValues, expression, domain } = parseResult.data;

  if (tValues.length !== xValues.length) {
    res.status(400).json({ error: "tValues and xValues must have the same length" });
    return;
  }

  if (tValues.length === 0) {
    res.status(400).json({ error: "tValues must not be empty" });
    return;
  }

  let newTValues: number[];
  const steps: Array<{
    oldT: number;
    expression: string;
    newT: number;
    xValue: number;
  }> = [];

  try {
    newTValues = tValues.map((t, i) => {
      const newT = evalExpression(expression, t);
      steps.push({
        oldT: t,
        expression: buildSubstitutionStr(expression, t),
        newT: Math.round(newT * 1e9) / 1e9,
        xValue: xValues[i],
      });
      return Math.round(newT * 1e9) / 1e9;
    });
  } catch {
    res.status(400).json({ error: "Invalid expression: could not evaluate '" + expression + "'" });
    return;
  }

  const latexFormula = buildLatex(expression);

  const varName = domain === "discrete" ? "n" : "t";
  const summary = `Applying the transformation ${varName}' = ${expression}: each ${varName}-value is mapped to a new ${varName}'-value by substituting into the expression. The amplitude x remains unchanged.`;

  const result = TransformSignalResponse.parse({
    latexFormula,
    steps,
    newTValues,
    xValues,
    summary,
  });

  res.json(result);
});

export default router;
