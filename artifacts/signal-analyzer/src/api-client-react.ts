import { useState } from "react";

type MutationOptions<TData> = {
  mutation?: {
    onError?: (err: unknown) => void;
  };
};

type MutationResult<TVars, TData> = {
  data: TData | null;
  isPending: boolean;
  mutate: (vars: TVars) => void;
};

function createMutation<TVars, TData>(
  compute: (vars: TVars) => TData,
  opts?: MutationOptions<TData>,
): MutationResult<TVars, TData> {
  const [data, setData] = useState<TData | null>(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = (vars: TVars) => {
    try {
      setIsPending(true);
      const result = compute(vars);
      setData(result);
    } catch (err) {
      opts?.mutation?.onError?.(err);
      console.error("[api-client-react] compute error:", err);
    } finally {
      setIsPending(false);
    }
  };

  return { data, isPending, mutate };
}

// 1) Transform signal x(t) -> x(g(t)) تقريبًا بتحويل الفهرس وفق التعبير
export function useTransformSignal(
  opts?: MutationOptions<TransformSignalResponse>,
): MutationResult<TransformSignalVars, TransformSignalResponse> {
  return createMutation<TransformSignalVars, TransformSignalResponse>(
    ({ data }) => {
      const { tValues, xValues, expression } = data;

      // تعبير بسيط جدًا: يدعم فقط t + c أو t - c
      // ويفسَّر بالطريقة القياسية: x(t + 1) ⇒ تتحرك الإشارة وحدة واحدة ناحية اليسار
      const match = expression.match(/t\s*([+\-])\s*([0-9.]+)/);
      const a = match ? parseFloat(match[2]) : 0;
      const c = match ? (match[1] === "+" ? a : -a) : 0;

      // y(t) = x(t + c) ⇒ كل عينة تتحرك إلى t' = t - c
      const newTValues = tValues.map((t) => t - c);

      const latexFormula = `x(${expression})`;
      const summary =
        "تم تطبيق إزاحة على الإشارة؛ حيث يعبر x(t + 1) عن تحريك الإشارة وحدة واحدة ناحية اليسار، و x(t - 1) ناحية اليمين.";

      const steps = tValues.map((t, idx) => {
        const newT = t - c;
        return {
          oldT: t,
          expression,
          newT,
          xValue: xValues[idx],
        };
      });

      return {
        newTValues,
        xValues: [...xValues],
        latexFormula,
        summary,
        steps,
      };
    },
    opts,
  );
}

type TransformSignalVars = {
  data: {
    tValues: number[];
    xValues: number[];
    expression: string;
    domain: "continuous" | "discrete";
  };
};

type TransformSignalResponse = {
  newTValues: number[];
  xValues: number[];
  latexFormula: string;
  summary: string;
  steps: {
    oldT: number;
    expression: string;
    newT: number;
    xValue: number;
  }[];
};

// 2) Odd/Even decomposition
export function useOddEvenDecompose(
  opts?: MutationOptions<OddEvenResponse>,
): MutationResult<OddEvenVars, OddEvenResponse> {
  return createMutation<OddEvenVars, OddEvenResponse>(
    ({ data }) => {
      const { nValues, xValues } = data;
      const map = new Map<number, number>();
      nValues.forEach((n, i) => {
        map.set(n, xValues[i]);
      });

      const allNs = Array.from(
        new Set([...nValues, ...nValues.map((n) => -n)]),
      ).sort((a, b) => a - b);

      const originalValues: number[] = [];
      const evenValues: number[] = [];
      const oddValues: number[] = [];
      const steps: OddEvenStep[] = [];

      for (const n of allNs) {
        const xN = map.get(n) ?? 0;
        const xNeg = map.get(-n) ?? 0;
        const xEven = (xN + xNeg) / 2;
        const xOdd = (xN - xNeg) / 2;

        originalValues.push(xN);
        evenValues.push(xEven);
        oddValues.push(xOdd);

        steps.push({
          n,
          xN,
          xNeg,
          evenStep: `(x[${n}] + x[${-n}]) / 2 = (${xN} + ${xNeg}) / 2`,
          evenValue: xEven,
          oddStep: `(x[${n}] - x[${-n}]) / 2 = (${xN} - ${xNeg}) / 2`,
          oddValue: xOdd,
        });
      }

      const latexEven = "x_e[n] = (x[n] + x[-n]) / 2";
      const latexOdd = "x_o[n] = (x[n] - x[-n]) / 2";

      return {
        nValues: allNs,
        originalValues,
        evenValues,
        oddValues,
        latexEven,
        latexOdd,
        steps,
      };
    },
    opts,
  );
}

type OddEvenVars = {
  data: {
    nValues: number[];
    xValues: number[];
    domain: "continuous" | "discrete";
  };
};

type OddEvenStep = {
  n: number;
  xN: number;
  xNeg: number;
  evenStep: string;
  evenValue: number;
  oddStep: string;
  oddValue: number;
};

type OddEvenResponse = {
  nValues: number[];
  originalValues: number[];
  evenValues: number[];
  oddValues: number[];
  latexEven: string;
  latexOdd: string;
  steps: OddEvenStep[];
};

// 3) Basic signals: نولّد u, δ, ramp, shifted
export function useEvaluateBasicSignals(): MutationResult<
  BasicSignalsVars,
  BasicSignalsResponse
> {
  return createMutation<BasicSignalsVars, BasicSignalsResponse>(({ data }) => {
    const { tValues, domain, shiftValue } = data;

    const rows = tValues.map((t) => {
      const u = t >= 0 ? 1 : 0;
      const delta = t === 0 ? 1 : 0;
      const ramp = t >= 0 ? t : 0;
      const shiftedStep = t - shiftValue >= 0 ? 1 : 0;

      return {
        t,
        unitStep: u,
        delta,
        ramp,
        shiftedStep,
      };
    });

    const latexUnitStep = "u(t) = \\begin{cases}0, & t < 0 \\\\ 1, & t \\ge 0\\end{cases}";
    const latexDelta = "\\delta(t) = 0,\\ t \\ne 0;\\ \\delta(0) = 1";
    const latexRamp = "r(t) = t\\,u(t)";
    const latexShifted = `u(t-${shiftValue})`;

    return {
      rows,
      latexUnitStep,
      latexDelta,
      latexRamp,
      latexShifted,
      domain,
    };
  });
}

type BasicSignalsVars = {
  data: {
    tValues: number[];
    domain: "continuous" | "discrete";
    shiftValue: number;
  };
};

type BasicSignalsRow = {
  t: number;
  unitStep: number;
  delta: number;
  ramp: number;
  shiftedStep: number;
};

type BasicSignalsResponse = {
  rows: BasicSignalsRow[];
  latexUnitStep: string;
  latexDelta: string;
  latexRamp: string;
  latexShifted: string;
  domain: "continuous" | "discrete";
};

// 4) Sinusoid evaluation + periodicity
export function useParseAndEvaluateEquation(): MutationResult<EquationVars, EquationResponse> {
  return createMutation<EquationVars, EquationResponse>(({ data }) => {
    const { equation, tStart, tEnd, numPoints, domain } = data;

    // Simple parser for A*cos(ωt + φ) or A*sin(ωt + φ)
    const cosMatch = equation.match(/(\d*\.?\d*)\s*\*\s*?cos\s*\(\s*([\d\pi]*)\s*\*\s*(t|n)\s*\+\s*([\d\pi\/\-\+\.]*)\s*\)/i);
    const sinMatch = equation.match(/(\d*\.?\d*)\s*\*\s*?sin\s*\(\s*([\d\pi]*)\s*\*\s*(t|n)\s*\+\s*([\d\pi\/\-\+\.]*)\s*\)/i);

    const match = cosMatch || sinMatch;
    if (!match) {
      throw new Error('Equation format not recognized. Use: A*cos(ωt + φ) or A*sin(ωt + φ)');
    }

    const [, amplitudeStr, omegaStr, varName, phiStr] = match;
    const amplitude = parseFloat(amplitudeStr) || 1;
    let omega = parseFloat(omegaStr.replace('pi', '3.14159')) || 1;
    if (omegaStr.includes('pi')) omega *= Math.PI;
    let phi = parseFloat(phiStr.replace('pi', '3.14159')) || 0;
    if (phiStr.includes('pi')) phi *= Math.PI;

    const signalType = cosMatch ? 'cosine' : 'sine';

    const steps = [
      `Parsed equation: ${equation}`,
      `Detected: A = ${amplitude}, ω = ${omega.toFixed(3)}, φ = ${phi.toFixed(3)}`,
      `Signal type: ${signalType}`,
      `Evaluation range: t = [${tStart}, ${tEnd}] (${numPoints} points)`
    ];

    // Generate points (same as original)
    const points: { t: number; value: number }[] = [];
    const step = (tEnd - tStart) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      const t = tStart + i * step;
      const arg = omega * t + phi;
      const v = signalType === "cosine" ? amplitude * Math.cos(arg) : amplitude * Math.sin(arg);
      points.push({ t, value: v });
    }

    const isPeriodic = omega !== 0;
    const period = isPeriodic ? (2 * Math.PI) / Math.abs(omega) : Infinity;

    const baseSym = signalType === "cosine" ? "cos" : "sin";
    const latexFormula = `x(${domain === "discrete" ? "n" : "t"}) = ${amplitude.toFixed(2)}\\,${baseSym}(${omega.toFixed(3)}${domain === "discrete" ? "n" : "t"} + ${phi.toFixed(3)})`;

    return {
      points,
      latexFormula,
      parsedParams: { amplitude, omega, phi, signalType, equation },
      parsingSteps: steps,
      periodicitySteps: [
        "x(t) = A cos/sin(ωt + φ) is periodic if ω ≠ 0",
        `Fundamental period T₀ = 2π / |ω| = ${(2 * Math.PI / Math.abs(omega)).toFixed(3)}`
      ],
      isPeriodic,
      period: isFinite(period) ? period : 0,
    };
  });
}

type EquationVars = {
  data: {
    equation: string;
    tStart: number;
    tEnd: number;
    numPoints: number;
    domain: "continuous" | "discrete";
  };
};

type EquationResponse = {
  points: { t: number; value: number }[];
  latexFormula: string;
  parsedParams: {
    amplitude: number;
    omega: number;
    phi: number;
    signalType: "cosine" | "sine";
    equation: string;
  };
  parsingSteps: string[];
  periodicitySteps: string[];
  isPeriodic: boolean;
  period: number;
};

// Keep original for backward compatibility
export function useEvaluateSinusoid(): MutationResult<
  SinusoidVars,
  SinusoidResponse
> {
  return createMutation<SinusoidVars, SinusoidResponse>(({ data }) => {
    const {
      amplitude,
      omega,
      phi,
      tStart,
      tEnd,
      numPoints,
      signalType,
      domain,
    } = data;

    const points: { t: number; value: number }[] = [];
    const step = (tEnd - tStart) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const t = tStart + i * step;
      const arg = omega * t + phi;
      const v =
        signalType === "cosine" ? amplitude * Math.cos(arg) : amplitude * Math.sin(arg);
      points.push({ t, value: v });
    }

    const isPeriodic = omega !== 0;
    const period = isPeriodic ? (2 * Math.PI) / Math.abs(omega) : Infinity;
    const periodicitySteps: string[] = [];

    periodicitySteps.push("For a sinusoid x(t) = A cos(ωt + φ):");
    periodicitySteps.push("It is periodic if ω ≠ 0.");
    if (isPeriodic) {
      periodicitySteps.push("Fundamental period T₀ = 2π / |ω|.");
      periodicitySteps.push(`So T₀ = 2π / |${omega.toFixed(3)}|.`);
    } else {
      periodicitySteps.push("Here ω = 0 ⇒ signal is not periodic in time.");
    }

    const baseSym = signalType === "cosine" ? "cos" : "sin";
    const latexFormula = `x(${domain === "discrete" ? "n" : "t"}) = ${amplitude.toFixed(
      2,
    )}\\,${baseSym}(${omega.toFixed(3)}${domain === "discrete" ? "n" : "t"} + ${phi.toFixed(
      3,
    )})`;

    return {
      points,
      latexFormula,
      periodicitySteps,
      isPeriodic,
      period: isFinite(period) ? period : 0,
    };
  });
}

type SinusoidVars = {
  data: {
    amplitude: number;
    omega: number;
    phi: number;
    tStart: number;
    tEnd: number;
    numPoints: number;
    signalType: "cosine" | "sine";
    domain: "continuous" | "discrete";
  };
};

type SinusoidResponse = {
  points: { t: number; value: number }[];
  latexFormula: string;
  periodicitySteps: string[];
  isPeriodic: boolean;
  period: number;
};

// 5) Energy & Power
export function useComputeEnergyPower(): MutationResult<
  EnergyPowerVars,
  EnergyPowerResponse
> {
  return createMutation<EnergyPowerVars, EnergyPowerResponse>(({ data }) => {
    const { tValues, xValues, domain } = data;

    const dt =
      domain === "continuous" && tValues.length > 1
        ? Math.abs(tValues[1] - tValues[0])
        : 1;

    let energy = 0;
    const steps: EnergyPowerStep[] = [];
    for (let i = 0; i < xValues.length; i++) {
      const x = xValues[i];
      const x2 = x * x;
      const contrib = x2 * dt;
      energy += contrib;
      steps.push({
        t: tValues[i],
        x,
        xSquared: x2,
        contribution: contrib,
        runningEnergy: energy
      });
    }

    const duration =
      tValues.length > 1
        ? Math.abs(tValues[tValues.length - 1] - tValues[0]) + dt
        : 1;
    const power = energy / duration;

    let classification: "energy" | "power" | "neither" = "neither";
    let classificationReason = "";
    if (energy > 0 && energy < 1e6 && power < 1e-3) {
      classification = "energy";
      classificationReason =
        "Finite non-zero energy with very small average power ⇒ energy signal.";
    } else if (power > 0 && power < 1e6) {
      classification = "power";
      classificationReason =
        "Finite non-zero average power (energy grows with duration) ⇒ power signal.";
    } else {
      classificationReason = "Signal does not clearly fit pure energy or power class.";
    }

    const latexEnergy =
      domain === "continuous"
        ? "E = \\int_{-\\infty}^{\\infty} |x(t)|^2\\,dt"
        : "E = \\sum_{n=-\\infty}^{\\infty} |x[n]|^2";
    const latexPower =
      domain === "continuous"
        ? "P = \\lim_{T \\to \\infty} \\frac{1}{2T} \\int_{-T}^{T} |x(t)|^2\\,dt"
        : "P = \\lim_{N \\to \\infty} \\frac{1}{2N+1} \\sum_{n=-N}^{N} |x[n]|^2";

    return {
      energy,
      power,
      classification,
      classificationReason,
      latexEnergy,
      latexPower,
      domain,
    };
  });
}

type EnergyPowerVars = {
  data: {
    tValues: number[];
    xValues: number[];
    domain: "continuous" | "discrete";
  };
};

type EnergyPowerResponse = {
  energy: number;
  power: number;
  classification: "energy" | "power" | "neither";
  classificationReason: string;
  latexEnergy: string;
  latexPower: string;
  domain: "continuous" | "discrete";
};

// 6) Discrete-time convolution
export function useComputeConvolution(): MutationResult<
  ConvolutionVars,
  ConvolutionResponse
> {
  return createMutation<ConvolutionVars, ConvolutionResponse>(({ data }) => {
    const { xValues, hValues, xStart, hStart, domain } = data;

    const yLen = xValues.length + hValues.length - 1;
    const yValues: number[] = [];
    const yIndices: number[] = [];
    const steps: ConvolutionStep[] = [];

    const yStart = xStart + hStart;

    for (let k = 0; k < yLen; k++) {
      const n = yStart + k;
      let sum = 0;
      const terms: string[] = [];

      for (let m = 0; m < xValues.length; m++) {
        const hIndex = k - m;
        if (hIndex >= 0 && hIndex < hValues.length) {
          const prod = xValues[m] * hValues[hIndex];
          sum += prod;
          terms.push(`x[${xStart + m}]·h[${hStart + hIndex}] = ${xValues[m]}·${hValues[hIndex]}`);
        }
      }

      yValues.push(sum);
      yIndices.push(n);
      steps.push({ k: n, terms, result: sum });
    }

    const latexFormula =
      domain === "continuous"
        ? "y(t) = (x * h)(t) = \\int_{-\\infty}^{\\infty} x(\\tau)h(t-\\tau)\\,d\\tau"
        : "y[n] = \\sum_{k=-\\infty}^{\\infty} x[k]\\,h[n-k]";

    return {
      yValues,
      yIndices,
      length: yLen,
      steps,
      latexFormula,
    };
  });
}

type ConvolutionVars = {
  data: {
    xValues: number[];
    hValues: number[];
    xStart: number;
    hStart: number;
    domain: "continuous" | "discrete";
  };
};

type ConvolutionStep = {
  k: number;
  terms: string[];
  result: number;
};

type ConvolutionResponse = {
  yValues: number[];
  yIndices: number[];
  length: number;
  steps: ConvolutionStep[];
  latexFormula: string;
};

// 7) Sampling & aliasing
export function useComputeSampling(): MutationResult<
  SamplingVars,
  SamplingResponse
> {
  return createMutation<SamplingVars, SamplingResponse>(({ data }) => {
    const { signalFrequency, samplingFrequency, duration } = data;

    const nyquistRate = 2 * signalFrequency;
    const isAliasing = samplingFrequency < nyquistRate;

    // continuous-time reference signal
    const contPoints: { t: number; value: number }[] = [];
    const Ncont = 400;
    for (let i = 0; i < Ncont; i++) {
      const t = (duration * i) / (Ncont - 1);
      contPoints.push({
        t,
        value: Math.sin(2 * Math.PI * signalFrequency * t),
      });
    }

    // sampled points
    const Ts = 1 / samplingFrequency;
    const sampledPoints: { t: number; value: number }[] = [];
    for (let n = 0; n <= duration / Ts + 1e-9; n++) {
      const t = n * Ts;
      sampledPoints.push({
        t,
        value: Math.sin(2 * Math.PI * signalFrequency * t),
      });
    }

    // simple reconstructed curve (zero-order hold-like)
    const reconstructedPoints = contPoints.map((p) => {
      let nearest = sampledPoints[0];
      let best = Math.abs(p.t - nearest.t);
      for (const s of sampledPoints) {
        const d = Math.abs(p.t - s.t);
        if (d < best) {
          best = d;
          nearest = s;
        }
      }
      return { t: p.t, value: nearest.value };
    });

    // apparent aliasing frequency
    let aliasingFrequency = signalFrequency;
    if (isAliasing) {
      const fs = samplingFrequency;
      const f = signalFrequency;
      const k = Math.round(f / fs);
      aliasingFrequency = Math.abs(f - k * fs);
    }

    const latexFormula =
      "x(t) = \\sin(2\\pi f_{sig} t),\\quad x_s[n] = x(nT_s),\\ T_s = 1/f_s";

    return {
      latexFormula,
      nyquistRate,
      isAliasing,
      aliasingFrequency,
      continuousPoints: contPoints,
      sampledPoints,
      reconstructedPoints,
    };
  });
}

type SamplingVars = {
  data: {
    signalFrequency: number;
    samplingFrequency: number;
    duration: number;
  };
};

type SamplingResponse = {
  latexFormula: string;
  nyquistRate: number;
  isAliasing: boolean;
  aliasingFrequency: number;
  continuousPoints: { t: number; value: number }[];
  sampledPoints: { t: number; value: number }[];
  reconstructedPoints: { t: number; value: number }[];
};

// 8) Fourier, Z-transform, report: يمكن تركها مبسطة/فارغة حالياً أو تكميلها لاحقاً
export function useComputeFourier(): MutationResult<FourierVars, FourierResponse> {
  return createMutation<FourierVars, FourierResponse>(({ data }) => {
    const { tValues, xValues, domain } = data;
    const N = tValues.length;
    const dt = domain === 'continuous' && N > 1 ? Math.abs(tValues[1] - tValues[0]) : 1;
    const samplingFrequency = 1 / dt;

    // DFT bins
    const bins: FourierBin[] = [];
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += xValues[n] * Math.cos(angle);
        imag -= xValues[n] * Math.sin(angle); // Note negative for DFT convention
      }
      const magnitude = Math.sqrt(real * real + imag * imag);
      const phase = Math.atan2(imag, real);
      const frequency = (k / N) * samplingFrequency;
      bins.push({ k, frequency, realPart: real, imagPart: imag, magnitude, phase });
    }

    // Dominant frequency (max magnitude bin != DC)
    let dominantBin = bins[0];
    for (let i = 1; i < bins.length; i++) {
      if (bins[i].magnitude > dominantBin.magnitude) {
        dominantBin = bins[i];
      }
    }
    const dominantFrequency = dominantBin.frequency;

    const latexFormula = domain === 'discrete' ? 'X[k] = \\sum_{n=0}^{N-1} x[n] e^{-j 2 \\pi kn / N}' : 'X(f) \\approx \\sum x[n] \\Delta t \\, e^{-j 2 \\pi f n \\Delta t}';

    return {
      bins,
      latexFormula,
      samplingFrequency,
      dominantFrequency,
      domain,
    };
  });
}

type FourierVars = {
  data: {
    tValues: number[];
    xValues: number[];
    domain: "continuous" | "discrete";
  };
};

type FourierBin = {
  k: number;
  frequency: number;
  realPart: number;
  imagPart: number;
  magnitude: number;
  phase: number;
};

type FourierResponse = {
  bins: FourierBin[];
  latexFormula: string;
  samplingFrequency: number;
  dominantFrequency: number;
  domain: "continuous" | "discrete";
};


export function useComputeZTransform(): MutationResult<ZTransformVars, ZTransformResponse> {
  return createMutation<ZTransformVars, ZTransformResponse>(({ data }) => {
    const { xValues, nStart } = data;
    const N = xValues.length;

    // Z-Transform terms: x[n] * z^{-(n - nStart)}
    const zTransformTerms: ZTransformStep[] = [];
    let latexTerms: string[] = [];
    for (let i = 0; i < N; i++) {
      const n = nStart + i;
      const power = -(n - nStart);
      const coeff = xValues[i];
      const termStr = `${coeff.toFixed(2)}z^{${power}}`;
      const latexTerm = coeff === 0 ? '' : `${coeff.toFixed(2)} z^{${power}}`;
      zTransformTerms.push({ n, term: termStr });
      if (coeff !== 0) latexTerms.push(latexTerm);
    }

    const latexZTransform = latexTerms.length > 0 ? `X(z) = ${latexTerms.join(' + ')}` : 'X(z) = 0';

    // ROC for finite-length right-sided: |z| > 0
    const rocDescription = 'ROC: \\{|z| > 0\\} (finite length right-sided sequence)';

    // DFT approximation (N-point DFT for visualization, k=0 to N-1)
    const dftBins: DFTBin[] = [];
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      for (let i = 0; i < N; i++) {
        const n = nStart + i;
        const angle = -2 * Math.PI * k * (n - nStart) / N;
        real += xValues[i] * Math.cos(angle);
        imag += xValues[i] * Math.sin(angle);
      }
      const magnitude = Math.sqrt(real * real + imag * imag);
      const phase = Math.atan2(imag, real);
      dftBins.push({ k, realPart: real, imagPart: imag, magnitude, phase });
    }

    return {
      latexZTransform,
      zTransformTerms,
      rocDescription,
      dftBins,
      summary: `Z-Transform computed for x[n] (${N} samples starting n=${nStart}). Polynomial degree ${Math.max(0, N - 1)}.`,
    };
  });
}

type ZTransformVars = {
  data: {
    xValues: number[];
    nStart: number;
    domain: "discrete";
  };
};

type ZTransformStep = {
  n: number;
  term: string;
};

type DFTBin = {
  k: number;
  realPart: number;
  imagPart: number;
  magnitude: number;
  phase: number;
};

type ZTransformResponse = {
  latexZTransform: string;
  zTransformTerms: ZTransformStep[];
  rocDescription: string;
  dftBins: DFTBin[];
  summary: string;
};


export function useGenerateReport(): MutationResult<ReportVars, ReportResponse> {
  return createMutation<ReportVars, ReportResponse>(({ data }) => {
    const { tValues, xValues, domain, label = 'Test Signal' } = data;
    const N = tValues.length;

    // Energy/Power section
    const dt = domain === 'continuous' && N > 1 ? Math.abs(tValues[1] - tValues[0]) : 1;
    let energy = 0;
    for (let i = 0; i < N; i++) {
      energy += xValues[i] * xValues[i] * dt;
    }
    const duration = N > 1 ? Math.abs(tValues[N - 1] - tValues[0]) + dt : 1;
    const power = energy / duration;
    const classification = energy > 0 && energy < 1e6 && power < 1e-3 ? 'energy' : power > 0 && power < 1e6 ? 'power' : 'neither';

    // Odd/even check (simple: check symmetry)
    const isEven = xValues.every((x, i) => Math.abs(xValues[N - 1 - i] - x) < 1e-6);
    const isOdd = xValues.every((x, i) => Math.abs(xValues[N - 1 - i] + x) < 1e-6);

    // DFT magnitude peak for dominant frequency
    let maxMag = 0;
    let dominantK = 0;
    for (let k = 0; k < Math.min(N, 8); k++) {
      let real = 0, imag = 0;
      for (let i = 0; i < N; i++) {
        const angle = -2 * Math.PI * k * i / N;
        real += xValues[i] * Math.cos(angle);
        imag += xValues[i] * Math.sin(angle);
      }
      const mag = Math.sqrt(real * real + imag * imag);
      if (mag > maxMag) {
        maxMag = mag;
        dominantK = k;
      }
    }
    const dominantFreq = (dominantK / N) * (domain === 'continuous' ? 1 / dt : 1);

    const sections = [
      {
        title: 'الطاقة والقدرة',
        latex: domain === 'continuous' ? 'E = \\int |x(t)|^2 dt' : 'E = \\sum |x[n]|^2',
        result: `${classification === 'energy' ? 'طاقة' : 'قدرة'} (${classification})`,
        details: [`E = ${energy.toFixed(3)}`, `P = ${power.toFixed(3)}`]
      },
      {
        title: 'التماثل',
        latex: 'x[-n] = x[n] \\ (متساوي), \\ x[-n] = -x[n] \\ (فردي)',
        result: isEven ? 'متساوي' : isOdd ? 'فردي' : 'لا يوجد تماثل واضح',
        details: isEven || isOdd ? [`نوع التماثل: ${isEven ? 'متساوي' : 'فردي'}`] : []
      },
      {
        title: 'التردد السائد (DFT)',
        latex: 'X[k] = \\sum x[n] e^{-j 2\pi kn/N}',
        result: `k=${dominantK} (${dominantFreq.toFixed(2)} Hz)`,
        details: [`أقصى |X[k]| = ${maxMag.toFixed(2)}`]
      }
    ];

    const signalPoints = tValues.map((t, i) => ({ t, x: xValues[i] }));

    const summary = `تقرير شامل للإشارة "${label}" (${domain === 'continuous' ? 'مستمرة' : 'منفصلة'}, ${N} عينة). التصنيف: ${classification} signal. التردد السائد عند k=${dominantK}.`;

    return {
      signalLabel: label,
      domain,
      sections,
      signalPoints,
      summary
    };
  });
}

type ReportVars = {
  data: {
    tValues: number[];
    xValues: number[];
    domain: "continuous" | "discrete";
    label?: string;
  };
};

type ReportSection = {
  title: string;
  latex: string;
  result: string;
  details: string[];
};

type ReportResultSignalPointsItem = {
  t: number;
  x: number;
};

type ReportResponse = {
  signalLabel: string;
  domain: string;
  sections: ReportSection[];
  signalPoints: ReportResultSignalPointsItem[];
  summary: string;
};


