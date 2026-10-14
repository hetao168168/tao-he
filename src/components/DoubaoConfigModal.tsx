import React, { useState, useEffect } from 'react';
import {
  DoubaoConfig,
  getDoubaoConfig,
  saveDoubaoConfig,
  testDoubaoConnection,
} from '../services/doubaoService';
import {
  Bot,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Layers,
  Zap,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface DoubaoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
}

export const DoubaoConfigModal: React.FC<DoubaoConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'free' | 'custom'>('free');
  const [apiKey, setApiKey] = useState('');
  const [endpointId, setEndpointId] = useState('');
  const [modelName, setModelName] = useState('Doubao-Lite (免费版)');

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await getDoubaoConfig();
      setMode(cfg.mode || 'free');
      setApiKey(cfg.apiKey || '');
      setEndpointId(cfg.endpointId || 'doubao-lite-4k-free');
      setModelName(cfg.modelName || 'Doubao-Lite (免费版)');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // 若当前在编辑 custom，先临时发送
      const res = await testDoubaoConnection();
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      const ok = await saveDoubaoConfig({
        mode,
        apiKey: apiKey.trim(),
        endpointId: endpointId.trim() || (mode === 'free' ? 'doubao-lite-4k-free' : 'doubao-pro-32k'),
        modelName: mode === 'free' ? 'Doubao-Lite (官方免费通道)' : '火山方舟 Ark 专有接入',
      });
      if (ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        if (onConfigChanged) onConfigChanged();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden">
        {/* 顶部标题 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              🤖
            </div>
            <div>
              <h3 className="text-sm font-bold">豆包大模型（Doubao AI）服务接入配置</h3>
              <p className="text-[11px] text-slate-400">字节跳动火山引擎 · 教师错题智能诊断与变式出题</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs text-slate-700">
          {/* 通道模式选择 */}
          <div>
            <label className="block font-semibold text-slate-800 mb-2">接入通道模式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('free')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  mode === 'free'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    豆包官方免费直连通道
                  </span>
                  {mode === 'free' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  无需任何 API Key，开箱即用。全功能支持错题归因、举一反三与教学助教。
                </p>
                <span className="mt-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  推荐 · 零门槛
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  mode === 'custom'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    火山引擎方舟 Ark 自定义
                  </span>
                  {mode === 'custom' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  填入您在火山引擎方舟申请的专属 API Key 和 Model Endpoint。
                </p>
                <span className="mt-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
                  专业专属通道
                </span>
              </button>
            </div>
          </div>

          {/* 自定义模式输入表单 */}
          {mode === 'custom' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  火山引擎 Ark API Key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="例如：6d35****-****-****-****-************"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-800 mb-1">
                  接入点 Model Endpoint ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={endpointId}
                  onChange={e => setEndpointId(e.target.value)}
                  placeholder="例如：ep-20250101-xxxx 或 doubao-pro-32k"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>可通过火山引擎控制台 ➜ 在线推理 ➜ 模型接入点获取</span>
                <a
                  href="https://console.volcengine.com/ark"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>访问方舟平台</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* 状态与测速结果 */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latency !== undefined && (
                  <p className="text-[11px] opacity-80 mt-0.5 font-mono">
                    响应延迟：{testResult.latency} ms
                  </p>
                )}
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>豆包大模型配置已成功保存并立即生效！</span>
            </div>
          )}

          {/* 按钮栏 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? '测试连接中...' : '测试连通性'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
