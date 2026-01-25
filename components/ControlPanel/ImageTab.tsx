import React from 'react';
import { Upload } from 'lucide-react';
import { PRESET_URIS } from '../../utils/presetShapes';

interface ImageTabProps {
    onProcessImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onProcessSample: (key: keyof typeof PRESET_URIS) => void;
}

const ImageTab: React.FC<ImageTabProps> = ({
    onProcessImage,
    onProcessSample,
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-zinc-900/30 border border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-zinc-800/30 hover:border-zinc-500 transition-all group cursor-pointer relative">
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={onProcessImage}
                />
                <div className="p-3 bg-zinc-900 rounded-full border border-white/10 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-zinc-300">导入图片</p>
                    <p className="text-[10px] text-zinc-600">支持 PNG/JPG 自动轮廓追踪</p>
                </div>
            </div>

            <div>
                <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">或者尝试示例</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onProcessSample('PIKACHU')}
                        className="h-16 bg-zinc-900/50 border border-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-yellow-200">#025</span>
                        <span className="text-[9px] text-zinc-600 uppercase">皮卡丘</span>
                    </button>
                    <button
                        onClick={() => onProcessSample('DORAEMON')}
                        className="h-16 bg-zinc-900/50 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-blue-200">#Robot</span>
                        <span className="text-[9px] text-zinc-600 uppercase">哆啦A梦</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageTab;
