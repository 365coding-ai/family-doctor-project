import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceItemApi, type ServiceItem } from '../lib/api';

export default function ServiceItemListScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const categoryId = state?.categoryId as number;
  const categoryName = (state?.categoryName as string) || '服务项目';
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) { navigate('/'); return; }
    serviceItemApi.getByCategory(categoryId).then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-6">
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary">{categoryName}</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 pt-4 flex flex-col gap-3 max-w-3xl mx-auto">
        {items.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <p className="text-lg font-bold">暂无服务项目</p>
            <p className="text-sm mt-2">该分类下暂无可用的服务项目</p>
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              onClick={() => navigate('/service/item', { state: { itemId: item.id } })}
              className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 text-left active:scale-[0.98] transition-all hover:shadow-md"
            >
              <div className="flex gap-4">
                {/* 封面图或渐变占位 */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.itemName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🏥</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans text-base font-bold text-on-surface truncate">{item.itemName}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Clock size={12} />
                      <span>{item.serviceDuration}分钟</span>
                    </div>
                    <p className="font-sans text-base font-bold text-primary">
                      ¥{item.basePrice}
                      <span className="text-[10px] font-normal text-on-surface-variant ml-1">起</span>
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  );
}
