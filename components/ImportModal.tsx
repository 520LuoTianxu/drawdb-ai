import React, { useState } from 'react';
import { X, Upload, Play, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface ImportModalProps {
  onImport: (sql: string) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [sql, setSql] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleImport = () => {
    if (!sql.trim()) {
        setError(t('import_error_empty'));
        return;
    }
    try {
        onImport(sql);
        onClose();
    } catch (e) {
        setError(t('import_error_fail'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) setSql(evt.target.result as string);
        };
        reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl rounded-lg shadow-2xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-primary"/> {t('import_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
           <div className="bg-slate-900/50 p-4 rounded border border-blue-900/30 text-sm text-blue-200">
                {t('import_instruction')}
           </div>
           
           <div className="flex items-center gap-4">
                <input 
                    type="file" 
                    id="file-upload" 
                    accept=".sql" 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-slate-200 transition-colors"
                >
                    {t('upload_btn')}
                </label>
                <span className="text-xs text-slate-500">{t('paste_or')}</span>
           </div>

           <textarea
             className="w-full h-64 bg-slate-950 border border-slate-700 rounded p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-primary focus:outline-none"
             placeholder={t('import_placeholder')}
             value={sql}
             onChange={(e) => setSql(e.target.value)}
           />
           
           {error && (
               <div className="text-red-400 text-sm flex items-center gap-2">
                   <AlertCircle size={16} /> {error}
               </div>
           )}
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button onClick={handleImport} className="gap-2">
                <Play size={16} /> {t('parse_generate')}
            </Button>
        </div>
      </div>
    </div>
  );
};