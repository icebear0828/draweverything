import { useState, type FC } from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';

interface AITabProps {
    loading: boolean;
    onProcessAI: (prompt: string) => void;
}

const AITab: FC<AITabProps> = ({
    loading,
    onProcessAI,
}) => {
    const [prompt, setPrompt] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">输入角色/物体描述</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如: 一只赛博朋克风格的猫，或者一朵极简主义的玫瑰..."
                    className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-lg p-3 text-xs text-zinc-200 focus:border-purple-500/50 focus:outline-none resize-none"
                />
            </div>

            <button
                onClick={() => onProcessAI(prompt)}
                disabled={loading || !prompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/20 rounded-lg text-xs font-bold text-purple-100 tracking-wide uppercase shadow-lg hover:shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Wand2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                )}
                {loading ? '正在合成...' : '生成 FFT 绘图'}
            </button>

            <p className="text-[10px] text-zinc-600 leading-relaxed text-center px-2">
                Powered by Gemini 2.5 Flash.
            </p>
        </div>
    );
};

export default AITab;
