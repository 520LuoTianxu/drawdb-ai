import React, { useState } from 'react';
import { X, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface ExportModalProps {
  onExport: (config: { autoLayout: boolean; backgroundColor: string }) => void;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onExport, onClose }) => {
  const [autoLayout, setAutoLayout] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#0f172a'); // Default to Slate-900 (Theme bg)
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animation-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-lg shadow-2xl border border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon size={20} className="text-primary"/> {t('export_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
           {/* Auto Layout Option */}
           <div className="flex items-start gap-3 p-3 rounded bg-slate-900/50 border border-slate-700/50">
              <input 
                type="checkbox" 
                id="auto-layout" 
                checked={autoLayout} 
                onChange={(e) => setAutoLayout(e.target.checked)}
                className="mt-1 rounded bg-slate-800 border-slate-600 focus:ring-primary cursor-pointer w-4 h-4"
              />
              <div className="flex-1">
                  <label htmlFor="auto-layout" className="text-sm font-bold text-slate-200 cursor-pointer block">
                      {t('auto_layout')}
                  </label>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t('auto_layout_desc')}
                  </p>
              </div>
           </div>

           {/* Background Color Option */}
           <div>
               <label className="text-sm font-semibold text-slate-300 block mb-2">
                   {t('bg_color')}
               </label>
               <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded border border-slate-700/50">
                   <div className="relative group">
                        <input 
                                type="color" 
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="h-9 w-16 bg-transparent border-0 rounded cursor-pointer p-0 opacity-0 absolute inset-0 z-10"
                        />
                        <div 
                            className="h-9 w-16 rounded border border-slate-600 shadow-sm"
                            style={{ backgroundColor: backgroundColor }}
                        ></div>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-xs text-slate-400 font-mono uppercase">{backgroundColor}</span>
                       <span className="text-[10px] text-slate-500">{t('click_to_change')}</span>
                   </div>
               </div>
           </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2 bg-slate-900/30">
            <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button onClick={() => onExport({ autoLayout, backgroundColor })} className="gap-2 shadow-lg shadow-blue-500/10">
                <Download size={16} /> {t('export_btn')}
            </Button>
        </div>
      </div>
    </div>
  );
};