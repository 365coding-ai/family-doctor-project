import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Edit2, Trash2, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userApi, type UserAddress } from '../lib/api';

export default function AddressManagementScreen() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('加载地址失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该地址吗？')) return;
    try {
      await userApi.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('删除地址失败:', err);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen pb-32">
      <header className="sticky top-0 w-full z-50 bg-surface flex items-center px-4 h-14">
        <button onClick={() => navigate(-1)} className="text-primary hover:bg-surface-container-low rounded-full p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-sans text-2xl font-bold text-primary flex-1 text-center pr-10">地址管理</h1>
      </header>

      <main className="pt-6 px-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-outline" />
            <p className="text-lg font-semibold mb-1">暂无地址</p>
            <p className="text-sm">点击下方按钮添加新地址</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-lg font-semibold">{addr.name}</span>
                      <span className="font-sans text-sm text-on-surface-variant">{addr.phone}</span>
                    </div>
                    {addr.isDefault && (
                      <span className="bg-primary-fixed text-on-primary-fixed font-['Atkinson_Hyperlegible_Next'] text-[10px] px-2 py-0.5 rounded-full w-max">默认</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="text-primary mt-0.5" size={20} />
                  <p className="font-sans text-sm">
                    {addr.province}{addr.city}{addr.district}<br/>
                    <span className="text-on-surface-variant">{addr.detail}</span>
                  </p>
                </div>
                <div className="border-t border-outline-variant/20 pt-2 flex justify-end gap-4">
                  <button className="flex items-center gap-1 text-on-surface-variant hover:text-primary">
                    <Edit2 size={16} /><span className="text-sm">编辑</span>
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-error"
                  >
                    <Trash2 size={16} /><span className="text-sm">删除</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 w-full z-40 bg-surface-container-lowest px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-outline-variant/10">
        <button className="w-full h-[52px] bg-primary text-on-primary rounded-xl font-sans text-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
          <Plus size={24} /> 添加新地址
        </button>
      </div>
    </div>
  );
}
