import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Home, Video, Phone, ChevronRight, MessageCircle, StarHalf, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doctorApi, type Doctor } from '../lib/api';

const services = [
  { id: 'home', icon: Home, label: '上门看诊', desc: '医生携带专业设备上门服务', price: 200 },
  { id: 'video', icon: Video, label: '视频问诊', desc: '15分钟在线面对面解答', price: 50 },
  { id: 'phone', icon: Phone, label: '电话咨询', desc: '10分钟专属语音沟通', price: 30 },
];

const reviews = [
  {
    name: '李女士',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    type: '上门看诊',
    time: '2天前',
    stars: 5,
    content: '医生非常专业，问诊非常详细，给出的治疗方案很实用。检查仪器很齐全，在家就能享受专业服务，态度也特别温和，让人很放心。',
  },
  {
    name: '王先生',
    avatar: '',
    type: '视频问诊',
    time: '1周前',
    stars: 4.5,
    content: '视频很清晰，医生解答了我的疑虑，给出了明确的用药指导。效率很高。',
  },
];

export default function DoctorDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('home');

  useEffect(() => {
    if (id) {
      loadDoctor();
    }
  }, [id]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      const data = await doctorApi.getDetail(id!);
      setDoctor(data);
    } catch (err) {
      console.error('加载医生详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-on-surface-variant font-sans">加载医生资料...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-on-surface-variant font-sans">医生信息不存在</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold">返回上一页</button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="flex items-center justify-between px-4 w-full h-14 z-50 bg-surface sticky top-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:bg-surface-container-low active:scale-95 transition-all p-2 -ml-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-xl font-semibold text-primary">医生详情</h1>
        <div className="w-10"></div>
      </header>

      <main>
        {/* Doctor Profile Hero Card */}
        <section className="px-4 mt-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-surface-variant shadow-[0_4px_20px_rgba(0,78,159,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-fixed rounded-full blur-3xl -mr-16 -mt-16 opacity-40"></div>

            <div className="flex items-start gap-6 relative z-10">
              <div className="relative">
                <img
                  src={doctor.avatarUrl || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200"}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-xl object-cover border border-surface-variant bg-surface-container"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-surface-container-lowest"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-end gap-2 mb-1">
                  <h2 className="font-sans text-2xl font-bold text-on-surface">{doctor.name}</h2>
                  <span className="font-sans text-sm text-primary pb-1">{doctor.title}</span>
                </div>
                <p className="font-sans text-sm text-on-surface-variant">{doctor.hospital} · {doctor.department}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-1 relative z-10">
              {doctor.specialties?.split('、').map(s => (
                <span key={s} className="px-3 py-1 bg-primary-fixed text-on-primary-fixed font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold rounded-full">{s}</span>
              ))}
            </div>

            {/* Stats Row */}
            <div className="mt-6 pt-4 border-t border-surface-variant flex justify-between relative z-10">
              <div className="text-center flex-1">
                <p className="font-sans text-xl font-semibold text-on-surface">20年+</p>
                <p className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant mt-1">从业经验</p>
              </div>
              <div className="w-px bg-surface-variant my-2"></div>
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-1">
                  <p className="font-sans text-xl font-semibold text-on-surface">{doctor.rating}</p>
                  <Star className="text-tertiary fill-current" size={16} />
                </div>
                <p className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant mt-1">患者评分</p>
              </div>
              <div className="w-px bg-surface-variant my-2"></div>
              <div className="text-center flex-1">
                <p className="font-sans text-xl font-semibold text-on-surface">{doctor.serviceCount}+</p>
                <p className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant mt-1">服务人次</p>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="px-4 mt-8">
          <h3 className="font-sans text-xl font-semibold text-on-surface mb-4">医生简介</h3>
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm">
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {doctor.introduction || '暂无简介'}
            </p>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="px-4 mt-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-xl font-semibold text-on-surface">患者评价 ({doctor.serviceCount})</h3>
            <button className="font-sans text-sm text-primary flex items-center hover:opacity-80 transition-opacity">
              查看全部 <ChevronRight size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {review.avatar ? (
                      <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-surface-variant rounded-full flex items-center justify-center font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-on-surface-variant">
                        {review.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-sans text-sm font-medium text-on-surface">{review.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{review.type} · {review.time}</p>
                    </div>
                  </div>
                  <div className="flex text-tertiary">
                    {Array.from({ length: Math.floor(review.stars) }).map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                    {review.stars % 1 !== 0 && <StarHalf size={14} className="fill-current" />}
                  </div>
                </div>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-surface-variant px-4 py-3 pb-safe flex gap-4 items-center z-50 shadow-[0_-4px_20px_rgba(0,92,186,0.04)]">
        <Link
          to={`/booking/${doctor.id}`}
          className="flex-1 min-h-[52px] bg-primary text-on-primary font-sans text-lg font-semibold rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,78,159,0.2)]"
        >
          立即预约
        </Link>
      </div>
    </div>
  );
}

