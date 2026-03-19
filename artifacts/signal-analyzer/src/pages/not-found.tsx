import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-arabic" dir="rtl">
      <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-full text-red-500">
            <AlertCircle className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">خطأ 404</h1>
        <p className="text-slate-600 mb-8 text-lg">عذراً، الصفحة التي تبحث عنها غير موجودة في هذا النظام الهندسي.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl transition-all hover:-translate-y-0.5">
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
