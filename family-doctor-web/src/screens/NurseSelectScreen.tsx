import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Loader2, Briefcase, Award, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { serviceItemApi, type Nurse } from '../lib/api';

export default function NurseSelectScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const itemId = state?.itemId as number;
  const itemName = state?.itemName as string;
  const specId = state?.specId as number;
  const specName = state?.specName as string;
  const price = state?.price as number;
  const trafficFee = state?.trafficFee as number;
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) { navigate('/'); return; }
    serviceItemApi.getNurses(itemId).then(setNurses).catch(console.error).finally(() => setLoading(false));
  }, [itemId]);

    const handleSelectNurse = (nurse: Nurse) => {
    navigate('/order/confirm', {
      state: {
        nurse,
        nurseId: nurse.id,
        serviceItemId: itemId,
        serviceItemName: itemName,
        specId,
        specName,
        price,
        trafficFee,
        amount: price + (trafficFee || 0),
        serviceType: 'HOME_NURSING',
      }
    });
  };

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
        <h1 className="font-sans text-lg font-bold text-primary">选择护士</h1>
        <div className="w-10"></div>
      </header>

      {/* 选中的服务提示 */}
      <div className="mx-4 mt-4 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
        <p className="text-xs text-on-surface-variant">当前服务</p>
        <p className="text-sm font-bold text-on-surface mt-0.5">{itemName} · {specName}</p>
      </div>

      <main className="px-4 pt-4 flex flex-col gap-3 max-w-3xl mx-auto">
        {nurses.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <p className="text-lg font-bold">暂无可用护士</p>
            <p className="text-sm mt-2">该服务项目暂无可派遣的护士</p>
          </div>
        ) : (
          nurses.map(nurse => (
            <div
              key={nurse.id}
              className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex gap-4">
                {/* 头像 */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 text-white text-xl font-bold shadow-md">
                  {nurse.avatarUrl ? (
                    <img src={nurse.avatarUrl} alt={nurse.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    nurse.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-base font-bold text-on-surface">{nurse.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">{nurse.title}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                    <MapPin size={11} />
                    {nurse.hospital} · {nurse.department}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-on-surface">{nurse.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Briefcase size={12} />
                      <span>{nurse.serviceYears}年</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Award size={12} />
                      <span>{nurse.serviceCount}次服务</span>
                    </div>
                  </div>
                  {nurse.introduction && (
                    <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{nurse.introduction}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSelectNurse(nurse)}
                className="w-full mt-3 py-2.5 bg-primary text-on-primary font-sans text-sm font-bold rounded-lg active:scale-[0.98] transition-all"
              >
                选择该护士
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
