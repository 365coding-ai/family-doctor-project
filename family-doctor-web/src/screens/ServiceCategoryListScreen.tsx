import { ArrowLeft, Stethoscope, Syringe, Baby, Home, Activity, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { serviceCategoryApi, type ServiceCategory } from '../lib/api';

const categoryIcons: Record<string, any> = {
  '临床护理': Syringe,
  '母婴护理': Baby,
  '专科护理': Stethoscope,
  '居家服务': Home,
  '康复护理': Activity,
  '中医护理': Leaf,
};

const categoryColors: Record<string, string> = {
  '临床护理': 'from-blue-500 to-indigo-500',
  '母婴护理': 'from-pink-500 to-rose-500',
  '专科护理': 'from-emerald-500 to-teal-500',
  '居家服务': 'from-amber-500 to-orange-500',
  '康复护理': 'from-purple-500 to-violet-500',
  '中医护理': 'from-green-500 to-emerald-600',
};

export default function ServiceCategoryListScreen() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    serviceCategoryApi.getAll().then(setCategories).catch(console.error);
  }, []);

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary">全部服务分类</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || Stethoscope;
            const gradient = categoryColors[cat.name] || 'from-gray-500 to-gray-600';
            return (
              <button
                key={cat.id}
                onClick={() => navigate('/service/category', { state: { categoryId: cat.id, categoryName: cat.name } })}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.97]"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md`}>
                  <Icon size={28} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-sans text-base font-semibold text-on-surface">{cat.name}</span>
                  <span className="font-sans text-xs text-on-surface-variant mt-1 text-center line-clamp-2">{cat.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
