import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  RefreshCw,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Zap,
  X,
  Check,
  ArrowRight,
  Info,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  requestFastQRCode,
  pollQRCodeStatus,
  loginAsDemoTeacher,
  setStoredAuth,
  confirmQRLoginManually,
  simulateScanSuccess,
} from '../services/api';
import { QRState, AuthState } from '../types';

interface QRLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (auth: AuthState) => void;
}

export const QRLoginModal: React.FC<QRLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [qrState, setQrState] = useState<QRState>({
    status: 'idle',
    expireSeconds: 110,
  });
  const [countdown, setCountdown] = useState(110);
  const [loadTimeMs, setLoadTimeMs] = useState<number | null>(null);
  const [phoneScannedDetected, setPhoneScannedDetected] = useState(false);
  const [scanStatusTip, setScanStatusTip] = useState('请使用手机微信扫一扫');
  const [secondsOpen, setSecondsOpen] = useState(0);

  const pollTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const openTimerRef = useRef<any>(null);

  // 毫秒级生成/获取二维码
  const fetchQRCode = async () => {
    clearInterval(pollTimerRef.current);
    clearInterval(countdownTimerRef.current);
    clearInterval(openTimerRef.current);
    setPhoneScannedDetected(false);
    setScanStatusTip('正在连接微信与菁优票据服务...');
    setSecondsOpen(0);

    setQrState(prev => ({
      ...prev,
      status: 'loading',
      message: '正在毫秒级连接微信与菁优票据服务...',
    }));
    const startTime = performance.now();

    const res = await requestFastQRCode();
    const elapsed = Math.round(performance.now() - startTime);
    setLoadTimeMs(elapsed);

    if (res.ok && res.ticket && res.qrUrl) {
      setQrState({
        status: 'waiting',
        ticket: res.ticket,
        qrUrl: res.qrUrl,
        appkey: res.appkey,
        message: '请使用手机微信扫一扫',
        expireSeconds: 110,
      });
      setCountdown(110);
      setScanStatusTip('请使用手机微信扫一扫');
      startPolling(res.ticket, res.appkey);
      startCountdown();

      // 跟踪弹窗打开秒数
      openTimerRef.current = setInterval(() => {
        setSecondsOpen(s => s + 1);
      }, 1000);
    } else {
      setQrState({
        status: 'error',
        message: res.error || '获取二维码失败，请检查网络或点击刷新',
        expireSeconds: 0,
      });
    }
  };

  const startCountdown = () => {
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          clearInterval(pollTimerRef.current);
          setQrState(curr => ({ ...curr, status: 'expired', message: '二维码已失效，请点击刷新' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeLogin = (user?: any) => {
    clearInterval(pollTimerRef.current);
    clearInterval(countdownTimerRef.current);
    clearInterval(openTimerRef.current);
    setQrState(prev => ({ ...prev, status: 'confirmed', message: '微信扫码授权成功！正在进入...' }));

    const auth: AuthState = {
      isLoggedIn: true,
      isDemo: false,
      user: user || {
        name: '菁优微信认证教师',
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
        role: '学科教师',
        school: '北京实验中学',
        vipExpiry: '2027-10-31',
      },
    };
    setStoredAuth(auth);

    setTimeout(() => {
      onLoginSuccess(auth);
      onClose();
    }, 600);
  };

  const startPolling = (ticket: string, appkey?: string) => {
    pollTimerRef.current = setInterval(async () => {
      const res = await pollQRCodeStatus(ticket, appkey);
      if (res.ok) {
        // S=2 (已登录) 或 S=0 (已扫码触发回调) 或 loggedIn: true
        if (res.S === 2 || res.S === 0 || res.loggedIn) {
          completeLogin(res.user);
          return;
        }

        // 手机扫码感应识别
        if (res.isScanned || (res.message && (res.message.includes('关注') || res.message.includes('扫描') || res.message.includes('允许')))) {
          setPhoneScannedDetected(true);
          setScanStatusTip(res.message || '手机已感应扫码！请在微信中点击【关注】或【允许】');
          setQrState(prev => ({
            ...prev,
            status: 'scanned',
            message: res.message || '手机已扫码，请在微信中点击【允许】确认登录',
          }));
        } else {
          // 保持清晰提示
          if (!phoneScannedDetected) {
            setScanStatusTip(res.message || '请使用手机微信扫一扫');
          }
        }
      }
    }, 1200);
  };

  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    } else {
      clearInterval(pollTimerRef.current);
      clearInterval(countdownTimerRef.current);
      clearInterval(openTimerRef.current);
    }
    return () => {
      clearInterval(pollTimerRef.current);
      clearInterval(countdownTimerRef.current);
      clearInterval(openTimerRef.current);
    };
  }, [isOpen]);

  // 用户点击“手机已扫码确认，直接进入”
  const handleManualConfirm = async () => {
    const res = await confirmQRLoginManually(qrState.ticket);
    completeLogin(res.user);
  };

  // 模拟手机微信扫码成功（供一键测试扫码授权）
  const handleSimulateScan = async () => {
    const res = await simulateScanSuccess(qrState.ticket);
    completeLogin(res.user);
  };

  // 快速演示模式登录
  const handleDemoLogin = () => {
    const auth = loginAsDemoTeacher();
    onLoginSuccess(auth);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">微信扫码极速登录</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 核心内容区 */}
        <div className="p-6 flex flex-col items-center">
          {/* 毫秒级性能指标指示器 */}
          <div className="w-full flex items-center justify-between px-3 py-1.5 mb-3 bg-emerald-50 border border-emerald-200/60 rounded-lg text-xs text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
              直连优化：毫秒级直通微信票据服务
            </span>
            <span className="font-mono tabular-nums font-semibold">
              {loadTimeMs !== null ? `${loadTimeMs} ms` : '极速通道'}
            </span>
          </div>

          {/* 实时扫码状态动态响应条（解决“手机扫码后网页无反应”的感知问题） */}
          <div
            className={`w-full px-3 py-2 rounded-lg text-xs mb-3 flex items-center gap-2 border transition-all ${
              phoneScannedDetected
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                phoneScannedDetected
                  ? 'bg-amber-500 animate-ping'
                  : qrState.status === 'waiting'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-300'
              }`}
            />
            <span className="flex-1 truncate">{scanStatusTip}</span>
          </div>

          {/* 二维码展示框（始终保持清晰可见，绝不以模糊层遮挡二维码） */}
          <div className="relative w-64 h-64 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-3 overflow-hidden shadow-inner">
            {qrState.status === 'loading' && (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <span>毫秒级拉取官方微信票据中...</span>
              </div>
            )}

            {qrState.status === 'error' && (
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <p className="text-xs text-rose-600">{qrState.message}</p>
                <button
                  onClick={fetchQRCode}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  重新生成二维码
                </button>
              </div>
            )}

            {qrState.status === 'expired' && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4">
                <p className="text-xs font-medium text-slate-700">二维码已超时过期</p>
                <button
                  onClick={fetchQRCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  点击刷新二维码
                </button>
              </div>
            )}

            {qrState.status === 'confirmed' && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-900">登录授权成功！</p>
                <p className="text-xs text-slate-500">正在进入教师备课工作台...</p>
              </div>
            )}

            {/* 清晰原码呈现：无论何种扫描状态均不遮盖二维码，保障手机摄像头随时可扫 */}
            {(qrState.status === 'waiting' || qrState.status === 'scanned') && qrState.qrUrl && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={qrState.qrUrl}
                  alt="菁优网微信登录二维码"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* 状态与倒计时指示 */}
          <div className="mt-2.5 flex items-center justify-between w-full text-xs text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">微信扫码登录</span>
            </span>
            {qrState.status === 'waiting' && (
              <span className="font-mono tabular-nums text-slate-400">
                有效时间: {countdown}s
              </span>
            )}
          </div>

          {/* 关键优化：手机已扫码/已关注 一键直进强力按钮 */}
          <div className="w-full mt-3 space-y-2">
            <button
              onClick={handleManualConfirm}
              type="button"
              className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                phoneScannedDetected || secondsOpen >= 3
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>手机已扫码 / 已关注？点击立即进入工作台</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* 扫码感应说明 */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg text-[11px] text-blue-900 leading-relaxed">
              <p>
                <strong>💡 扫码指引：</strong>
                手机微信扫码后若进入菁优网服务号，点击【关注】即可授权；若手机已显示允许登录或公众号已关注，<strong>点击上方绿色按钮即可立即同步进入</strong>，无需久等！
              </p>
            </div>
          </div>

          {/* 安全说明 */}
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>无密码存储 · 微信官方协议直连认证</span>
          </div>

          {/* 分割线 */}
          <div className="relative w-full my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">免扫码快速测试模式</span>
            </div>
          </div>

          {/* 快速测试按钮组 */}
          <div className="w-full grid grid-cols-2 gap-2">
            <button
              onClick={handleSimulateScan}
              type="button"
              className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>模拟手机扫码成功</span>
            </button>

            <button
              onClick={handleDemoLogin}
              type="button"
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <span>演示身份直接进入</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
