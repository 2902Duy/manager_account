import React from 'react';
import { Moon, Settings, Shield } from 'lucide-react';
import PasswordInput from './PasswordInput';
import DriveSettings from './DriveSettings';

export default function SettingsPanel({
  dark,
  setDark,
  isLocked,
  onToggleVaultLock,
  autoLockMinutes,
  setAutoLockMinutes,
  changePasswordForm,
  setChangePasswordForm,
  changePasswordStatus,
  setChangePasswordStatus,
  changePasswordLoading,
  onChangePassword,
  onOpenImportExport,
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <h1 className="text-[32px] font-bold mb-2">Cài đặt</h1>
      <p className="text-warm-gray-500 mb-8">Quản lý bảo mật, giao diện và dữ liệu cá nhân.</p>

      <div className="grid gap-6">
        <section className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
          <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
            <Moon size={18} className="text-notion-blue" /> Giao diện
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[14px]">Dark mode</p>
              <p className="text-[13px] text-warm-gray-400">Đổi giao diện sáng/tối.</p>
            </div>
            <button onClick={() => setDark(!dark)} className={`w-12 h-6 rounded-full transition-all relative ${dark ? 'bg-notion-blue' : 'bg-warm-white border border-whisper'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${dark ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
          <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
            <Shield size={18} className="text-emerald-500" /> Bảo mật
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[14px]">Trạng thái DLock</p>
                <p className="text-[13px] text-warm-gray-400">Khóa hoặc mở vault ngay lập tức.</p>
              </div>
              <button
                onClick={onToggleVaultLock}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all border ${
                  isLocked
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20'
                }`}
              >
                {isLocked ? 'Đang khóa' : 'Đang mở'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-whisper pt-4 dark:border-neutral-700">
              <div>
                <p className="font-semibold text-[14px]">Auto-lock</p>
                <p className="text-[13px] text-warm-gray-400">Tự khóa vault sau một khoảng thời gian không hoạt động.</p>
              </div>
              <select
                value={autoLockMinutes}
                onChange={e => setAutoLockMinutes(Number(e.target.value))}
                className="rounded-[8px] border border-whisper bg-warm-white px-3 py-2 text-[13px] font-semibold text-notion-black outline-none transition focus:border-notion-blue focus:ring-2 focus:ring-notion-blue/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              >
                <option value={0}>Tắt</option>
                <option value={5}>5 phút</option>
                <option value={10}>10 phút</option>
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
              </select>
            </div>

            <form onSubmit={onChangePassword} className="pt-4 border-t border-whisper dark:border-neutral-700">
              <div className="mb-4">
                <p className="font-semibold text-[14px]">Đổi mật khẩu đăng nhập</p>
                <p className="text-[13px] text-warm-gray-400">Nhập mật khẩu hiện tại để xác minh, sau đó đặt mật khẩu mới.</p>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Mật khẩu hiện tại</label>
                  <PasswordInput
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                    value={changePasswordForm.currentPassword}
                    onChange={e => {
                      setChangePasswordStatus({ type: '', message: '' });
                      setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value });
                    }}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Mật khẩu mới</label>
                    <PasswordInput
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                      value={changePasswordForm.newPassword}
                      onChange={e => {
                        setChangePasswordStatus({ type: '', message: '' });
                        setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-warm-gray-500 dark:text-neutral-400 mb-1.5">Xác nhận mật khẩu mới</label>
                    <PasswordInput
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full bg-warm-white dark:bg-neutral-900 border border-whisper dark:border-neutral-700 rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-notion-blue/30 focus:border-notion-blue transition"
                      value={changePasswordForm.confirmPassword}
                      onChange={e => {
                        setChangePasswordStatus({ type: '', message: '' });
                        setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>

              {changePasswordStatus.message && (
                <p className={`mt-3 text-[12px] font-medium ${changePasswordStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {changePasswordStatus.message}
                </p>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="px-4 py-2 bg-notion-blue text-white hover:bg-notion-blue-hover disabled:opacity-60 rounded-lg text-[13px] font-bold transition"
                >
                  {changePasswordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <DriveSettings />

        <section className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-whisper dark:border-neutral-700 shadow-sm">
          <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-notion-black dark:text-white">
            <Settings size={18} className="text-warm-gray-400" /> Dữ liệu
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[14px]">Sao lưu & phục hồi</p>
              <p className="text-[13px] text-warm-gray-400">Xuất hoặc nhập dữ liệu bằng file mã hóa.</p>
            </div>
            <button onClick={onOpenImportExport} className="px-5 py-2 bg-notion-blue text-white hover:bg-notion-blue-hover rounded-lg text-[13px] font-bold transition shadow-sm">
              Quản lý
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
