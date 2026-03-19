import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2 } from 'lucide-react';
import { useEvaluateSinusoid } from '../../api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';

export function Point4Sinusoids() {
  const [A, setA] = useState("1");
  const [omega, setOmega] = useState("3.14159"); // pi
  const [phi, setPhi] = useState("0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("continuous");
  const [sigType, setSigType] = useState<"cosine" | "sine">("cosine");

  const mutation = useEvaluateSinusoid();

  const handleApply = () => {
    mutation.mutate({
      data: {
        amplitude: parseFloat(A) || 1,
        omega: parseFloat(omega) || 1,
        phi: parseFloat(phi) || 0,
        tStart: 0,
        tEnd: domain === 'continuous' ? 4 : 20,
        numPoints: domain === 'continuous' ? 200 : 21,
        signalType: sigType,
        domain
      }
    });
  };

  const chartData = useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.points.map(p => ({ t: p.t, val: p.value }));
  }, [mutation.data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-primary font-arabic"><Settings2 className="w-5 h-5" />لوحة التحكم</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4" dir="ltr">
              <div className="space-y-2">
                <Label className="font-semibold text-primary font-mono text-xs">Amplitude (A)</Label>
                <Input value={A} onChange={e => setA(e.target.value)} placeholder="1" className="font-mono text-center bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-primary font-mono text-xs">Frequency (ω)</Label>
                <Input value={omega} onChange={e => setOmega(e.target.value)} placeholder="3.14" className="font-mono text-center bg-slate-50" />
              </div>
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-xs">Phase Shift (φ) radians</Label>
              <Input value={phi} onChange={e => setPhi(e.target.value)} placeholder="0" className="font-mono text-center bg-slate-50" />
            </div>

            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Type</Label>
              <div className="flex gap-2">
                <button onClick={() => setSigType("cosine")} className={`flex-1 py-1 px-2 rounded-md text-sm transition-all ${sigType === "cosine" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>Cosine</button>
                <button onClick={() => setSigType("sine")} className={`flex-1 py-1 px-2 rounded-md text-sm transition-all ${sigType === "sine" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>Sine</button>
              </div>
            </div>

            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-1 px-2 rounded-md text-sm transition-all ${domain === "continuous" ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>Continuous</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-1 px-2 rounded-md text-sm transition-all ${domain === "discrete" ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>Discrete</button>
              </div>
            </div>

            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-12 text-md font-bold shadow-lg shadow-primary/25 mt-2 font-arabic">
              {mutation.isPending ? "جاري التوليد..." : <><Play className="w-4 h-4 ml-2 fill-current" /> رسم الإشارة</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="shadow-md border-slate-200">
              <div className="bg-blue-50 px-6 py-4 border-b flex items-center justify-between"><h2 className="text-lg font-bold text-blue-900 font-arabic">تحليل الإشارة الدورية (Periodicity)</h2></div>
              <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8" dir="ltr">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-10 shadow-xl text-center">
                  <h3 className="text-2xl font-bold text-indigo-800 mb-8 font-mono">المعادلة</h3>

                  <div className="relative">
                    <div className="hidden lg:flex w-full h-2 bg-slate-200 rounded-full mx-4 mb-3">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300" style={{ width: '100%' }} />
                    </div>
                    <div className="katex-display mx-auto w-full max-w-4xl h-[160px] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/50">
                      <BlockMath math={mutation.data.latexFormula} />
                    </div>
                    <div className="flex items-center mt-4 lg:hidden">
                      <span className="text-xs text-slate-500 font-mono mr-2 whitespace-nowrap">Equation Size:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        defaultValue="1"
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 slider"

                        onChange={(e) => {
                          const katexDiv = document.querySelector('.katex-display') as HTMLElement;
                          if (katexDiv) {
                            katexDiv.style.transform = `scale(${e.target.value})`;
                          }
                        }}

                      />
                      <span className="text-xs text-slate-500 font-mono ml-2 whitespace-nowrap">2x</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:h-[300px] min-h-[380px]">
                  <div className="bg-gradient-to-br from-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 shadow-xl">
                    <div className="text-3xl font-bold text-emerald-700 mb-6 font-arabic text-center">النتيجة</div>

                    <table className="w-full text-sm border-2 border-slate-200 rounded-xl bg-white shadow-lg">
                      <thead>
                        <tr className="bg-gradient-to-r from-emerald-50 to-blue-50">
                          <th className="p-4 text-left font-bold text-slate-800 font-arabic">الخاصية</th>
                          <th className="p-4 text-right font-bold text-slate-800 font-arabic">القيمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-semibold text-slate-700 font-arabic">Periodic?</td>
                          <td className="p-4 text-right">
                            <span className="px-4 py-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono font-semibold text-base">
                              نعم
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-semibold text-slate-700 font-arabic">الدورة الأساسية</td>
                          <td className="p-4 text-right">
                            <span className="px-6 py-2 rounded-lg bg-blue-100 border border-blue-300 text-blue-800 font-mono font-semibold text-sm">
                              {mutation.data.isPeriodic ? mutation.data.period.toFixed(3) : 'غير دوري'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 shadow-xl space-y-4">
                    <div className="text-2xl font-bold text-amber-800 text-center font-arabic">خطوات الحساب</div>
                    <div className="max-h-40 sm:max-h-48 overflow-y-auto space-y-3 p-4 bg-white/70 rounded-xl">
                      {mutation.data.periodicitySteps.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4 items-start p-3 bg-gradient-to-r from-slate-50 hover:from-slate-100 rounded-lg transition-all">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">→</div>
                          <span className="text-slate-800 font-medium leading-relaxed break-words">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-2 border-b"><CardTitle className="font-arabic">التمثيل البياني (Waveform)</CardTitle></CardHeader>
              <CardContent className="p-4">
                <SignalChart data={chartData} domain={domain} xAxisKey="t" lines={[{ key: 'val', name: 'Amplitude', color: '#8b5cf6', fillArea: domain === 'continuous' }]} height={400} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

