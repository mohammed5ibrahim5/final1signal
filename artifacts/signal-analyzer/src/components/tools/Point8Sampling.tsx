import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BlockMath } from 'react-katex';
import { Play, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useComputeSampling } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignalChart } from '../SignalChart';

export function Point8Sampling() {
  const [fSig, setFSig] = useState("5");
  const [fs, setFs] = useState("12");
  const [dur, setDur] = useState("1");

  const mutation = useComputeSampling();

  const handleApply = () => {
    mutation.mutate({
      data: {
        signalFrequency: parseFloat(fSig) || 5,
        samplingFrequency: parseFloat(fs) || 12,
        duration: parseFloat(dur) || 1
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
              <Label className="font-semibold text-primary font-mono text-sm">Signal Freq (Hz)</Label>
              <Input value={fSig} onChange={e => setFSig(e.target.value)} type="number" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Sampling Freq fs (Hz)</Label>
              <Input value={fs} onChange={e => setFs(e.target.value)} type="number" className="font-mono text-center text-lg bg-slate-50" />
            </div>
            <div className="space-y-2" dir="ltr">
              <Label className="font-semibold text-primary font-mono text-sm">Duration (sec)</Label>
              <Input value={dur} onChange={e => setDur(e.target.value)} type="number" className="font-mono text-center text-lg bg-slate-50" />
            </div>

            <Button onClick={handleApply} disabled={mutation.isPending} className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 mt-4 font-arabic">
              {mutation.isPending ? "جاري أخذ العينات..." : <><Play className="w-5 h-5 ml-2 fill-current" /> دراسة التشويه (Aliasing)</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {mutation.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md border-slate-200">
                <div className="bg-blue-50 px-6 py-4 border-b flex items-center justify-between"><h2 className="text-lg font-bold text-blue-900 font-arabic">المعادلة ومعيار نايكويست</h2></div>
                <CardContent className="p-6 text-center" dir="ltr">
                  <div className="text-xl my-4 mx-auto max-w-full overflow-x-auto katex-display"><BlockMath math={mutation.data.latexFormula} /></div>
                  <div className="bg-slate-50 border p-4 rounded-xl w-full max-w-sm mx-auto">
                    <span className="block text-xs text-slate-500 uppercase font-bold mb-2">Nyquist Rate</span>
                    <span className="text-2xl font-mono text-slate-800 font-bold">{mutation.data.nyquistRate.toFixed(1)} Hz</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`shadow-md border-0 ${mutation.data.isAliasing ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'}`}>
                <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
                  {mutation.data.isAliasing ? (
                    <>
                      <AlertTriangle className="w-20 h-20 mb-6 text-red-200" />
                      <h3 className="text-2xl font-bold mb-4 font-arabic">⚠️ يوجد تشويه (Aliasing Occurs)</h3>
                      fs = {parseFloat(fs).toFixed(1)} Hz {'<'} Nyquist = {mutation.data.nyquistRate.toFixed(1)} Hz
                      <div className="bg-black/20 px-6 py-4 rounded-xl text-xl font-mono" dir="ltr">
                        التردد الظاهري (Apparent Freq): <span className="font-bold text-2xl">{mutation.data.aliasingFrequency.toFixed(2)} Hz</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-20 h-20 mb-6 text-emerald-200" />
                      <h3 className="text-2xl font-bold mb-4 font-arabic">✅ إعادة بناء مثالية (Perfect Reconstruction)</h3>
                      fs = {parseFloat(fs).toFixed(1)} Hz {'≥'} Nyquist = {mutation.data.nyquistRate.toFixed(1)} Hz
                      <div className="bg-black/20 px-6 py-4 rounded-xl text-xl font-mono" dir="ltr">
                        بدون تشويه - الإشارة الأصلية تُعاد بناءها بدقة
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-2 border-b"><CardTitle className="font-arabic">مقارنة الإشارات (Original vs Sampled vs Reconstructed)</CardTitle></CardHeader>
              <CardContent className="p-4">
                <SignalChart
                  data={[
                    ...mutation.data.continuousPoints.map(p => ({
                      t: p.t,
                      orig: p.value,
                      sampled: null,
                      recon: mutation.data.reconstructedPoints.find(r => Math.abs(r.t - p.t) < 0.01)?.value || p.value
                    })),
                    ...mutation.data.sampledPoints.map(p => ({
                      t: p.t,
                      orig: null,
                      sampled: p.value,
                      recon: null
                    }))
                  ]}
                  domain="continuous"
                  xAxisKey="t"
                  lines={[
                    { key: 'orig', name: 'الإشارة الأصلية', color: '#6366f1', lineWidth: 3 },
                    { key: 'sampled', name: 'العينات المأخوذة', color: '#10b981', lineWidth: 4, strokeDasharray: '5,5' },
                    { key: 'recon', name: 'الإشارة المعاد بناؤها', color: '#ef4444', lineWidth: 2.5 }
                  ]}
                  height={450}
                  yLabel="Amplitude"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

