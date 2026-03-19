import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2 } from 'lucide-react';
import { useComputeZTransform } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseNumberArray } from '@/lib/utils';

export function Point9ZTransform() {
  const [xInput, setXInput] = useState("1 2 3 4");
  const [nStart, setNStart] = useState("0");

  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useComputeZTransform();

  const handleApply = () => {
    mutation.mutate({
      data: {
        xValues,
        nStart: parseInt(nStart) || 0,
        domain: "discrete",
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card className="shadow-lg border-primary/10 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50 border-b"><CardTitle className="flex items-center gap-2 text-primary font-arabic"><Settings2 className="w-5 h-5" />لوحة التحكم</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Discrete Signal x[n]</Label>
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 2 3 4" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Start Index (n)</Label>
              <Input value={nStart} onChange={e => setNStart(e.target.value)} type="number" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري الحساب..." : <><Play className="w-5 h-5 ml-2 fill-current" /> حساب Z-Transform</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            <Card className="shadow-md border-slate-200">
              <div className="bg-blue-50 px-6 py-4 border-b flex justify-between"><h2 className="text-lg font-bold text-blue-900 font-arabic">تحويل Z (Z-Transform Polynomial)</h2></div>
              <CardContent className="p-6" dir="ltr">
                <div className="text-2xl text-center bg-white border p-6 rounded-xl shadow-inner mb-6 overflow-x-auto">
                  <BlockMath math={mutation.data.latexZTransform} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {mutation.data.zTransformTerms.map((term, i) => (
                    <div key={i} className="bg-slate-50 border p-3 rounded-lg text-center font-mono">
                      <div className="text-xs text-slate-400 mb-1">n = {term.n}</div>
                      <div className="text-lg text-primary font-bold">{term.term}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 font-medium">
                  <strong>ROC (Region of Convergence):</strong> {mutation.data.rocDescription}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="pb-4 border-b"><CardTitle className="font-arabic">قيم DFT المناظرة (DFT Bins)</CardTitle></CardHeader>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-center relative" dir="ltr">
                  <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 border-b shadow-sm z-10">
                    <tr><th className="py-3 px-2">k</th><th className="py-3 px-2 text-indigo-600">Real</th><th className="py-3 px-2 text-indigo-600">Imag</th><th className="py-3 px-2 bg-indigo-50/80 text-indigo-800 font-bold">Magnitude |X|</th><th className="py-3 px-2 text-rose-600">Phase (rad)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {mutation.data.dftBins.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-2 font-bold bg-slate-50/50 border-r text-lg">{b.k}</td>
                        <td className="py-3 px-2 text-indigo-600">{b.realPart.toFixed(3)}</td>
                        <td className="py-3 px-2 text-indigo-600">{b.imagPart.toFixed(3)}</td>
                        <td className="py-3 px-2 bg-indigo-50/30 font-bold text-indigo-700 text-lg">{b.magnitude.toFixed(3)}</td>
                        <td className="py-3 px-2 text-rose-600">{b.phase.toFixed(3)}</td>
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
