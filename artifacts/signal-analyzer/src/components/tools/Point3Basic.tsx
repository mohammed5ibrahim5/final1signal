import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2 } from 'lucide-react';
import { useEvaluateBasicSignals } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point3Basic() {
  const [tInput, setTInput] = useState("-2 -1 0 1 2");
  const [shiftInput, setShiftInput] = useState("1");
  const [domain, setDomain] = useState<"continuous" | "discrete">("discrete");
  const [extendToInfinity, setExtendToInfinity] = useState(false);

  const tValues = useMemo(() => parseNumberArray(tInput), [tInput]);
  const shiftValue = parseFloat(shiftInput) || 0;

  const mutation = useEvaluateBasicSignals();

  const handleApply = () => {
    mutation.mutate({ data: { tValues, domain, shiftValue } });
  };

  const chartData = useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.rows.map(r => ({
      t: r.t,
      u: r.unitStep,
      delta: r.delta,
      r: r.ramp,
      u_shifted: r.shiftedStep
    }));
  }, [mutation.data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-primary font-arabic"><Settings2 className="w-5 h-5" />لوحة التحكم</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Time/Index (t/n)</Label>
              <Input value={tInput} onChange={e => setTInput(e.target.value)} placeholder="-3 -2 -1 0 1 2 3" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Shift 'a' for u(t-a)</Label>
              <Input value={shiftInput} onChange={e => setShiftInput(e.target.value)} placeholder="1" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Continuous</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Discrete</button>
              </div>
            </div>
            {domain === "continuous" && (
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={extendToInfinity}
                    onChange={(e) => setExtendToInfinity(e.target.checked)}
                    className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                  />
                  Extend to ±∞ (CT signals)
                </Label>
                <p className="text-xs text-slate-500">Show vertical jumps and extend signal to infinity with 0 values</p>
              </div>
            )}
            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري التوليد..." : <><Play className="w-5 h-5 ml-2 fill-current" /> توليد الإشارات</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="shadow-md border-slate-200">
              <div className="bg-blue-50 px-6 py-4 border-b flex items-center justify-between"><h2 className="text-lg font-bold text-blue-900 font-arabic">التعريف الرياضي (Definitions)</h2></div>
              <CardContent className="p-6 space-y-8" dir="ltr">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-xl text-center">
                  <h4 className="text-lg font-bold text-blue-800 mb-6 font-arabic">Unit Step</h4>
                  <div className="katex-block mx-auto w-full max-w-2xl h-[140px] flex items-center justify-center p-4 bg-white rounded-xl shadow-lg border">
                    <BlockMath math={mutation.data.latexUnitStep} />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-8 shadow-xl text-center">
                  <h4 className="text-lg font-bold text-red-800 mb-6 font-arabic">Impulse</h4>
                  <div className="katex-block mx-auto w-full max-w-2xl h-[140px] flex items-center justify-center p-4 bg-white rounded-xl shadow-lg border">
                    <BlockMath math={mutation.data.latexDelta} />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-8 shadow-xl text-center">
                  <h4 className="text-lg font-bold text-emerald-800 mb-6 font-arabic">Ramp</h4>
                  <div className="katex-block mx-auto w-full max-w-2xl h-[140px] flex items-center justify-center p-4 bg-white rounded-xl shadow-lg border">
                    <BlockMath math={mutation.data.latexRamp} />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-8 shadow-xl text-center">
                  <h4 className="text-lg font-bold text-purple-800 mb-6 font-arabic">Shifted Step</h4>
                  <div className="katex-block mx-auto w-full max-w-2xl h-[140px] flex items-center justify-center p-4 bg-white rounded-xl shadow-lg border">
                    <BlockMath math={mutation.data.latexShifted} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-mono" dir="ltr">u({domain === 'discrete' ? 'n' : 't'})</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[{ key: 'u', name: 'Unit Step', color: '#2563eb' }]} height={250} processDiscontinuities={domain === 'continuous'} extendToInfinity={domain === 'continuous' && extendToInfinity} /></CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-mono" dir="ltr">δ({domain === 'discrete' ? 'n' : 't'})</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[{ key: 'delta', name: 'Impulse', color: '#ef4444' }]} height={250} processDiscontinuities={domain === 'continuous'} extendToInfinity={domain === 'continuous' && extendToInfinity} /></CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-mono" dir="ltr">r({domain === 'discrete' ? 'n' : 't'})</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[{ key: 'r', name: 'Ramp', color: '#10b981' }]} height={250} processDiscontinuities={domain === 'continuous'} extendToInfinity={domain === 'continuous' && extendToInfinity} /></CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-mono" dir="ltr">u({domain === 'discrete' ? 'n' : 't'}-{shiftValue})</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[{ key: 'u_shifted', name: 'Shifted Step', color: '#8b5cf6' }]} height={250} processDiscontinuities={domain === 'continuous'} extendToInfinity={domain === 'continuous' && extendToInfinity} /></CardContent>
              </Card>
            </div>

            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="pb-4 border-b"><CardTitle className="font-arabic">النتائج (Values)</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center" dir="ltr">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr><th className="py-3">t/n</th><th className="py-3 text-blue-600">u</th><th className="py-3 text-red-600">δ</th><th className="py-3 text-emerald-600">r</th><th className="py-3 text-purple-600">u_shift</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mutation.data.rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 font-bold">{r.t}</td>
                        <td className="text-blue-600 font-bold">{r.unitStep}</td>
                        <td className="text-red-600 font-bold">{r.delta}</td>
                        <td className="text-emerald-600 font-bold">{r.ramp}</td>
                        <td className="text-purple-600 font-bold">{r.shiftedStep}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
