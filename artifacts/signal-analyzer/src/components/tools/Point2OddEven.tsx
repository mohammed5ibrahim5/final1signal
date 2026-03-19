import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { AlertCircle, Play, Settings2 } from 'lucide-react';
import { useOddEvenDecompose } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point2OddEven() {
  const [nInput, setNInput] = useState("-3 -2 -1 0 1 2 3");
  const [xInput, setXInput] = useState("0 1 2 3 2 1 0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("discrete");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nValues = useMemo(() => parseNumberArray(nInput), [nInput]);
  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useOddEvenDecompose({
    mutation: { onError: (err: any) => setErrorMsg(err?.response?.data?.error || "حدث خطأ") }
  });

  const handleApply = () => {
    setErrorMsg(null);
    if (nValues.length !== xValues.length) return setErrorMsg("تأكد من تساوي عدد القيم.");
    mutation.mutate({ data: { nValues, xValues, domain } });
  };

  const chartData = useMemo(() => {
    if (!mutation.data) return [];
    return mutation.data.nValues.map((n: number, i: number) => ({
      n,
      x_orig: mutation.data.originalValues[i],
      x_even: mutation.data.evenValues[i],
      x_odd: mutation.data.oddValues[i],
    }));
  }, [mutation.data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-primary font-arabic">
              <Settings2 className="w-5 h-5" />لوحة التحكم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Time/Index (n or t)</Label>
              <Input
                value={nInput}
                onChange={(e) => setNInput(e.target.value)}
                placeholder="-2 -1 0 1 2"
                className="font-mono text-center text-lg bg-slate-50"
              />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Amplitude (x)</Label>
              <Input
                value={xInput}
                onChange={(e) => setXInput(e.target.value)}
                placeholder="1 2 3 2 1"
                className="font-mono text-center text-lg bg-slate-50"
              />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDomain("continuous")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Continuous
                </button>
                <button
                  onClick={() => setDomain("discrete")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Discrete
                </button>
              </div>
            </div>
            <Button
              onClick={handleApply}
              disabled={mutation.isPending}
              className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic"
            >
              Decompose Signal
            </Button>
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 border border-red-100 font-arabic"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* المعادلات الرياضية */}
            <Card className="shadow-md border-slate-200">
              <div className="bg-blue-50 px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-900 font-arabic">الحل الجبري</h2>
              </div>
              <CardContent className="p-6 space-y-8" dir="ltr">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-10 shadow-xl text-center">
                  Even Component
                  <div className="katex-block mx-auto w-full max-w-3xl h-[160px] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/50">
                    <BlockMath math={mutation.data.latexEven} />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-10 shadow-xl text-center">
                  Odd Component
                  <div className="katex-block mx-auto w-full max-w-3xl h-[160px] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/50">
                    <BlockMath math={mutation.data.latexOdd} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الرسوم البيانية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md border-slate-200">
                <CardContent className="p-6 pt-12 flex justify-center">
                  <SignalChart
                    data={chartData}
                    domain={domain}
                    xAxisKey="n"
                    lines={[{ key: 'x_even', name: 'Even', color: '#10b981' }]}
                    height={300}
                  />
                </CardContent>
              </Card>
              <Card className="shadow-md border-slate-200">
                <CardContent className="p-6 pt-12 flex justify-center">
                  <SignalChart
                    data={chartData}
                    domain={domain}
                    xAxisKey="n"
                    lines={[{ key: 'x_odd', name: 'Odd', color: '#f59e0b' }]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>

            {/* جدول الخطوات */}
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="font-arabic text-lg">جدول الخطوات</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center" dir="ltr">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="py-3 px-4">n</th>
                      <th className="py-3 px-4">x[n]</th>
                      <th className="py-3 px-4">x[-n]</th>
                      <th className="py-3 px-4 text-emerald-600 font-bold">Even</th>
                      <th className="py-3 px-4 text-amber-600 font-bold">Odd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mutation.data.steps.map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold bg-slate-50">{s.n}</td>
                        <td className="py-3 px-4">{s.xN}</td>
                        <td className="py-3 px-4">{s.xNeg}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 bg-emerald-50/50 rounded-lg px-2">{s.evenValue}</td>
                        <td className="py-3 px-4 font-bold text-amber-600 bg-amber-50/50 rounded-lg px-2">{s.oddValue}</td>
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

