import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[App Error Boundary Caught Error]:', error, errorInfo);
  }

  public handleResetAndReload = () => {
    try {
      localStorage.removeItem('ytlyrics_train_journey');
      localStorage.removeItem('ytlyrics_wallpaper_id');
      localStorage.removeItem('ytlyrics_tasks');
      localStorage.removeItem('ytlyrics_active_task_id');
      localStorage.removeItem('ytlyrics_ambient_volumes');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center font-apple select-none">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-2xl text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <h2 className="text-sm font-semibold tracking-normal text-white font-sans">
                Khôi phục hệ thống
              </h2>
            </div>
            <p className="text-xs text-white/60 mb-4 font-sans leading-relaxed">
              Ứng dụng phát hiện lỗi trong quá trình khởi tạo dữ liệu cục bộ. Bạn có thể tải lại trang hoặc đặt lại dữ liệu cache.
            </p>
            <div className="p-3 bg-black/60 rounded-xl text-[11px] font-mono text-red-300/80 max-h-36 overflow-auto mb-5 border border-white/[0.06]">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition"
              >
                Tải lại (Reload)
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="px-4 py-2 rounded-xl bg-white/10 text-white/80 font-medium text-xs hover:bg-white/20 transition border border-white/10"
              >
                Xoá cache & Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
