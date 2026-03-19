import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { AlertCircle, Play, ArrowRight, Settings2 } from 'lucide-react';
import { useTransformSignal } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';
import { processContinuousData } from '../DiscontinuityProcessor';
import { SignalLine } from '../SignalChart';

export function Point1Transform() {
  const [tInput, setTInput] = useState("0 1 2 3");
  const [xInput, setXInput] = useState("1 2 1 0");
  const [expression, setExpression] = useState("t-1");
  const [domain, setDomain] = useState<"continuous" | "discrete">("continuous");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tValues = useMemo(() => parseNumberArray(tInput), [tInput]);
  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useTransformSignal({
    mutation: {
      onError: (err: any) => setErrorMsg(err?.response?.data?.error || "حدث خطأ أثناء المعالجة")
    }
  });

  const handleApply = () => {
    setErrorMsg(null);
    if (tValues.length !== xValues.length) {
      setErrorMsg("⚠️ يرجى التأكد من تساوي عدد قيم x مع قيم t/n.");
      return;
    }
    if (!expression.trim()) {
      setErrorMsg("الرجاء إدخال دالة التحويل");
      return;
    }

    mutation.mutate({
      data: { tValues, xValues, expression, domain }
    });
  };

  const chartData = useMemo(() => {
    const result = mutation.data;
    if (!result) return [];
    const allTSet = new Set([...tValues, ...(result.newTValues || [])]);
    const allT = Array.from(allTSet).sort((a, b) => a - b);

    let data = allT.map(t => {
      const origIdx = tValues.indexOf(t);
      const transIdx = result.newTValues.indexOf(t);
      return {
        t,
        x_orig: origIdx >= 0 ? xValues[origIdx] : null,
        x_trans: transIdx >= 0 ? result.xValues[transIdx] : null,
      };
    });

    // Client-side CT extension + discontinuities


    return data;
  }, [tValues, xValues, mutation.data, domain]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANEL */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-primary font-arabic">
              <Settings2 className="w-5 h-5" />
              لوحة التحكم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">t / n Values</Label>
              <Input value={tInput} onChange={e => setTInput(e.target.value)} placeholder="0 1 2 3" className="font-mono text-center tracking-wider text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Amplitude (x)</Label>
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 2 1 0" className="font-mono text-center tracking-wider text-lg bg-slate-50" />
            </div>
            <div className="pt-4 border-t space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Transformation eq.</Label>
              <Input value={expression} onChange={e => setExpression(e.target.value)} placeholder="t-1" className="font-mono text-center tracking-wider text-lg" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Continuous (t)</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Discrete (n)</button>
              </div>
            </div>
            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري المعالجة..." : <><Play className="w-5 h-5 ml-2 fill-current" /> تطبيق التحويل</>}
            </Button>
            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-start gap-2 border border-red-100 font-arabic">
                  <AlertCircle className="w-5 h-5 shrink-0" /><span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100"><h2 className="text-lg font-bold text-blue-900 font-arabic">الحل الجبري (Algebraic Solution)</h2></div>
              <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 bg-white border rounded-xl p-6 shadow-inner flex items-center justify-center min-h-[120px]" dir="ltr">
                  <div className="text-2xl md:text-3xl"><BlockMath math={mutation.data.latexFormula} /></div>
                </div>
                <div className="flex-1 bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-slate-700 leading-relaxed font-arabic">{mutation.data.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* كارد الرسمة */}
            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="font-arabic">التمثيل البياني (Visualization)</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SignalChart
                  data={chartData}
                  domain={domain}
                  xAxisKey="t"
                  xLabel={domain === 'continuous' ? 't (Time)' : 'n (Samples)'}
                  lines={[
                    { key: 'x_orig', name: 'Original', color: '#94a3b8', isDashed: true },
                    { key: 'x_trans', name: 'Transformed', color: '#2563eb' }
                  ]}
                  processDiscontinuities={domain === 'continuous'}

                />
              </CardContent>
            </Card>

          </motion.div>
        )}
      </div>
    </div>
  );
}