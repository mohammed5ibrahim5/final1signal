import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2, Zap, Activity } from 'lucide-react';
import { useComputeEnergyPower } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point5EnergyPower() {
  const [tInput, setTInput] = useState("0 1 2 3 4 5");
  const [xInput, setXInput] = useState("1 1 1 0 0 0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("continuous");

  const tValues = useMemo(() => parseNumberArray(tInput), [tInput]);
  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useComputeEnergyPower();

  const handleApply = () => {
    if (tValues.length !== xValues.length) return;
    mutation.mutate({ data: { tValues, xValues, domain } });
  };

  const chartData = useMemo(() => {
    return tValues.map((t, i) => ({ t, x: xValues[i], x2: Math.pow(xValues[i], 2) }));
  }, [tValues, xValues]);

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
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 1 0 0" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Continuous</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Discrete</button>
              </div>
            </div>
            <Button onClick={handleApply} disabled={mutation.isPending || tValues.length !== xValues.length} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري الحساب..." : <><Play className="w-5 h-5 ml-2 fill-current" /> حساب الطاقة والقدرة</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0 overflow-hidden relative">
                <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                <CardContent className="p-6 relative z-10" dir="ltr">
                  <h3 className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">Total Energy (E)</h3>
                  <div className="text-4xl font-bold font-mono">{mutation.data.energy.toFixed(4)} <span className="text-xl text-emerald-200 font-sans">J</span></div>
                  <div className="mt-4 bg-black/20 p-3 rounded-xl backdrop-blur-sm"><BlockMath math={mutation.data.latexEnergy} /></div>
                </CardContent>
              </Card>
              <Card className="shadow-md bg-gradient-to-br from-purple-600 to-purple-800 text-white border-0 overflow-hidden relative">
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                <CardContent className="p-6 relative z-10" dir="ltr">
                  <h3 className="text-purple-100 text-sm font-medium uppercase tracking-wider mb-2">Average Power (P)</h3>
                  <div className="text-4xl font-bold font-mono">{mutation.data.power.toFixed(4)} <span className="text-xl text-purple-200 font-sans">W</span></div>
                  <div className="mt-4 bg-black/20 p-3 rounded-xl backdrop-blur-sm"><BlockMath math={mutation.data.latexPower} /></div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 font-arabic">التصنيف (Classification)</h2>
                <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${mutation.data.classification === 'energy' ? 'bg-emerald-100 text-emerald-700' : mutation.data.classification === 'power' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`} dir="ltr">
                  {mutation.data.classification} Signal
                </div>
              </div>
              <CardContent className="p-6"><p className="text-slate-600 text-center text-lg font-medium font-arabic">{mutation.data.classificationReason}</p></CardContent>
            </Card>

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-2 border-b"><CardTitle className="font-arabic text-sm">إشارة القدرة والطاقة |x|²</CardTitle></CardHeader>
              <CardContent className="p-4">
                <SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[
                  { key: 'x', name: 'x(t)', color: '#94a3b8', isDashed: true },
                  { key: 'x2', name: '|x(t)|²', color: '#10b981', fillArea: true }
                ]} height={300} yLabel="Magnitude" />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="h-full min-h-[400px] flex items-center justify-center bg-slate-50/50 border-dashed border-2">
            <p className="text-slate-400 font-medium font-arabic">أدخل القيم واضغط على حساب الطاقة والقدرة</p>
          </Card>
        )}
      </div>
    </div>
  );
}

