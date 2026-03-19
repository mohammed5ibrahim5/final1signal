import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath, InlineMath } from 'react-katex';
import { Play, Settings2 } from 'lucide-react';
import { useComputeConvolution } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point6Convolution() {
  const [xInput, setXInput] = useState("1 2 1");
  const [hInput, setHInput] = useState("1 -1");
  const [xStart, setXStart] = useState("0");
  const [hStart, setHStart] = useState("0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("discrete");

  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);
  const hValues = useMemo(() => parseNumberArray(hInput), [hInput]);

  const mutation = useComputeConvolution();

  const handleApply = () => {
    mutation.mutate({
      data: {
        xValues,
        hValues,
        xStart: parseInt(xStart) || 0,
        hStart: parseInt(hStart) || 0,
        domain
      }
    });
  };

  const chartData = useMemo(() => {
    if (!mutation.data) return [];
    
    // Create unified axis
    const minIdx = Math.min(parseInt(xStart), parseInt(hStart), mutation.data.yIndices[0]);
    const maxIdx = Math.max(
      parseInt(xStart) + xValues.length - 1,
      parseInt(hStart) + hValues.length - 1,
      mutation.data.yIndices[mutation.data.yIndices.length - 1]
    );

    const merged = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      const xIdx = i - parseInt(xStart);
      const hIdx = i - parseInt(hStart);
      const yIdx = i - mutation.data.yIndices[0];
      
      merged.push({
        n: i,
        x: xIdx >= 0 && xIdx < xValues.length ? xValues[xIdx] : 0,
        h: hIdx >= 0 && hIdx < hValues.length ? hValues[hIdx] : 0,
        y: yIdx >= 0 && yIdx < mutation.data.yValues.length ? mutation.data.yValues[yIdx] : 0,
      });
    }
    return merged;
  }, [mutation.data, xValues, hValues, xStart, hStart]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-primary font-arabic"><Settings2 className="w-5 h-5" />لوحة التحكم</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            
            <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-700">Signal x[n]</Label>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-xs text-slate-500">n=</span>
                  <Input value={xStart} onChange={e => setXStart(e.target.value)} className="w-12 h-8 text-center p-1 font-mono" />
                </div>
              </div>
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 2 1" className="font-mono text-center text-lg" dir="ltr" />
            </div>

            <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-700">Impulse h[n]</Label>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-xs text-slate-500">n=</span>
                  <Input value={hStart} onChange={e => setHStart(e.target.value)} className="w-12 h-8 text-center p-1 font-mono" />
                </div>
              </div>
              <Input value={hInput} onChange={e => setHInput(e.target.value)} placeholder="1 -1" className="font-mono text-center text-lg" dir="ltr" />
            </div>

            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Continuous (*)</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Discrete (Sum)</button>
              </div>
            </div>

            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 font-arabic">
              {mutation.isPending ? "جاري الحساب..." : <><Play className="w-5 h-5 ml-2 fill-current" /> تطبيق الالتفاف</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b"><h2 className="text-lg font-bold text-blue-900 font-arabic">المعادلة (Formula)</h2></div>
              <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8 justify-between bg-slate-50">
                <div className="flex-1 text-center" dir="ltr">
                  <div className="text-2xl"><BlockMath math={mutation.data.latexFormula} /></div>
                  <div className="mt-4 flex gap-4 justify-center">
                    <span className="bg-white border rounded px-3 py-1 text-sm font-mono shadow-sm">Length: {mutation.data.length}</span>
                    <span className="bg-white border rounded px-3 py-1 text-sm font-mono shadow-sm">y = [{mutation.data.yValues.join(', ')}]</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-2 border-b"><CardTitle className="font-arabic">التمثيل البياني المدمج (Convolution Result)</CardTitle></CardHeader>
              <CardContent className="p-4">
                <SignalChart data={chartData} domain={domain} xAxisKey="n" lines={[
                  { key: 'x', name: 'x[n]', color: '#94a3b8' },
                  { key: 'h', name: 'h[n]', color: '#f59e0b' },
                  { key: 'y', name: 'y[n] (Result)', color: '#2563eb', fillArea: true }
                ]} height={350} />
              </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-4 border-b"><CardTitle className="font-arabic">خطوات الحساب (Tabular Method)</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center" dir="ltr">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                    <tr><th className="py-3 px-4">k</th><th className="py-3 px-4 text-left">Terms (x[m] · h[k-m])</th><th className="py-3 px-4 bg-blue-50/50 text-blue-700 font-bold">y[k]</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mutation.data.steps.map((step, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-700">{step.k}</td>
                        <td className="py-3 px-4 text-left text-slate-500">
                          {step.terms.map((t, i) => (
                            <React.Fragment key={i}>
                              <span className="bg-slate-100 rounded px-1.5 py-0.5 border text-xs">{t}</span>
                              {i < step.terms.length - 1 && <span className="mx-1">+</span>}
                            </React.Fragment>
                          ))}
                        </td>
                        <td className="py-3 px-4 bg-blue-50/20 font-bold text-blue-700 text-lg">{step.result}</td>
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
