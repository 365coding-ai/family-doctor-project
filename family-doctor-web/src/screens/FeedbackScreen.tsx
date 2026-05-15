import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function FeedbackScreen() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);

  return (
    <div className="min-h-screen flex flex-col pb-safe">
      <header className="flex items-center px-4 w-full h-14 z-50 sticky top-0 bg-surface">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-primary -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-xl font-semibold text-primary flex-1 text-center pr-8">服务评价</h1>
      </header>

      <main className="flex-grow px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-8">
        <section className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm flex items-center gap-4">
          <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200" alt="Doctor" className="w-16 h-16 rounded-full object-cover shadow-sm" />
          <div className="flex-col flex">
            <h2 className="font-sans text-lg font-semibold">李明 医生</h2>
            <span className="font-sans text-sm text-on-surface-variant mt-1">全科医生 · 15年经验</span>
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 pt-4">
          <h3 className="font-sans text-xl font-semibold text-center">您对本次服务满意吗？</h3>
          <p className="font-sans text-sm text-on-surface-variant text-center max-w-sm">您的反馈将帮助我们不断提升医疗服务质量，为更多家庭带来安心。</p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
             {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className={cn("p-1 transition-transform active:scale-95", rating >= star ? "text-tertiary-fixed-dim" : "text-outline-variant hover:text-tertiary-fixed-dim")}>
                   <Star size={40} className={rating >= star ? "fill-current" : ""} />
                </button>
             ))}
          </div>
          {rating > 0 && <span className="font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold text-tertiary mt-1">非常满意</span>}
        </section>

        <form className="flex flex-col gap-6 w-full mt-2">
          <div className="flex flex-col gap-2">
            <label className="font-sans text-lg font-semibold">详细评价</label>
            <textarea className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 font-sans text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none shadow-sm" rows={4} placeholder="医生沟通是否耐心？治疗方案是否清晰？请分享您的就诊体验..."></textarea>
          </div>
          
          <div className="flex flex-col gap-2">
             <label className="font-sans text-lg font-semibold">上传图片 <span className="font-sans text-sm text-on-surface-variant font-normal">(选填, 最多3张)</span></label>
             <div className="flex gap-4 flex-wrap">
                <button type="button" className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center gap-1 hover:bg-surface-container transition-colors">
                  <ImagePlus className="text-on-surface-variant" size={24} />
                  <span className="font-['Atkinson_Hyperlegible_Next'] text-[10px] text-on-surface-variant">添加照片</span>
                </button>
             </div>
          </div>

          <div className="pt-6 pb-8">
             <button type="button" onClick={() => navigate(-1)} className="w-full h-[52px] bg-primary text-on-primary font-sans text-xl font-semibold rounded-full shadow-md flex items-center justify-center">
                提交评价
             </button>
          </div>
        </form>
      </main>
    </div>
  );
}
