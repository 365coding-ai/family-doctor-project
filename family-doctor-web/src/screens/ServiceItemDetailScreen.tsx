import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2, Package, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceItemApi, type ServiceItem, type ServiceItemSpec } from '../lib/api';

export default function ServiceItemDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const itemId = state?.itemId as number;
  const [item, setItem] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<ServiceItemSpec | null>(null);
  const [activeTab, setActiveTab] = useState<'detail' | 'material' | 'refund'>('detail');

  useEffect(() => {
    if (!itemId) { navigate('/'); return; }
    serviceItemApi.getDetail(itemId).then(data => {
      setItem(data);
      if (data.specs && data.specs.length > 0) setSelectedSpec(data.specs[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) return null;

  const currentPrice = selectedSpec?.price ?? item.basePrice;
  const originalPrice = selectedSpec?.originalPrice;

  return (
    <div className="pb-[100px] bg-background min-h-screen">
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 border-b border-surface-variant">
        <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-lg font-bold text-primary">服务详情</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-4 pt-4 flex flex-col gap-4 max-w-3xl mx-auto">
        {/* Hero 区域 */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-8 -mt-8"></div>
          <h2 className="font-sans text-2xl font-bold text-on-surface relative z-10">{item.itemName}</h2>
          <p className="text-sm text-on-surface-variant mt-2 relative z-10">{item.description}</p>
          <div className="flex items-end gap-3 mt-4 relative z-10">
            <span className="font-sans text-3xl font-bold text-primary">¥{currentPrice}</span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="text-sm text-on-surface-variant line-through mb-1">¥{originalPrice}</span>
            )}
            <div className="flex items-center gap-1 text-xs text-on-surface-variant ml-auto bg-surface-container rounded-full px-3 py-1">
              <Clock size={12} />
              <span>{item.serviceDuration}分钟</span>
            </div>
          </div>
        </div>

        {/* 规格选择 */}
        {item.specs && item.specs.length > 1 && (
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4">
            <h3 className="font-sans text-sm font-bold text-on-surface mb-3">选择规格</h3>
            <div className="flex flex-wrap gap-2">
              {item.specs.map(spec => (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpec(spec)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedSpec?.id === spec.id
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-lowest border border-surface-variant'
                  }`}
                >
                  {selectedSpec?.id === spec.id && <Check size={14} className="inline mr-1" />}
                  {spec.specName}
                  <span className="ml-1 text-xs opacity-80">¥{spec.price}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tab 切换 */}
        <div className="flex bg-surface-container rounded-xl p-1">
          {([['detail', '服务详情'], ['material', '耗材清单'], ['refund', '退费规则']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === key
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        {activeTab === 'detail' && (
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 space-y-4">
            {item.suitablePeople && (
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">适用人群</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{item.suitablePeople}</p>
              </div>
            )}
            {item.contraindications && (
              <div>
                <h4 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-1">
                  <AlertTriangle size={14} /> 禁忌症
                </h4>
                <p className="text-xs text-red-500 leading-relaxed">{item.contraindications}</p>
              </div>
            )}
            {item.notes && (
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">服务须知</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">{item.notes}</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'material' && (
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
            {item.materials && item.materials.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-xs">
                    <th className="text-left py-3 px-4 font-bold">耗材名称</th>
                    <th className="text-center py-3 px-2 font-bold">数量</th>
                    <th className="text-right py-3 px-4 font-bold">单价</th>
                  </tr>
                </thead>
                <tbody>
                  {item.materials.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 0 ? '' : 'bg-surface-container/30'}>
                      <td className="py-3 px-4 text-on-surface flex items-center gap-2">
                        <Package size={14} className="text-primary shrink-0" />
                        {m.materialName}
                      </td>
                      <td className="py-3 px-2 text-center text-on-surface-variant">{m.quantity}{m.unit}</td>
                      <td className="py-3 px-4 text-right text-primary font-bold">¥{m.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-on-surface-variant text-sm">暂无耗材信息</div>
            )}
          </section>
        )}

        {activeTab === 'refund' && (
          <section className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 space-y-3">
            {[
              { scene: '距确认服务时间 ≥ 2小时取消', refund: '100% 退费', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { scene: '距确认服务时间 < 2小时取消', refund: '退费 80%', color: 'text-amber-600', bg: 'bg-amber-50' },
              { scene: '服务开始后取消', refund: '不予退费', color: 'text-red-600', bg: 'bg-red-50' },
            ].map((rule, i) => (
              <div key={i} className={`${rule.bg} rounded-lg p-3 flex items-center justify-between`}>
                <p className="text-xs text-on-surface flex-1">{rule.scene}</p>
                <span className={`text-sm font-bold ${rule.color} ml-3 shrink-0`}>{rule.refund}</span>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* 底部操作 */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-surface-variant px-4 py-3 pb-safe z-50 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-on-surface-variant">
            {selectedSpec ? selectedSpec.specName : '默认规格'}
            {item.trafficFee > 0 && <span className="ml-2">+ 交通费 ¥{item.trafficFee}</span>}
          </p>
          <p className="font-sans text-xl font-bold text-primary mt-0.5">
            ¥{(currentPrice + (item.trafficFee || 0)).toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => navigate('/service/nurse', {
            state: {
              itemId: item.id,
              itemName: item.itemName,
              specId: selectedSpec?.id,
              specName: selectedSpec?.specName || '默认规格',
              price: currentPrice,
              trafficFee: item.trafficFee || 0,
            }
          })}
          className="min-h-[48px] px-8 bg-primary text-on-primary font-sans text-lg font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          选择护士
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
