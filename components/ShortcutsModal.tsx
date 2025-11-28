import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const { t } = useLanguage();

  const shortcuts = [
    { key: 'Delete / Backspace', desc: t('sc_del') },
    { key: 'Ctrl + Z', desc: t('sc_undo') },
    { key: 'Ctrl + Y', desc: t('sc_redo') },
    { key: 'Ctrl + S', desc: t('sc_save') },
    { key: 'Shift + Drag', desc: t('sc_multiselect') },
    { key: 'Scroll', desc: t('sc_zoom') },
    { key: 'Space + Drag', desc: t('sc_pan') },
    { key: 'Double Click Table', desc: t('sc_edit') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animation-fade-in">
      <div className="bg-surface w-full max-w-md rounded-lg shadow-2xl border border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Keyboard size={20} className="text-primary"/> {t('shortcuts_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-2">
          <div className="grid grid-cols-1 divide-y divide-border">
            {shortcuts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
                <span className="text-sm text-slate-300">{item.desc}</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-400 min-w-[60px] text-center shadow-sm">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end">
            <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
        </div>
      </div>
    </div>
  );
};