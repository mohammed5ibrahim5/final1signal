import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2, FileText, CheckCircle2 } from 'lucide-react';
import { useGenerateReport } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';
import { parseNumberArray } from '@/lib/utils';

export function Point10Report() {
  const [tInput, setTInput] = useState("0 1 2 3");
  const [xInput, setXInput] = useState("1 2 1 0");
  const [domain, setDomain] = useState<"continuous" | "discrete">("continuous");
  const [labelStr, setLabelStr] = useState("My Test Signal");

  const tValues = useMemo(() => parseNumberArray(tInput), [tInput]);
  const xValues = useMemo(() => parseNumberArray(xInput), [xInput]);

  const mutation = useGenerateReport();

  const handleApply = () => {
    if (tValues.length !== xValues.length) return;
    mutation.mutate({
      data: { tValues, xValues, domain, label: labelStr }
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
              <Label className="font-semibold text-primary font-mono text-sm">Time/Index (t/n)</Label>
              <Input value={tInput} onChange={e => setTInput(e.target.value)} placeholder="0 1 2 3" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Amplitude (x)</Label>
              <Input value={xInput} onChange={e => setXInput(e.target.value)} placeholder="1 2 1 0" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Signal Label</Label>
              <Input value={labelStr} onChange={e => setLabelStr(e.target.value)} placeholder="e.g. Test Signal" className="text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-slate-700 text-sm">Domain</Label>
              <div className="flex gap-2">
                <button onClick={() => setDomain("continuous")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "continuous" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Continuous</button>
                <button onClick={() => setDomain("discrete")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${domain === "discrete" ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Discrete</button>
              </div>
            </div>
            <Button onClick={handleApply} disabled={mutation.isPending || tValues.length !== xValues.length} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري الإنشاء..." : <><FileText className="w-5 h-5 ml-2" /> توليد التقرير الشامل</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="shadow-xl border-slate-200 overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-10 text-white relative overflow-hidden">
                <FileText className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
                <h1 className="text-3xl font-bold font-arabic relative z-10 mb-2">التقرير التحليلي الشامل</h1>
                <p className="text-slate-300 text-lg relative z-10">{mutation.data.signalLabel} ({mutation.data.domain})</p>
              </div>
              
              <div className="p-8">
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 font-arabic border-b pb-2">الملخص التنفيذي</h3>
                  <p className="text-slate-600 text-lg leading-relaxed font-arabic">{mutation.data.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {mutation.data.sections.map((section, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 font-arabic">
                        <CheckCircle2 className="w-5 h-5 text-primary" /> {section.title}
                      </h4>
                      <div className="bg-slate-50 p-3 rounded-lg mb-3 overflow-x-auto text-center" dir="ltr">
                        <BlockMath math={section.latex} />
                      </div>
                      <div className="font-mono text-center font-bold text-lg text-primary mb-3 bg-blue-50 py-2 rounded-lg" dir="ltr">
                        {section.result}
                      </div>
                      <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside px-2">
                        {section.details.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader className="pb-2 border-b"><CardTitle className="font-arabic">رسم الإشارة النهائي</CardTitle></CardHeader>
                  <CardContent className="p-4">
                    <SignalChart 
                      data={mutation.data.signalPoints} 
                      domain={mutation.data.domain as any} 
                      xAxisKey="t" 
                      lines={[{ key: 'x', name: 'Amplitude', color: '#0f172a' }]} 
                      height={300} 
                    />
                  </CardContent>
                </Card>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
