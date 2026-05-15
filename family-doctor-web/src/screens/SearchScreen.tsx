import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, Home as HomeIcon, Video, MapPin, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { doctorApi, type Doctor } from '../lib/api';

const departments = ['全部科室', '全科', '儿科', '内科', '老年科', '中医科', '皮肤科'];

export default function SearchScreen() {
  const [searchParams] = useSearchParams();
  const initialDept = searchParams.get('department') || '全部科室';

  const [activeDept, setActiveDept] = useState(initialDept);
  const [sortBy, setSortBy] = useState('综合排序');
  const [homeVisitFilter, setHomeVisitFilter] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 当 URL 参数变化时更新 activeDept
  useEffect(() => {
    const dept = searchParams.get('department');
    if (dept) {
      setActiveDept(dept);
      setKeyword(dept); // 同步回显到搜索框
    }
  }, [searchParams]);

  const fetchDoctors = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const p = reset ? 0 : page;
      const res = await doctorApi.search({
        keyword: keyword || undefined,
        department: activeDept === '全部科室' ? undefined : activeDept,
        page: p,
        size: 10,
      });
      if (reset) {
        setDoctors(res.content);
        setPage(0);
      } else {
        setDoctors(prev => [...prev, ...res.content]);
      }
      setHasMore(res.number < res.totalPages - 1);
    } catch (err) {
      console.error('搜索医生失败:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, activeDept, page]);

  // 统一搜索驱动：监听所有筛选维度的变化，并执行防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeDept, keyword]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchDoctors(false);
    }
  };

  // 前端过滤（上门服务）
  const filtered = homeVisitFilter ? doctors.filter(d => d.canHomeVisit) : doctors;

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Header */}
      <header className="bg-surface flex items-center justify-between px-4 w-full h-14 z-50 sticky top-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="w-10"></div>
        <h1 className="font-sans text-xl font-bold text-primary flex-1 text-center">搜索</h1>
        <div className="w-10"></div>
      </header>

      {/* Search Input */}
      <section className="px-4">
        <div className="relative w-full bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden shadow-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <input
            type="text"
            placeholder="搜索医生、症状或科室"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 font-sans text-[15px] text-on-surface focus:ring-0 outline-none"
            autoFocus
          />
        </div>
      </section>

      {/* Department Filter Chips */}
      <section className="flex overflow-x-auto gap-2 px-4 scrollbar-none">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-['Atkinson_Hyperlegible_Next'] text-xs font-semibold transition-colors ${activeDept === dept
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
          >
            {dept}
          </button>
        ))}
      </section>

      {/* Sort & Filter Row */}
      <section className="px-4 flex items-center gap-3 overflow-x-auto scrollbar-none">
        {['综合排序', '距离最近'].map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold transition-colors ${sortBy === sort ? 'text-primary' : 'text-on-surface-variant'
              }`}
          >
            {sort}
            <ChevronDown size={14} />
          </button>
        ))}
        <div className="w-px h-4 bg-outline-variant shrink-0"></div>
        <button
          onClick={() => setHomeVisitFilter(!homeVisitFilter)}
          className={`flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold transition-colors ${homeVisitFilter ? 'text-primary' : 'text-on-surface-variant'
            }`}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${homeVisitFilter ? 'bg-primary border-primary' : 'border-outline-variant'
            }`}>
            {homeVisitFilter && <span className="text-on-primary text-[10px] font-bold">✓</span>}
          </div>
          支持上门
        </button>
      </section>

      {/* Doctor List */}
      <section className="px-4 flex flex-col gap-3">
        {loading && doctors.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <p className="text-lg font-semibold mb-1">暂无医生</p>
            <p className="text-sm">请尝试其他搜索词或科室</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <Link
              key={doc.id}
              to={`/doctor/${doc.id}`}
              className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4 flex gap-4 hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="relative shrink-0">
                <img
                  src={doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=e3f2fd&color=004e9f&size=128`}
                  alt={doc.name}
                  className="w-16 h-16 rounded-xl object-cover border border-surface-variant"
                />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest ${doc.status === 1 ? 'bg-[#10b981]' : 'bg-outline-variant'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-sans text-lg font-semibold text-on-surface truncate">{doc.name}</h3>
                  <div className="flex items-center gap-1 bg-tertiary-fixed/30 text-tertiary px-2 py-0.5 rounded-full shrink-0">
                    <Star size={12} className="fill-current" />
                    <span className="font-['Atkinson_Hyperlegible_Next'] text-[11px] font-semibold">{doc.rating}</span>
                  </div>
                </div>
                <p className="font-sans text-sm text-on-surface-variant truncate mb-2">{doc.title} · {doc.hospital}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-['Atkinson_Hyperlegible_Next'] text-[11px] font-semibold">{doc.department}</span>
                  {doc.specialties && doc.specialties.split(',').slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-['Atkinson_Hyperlegible_Next'] text-[11px] font-semibold">{tag.trim()}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    {doc.status === 1 && <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>}
                    {doc.canHomeVisit && <HomeIcon size={16} className="text-outline" />}
                  </div>
                  {doc.canHomeVisit ? (
                    <span className="text-[13px] text-secondary font-semibold">可上门 ¥{doc.homeVisitPrice}</span>
                  ) : (
                    <span className="text-[13px] text-primary">问诊 ¥{doc.consultPrice}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Load More */}
      {hasMore && filtered.length > 0 && (
        <section className="px-4 pb-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-3 rounded-full border-2 border-primary text-primary font-sans text-[15px] font-bold hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多医生'}
          </button>
        </section>
      )}
    </div>
  );
}
