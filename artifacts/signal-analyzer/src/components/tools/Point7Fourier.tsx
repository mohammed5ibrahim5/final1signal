import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2 } from 'lucide-react';
import { useComputeFourier } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point7Fourier() {
  const [tInput, setTInput] = useState("0 1 2 3 4 5 6 7");
  const [xInput, setXInput] = useState("1 1 1 1 0 0 0 0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("discrete");

  const tValues = useMemo(() => parseNumberArray(tInput), [tInput]);
  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useComputeFourier();

  const handleApply = () => {
    if (tValues.length !== xValues.length) return;
    mutation.mutate({ data: { tValues, xValues, domain } });
  };

  const magChartData = useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.bins.map(b => ({ k: b.k, mag: b.magnitude }));
  }, [mutation.data]);

  const phaseChartData = useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.bins.map(b => ({ k: b.k, phase: b.phase }));
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
              <Input value={tInput} onChange={e => setTInput(e.target.value)} placeholder="0 1 2 3" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Amplitude (x)</Label>
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 0 1 0" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Transform Type</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>CTFT (Approx)</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>DFT / FFT</button>
              </div>
            </div>
            <Button onClick={handleApply} disabled={mutation.isPending || tValues.length !== xValues.length} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري الحساب..." : <><Play className="w-5 h-5 ml-2 fill-current" /> تحليل الترددات</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="shadow-md border-slate-200">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100"><h2 className="text-lg font-bold text-indigo-900 font-arabic">المعادلة والتردد الأساسي</h2></div>
              <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex-1 text-center" dir="ltr">
                  <div className="text-2xl"><BlockMath math={mutation.data.latexFormula} /></div>
                  <div className="mt-6 flex justify-center gap-6">
                    <div className="bg-slate-50 border p-3 rounded-xl min-w-[120px]">
                      <span className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Sampling Freq</span>
                      <span className="text-xl font-mono text-slate-800">{mutation.data.samplingFrequency.toFixed(2)} Hz</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl min-w-[120px]">
                      <span className="block text-xs text-indigo-500 uppercase tracking-wider font-bold mb-1">Dominant Freq</span>
                      <span className="text-xl font-mono text-indigo-700 font-bold">{mutation.data.dominantFrequency.toFixed(2)} Hz</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-arabic">طيف السعة (Magnitude Spectrum |X|)</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={magChartData} domain="discrete" xAxisKey="k" lines={[{ key: 'mag', name: '|X[k]|', color: '#6366f1' }]} height={250} yLabel="Magnitude" xLabel="Bin (k)" /></CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-arabic">طيف الطور (Phase Spectrum ∠X)</CardTitle></CardHeader>
                <CardContent className="p-4"><SignalChart data={phaseChartData} domain="discrete" xAxisKey="k" lines={[{ key: 'phase', name: '∠X[k]', color: '#f43f5e' }]} height={250} yLabel="Phase (rad)" xLabel="Bin (k)" /></CardContent>
              </Card>
            </div>

            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="pb-4 border-b"><CardTitle className="font-arabic">مكونات فورييه (DFT Bins)</CardTitle></CardHeader>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-center relative" dir="ltr">
                  <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 border-b shadow-sm z-10">
                    <tr><th className="py-3 px-2">k</th><th className="py-3 px-2">Freq (Hz)</th><th className="py-3 px-2 text-indigo-600">Real</th><th className="py-3 px-2 text-indigo-600">Imag</th><th className="py-3 px-2 bg-indigo-50/80 text-indigo-800 font-bold">Magnitude |X|</th><th className="py-3 px-2 text-rose-600">Phase (rad)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mutation.data.bins.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold bg-slate-50/50 border-r">{b.k}</td>
                        <td className="py-2 px-2 text-slate-500">{b.frequency.toFixed(2)}</td>
                        <td className="py-2 px-2 text-indigo-600">{b.realPart.toFixed(3)}</td>
                        <td className="py-2 px-2 text-indigo-600">{b.imagPart.toFixed(3)}</td>
                        <td className="py-2 px-2 bg-indigo-50/30 font-bold text-indigo-700">{b.magnitude.toFixed(3)}</td>
                        <td className="py-2 px-2 text-rose-600">{b.phase.toFixed(3)}</td>
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
