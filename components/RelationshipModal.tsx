import React from 'react';
import { X, ArrowRightLeft, ArrowRight, GitCommit } from 'lucide-react';
import { Button } from './ui/Button';
import { Cardinality } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RelationshipModalProps {
  sourceName: string;
  targetName: string;
  onConfirm: (cardinality: Cardinality) => void;
  onCancel: () => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({ 
  sourceName, 
  targetName, 
  onConfirm, 
  onCancel 
}) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-lg shadow-2xl border border-border flex flex-col animation-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitCommit size={20} className="text-primary"/> {t('rel_title')}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
           <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded border border-slate-700">
              <span className="font-bold text-blue-200">{sourceName}</span>
              <ArrowRight className="text-slate-500" />
              <span className="font-bold text-blue-200">{targetName}</span>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onConfirm(Cardinality.ONE_TO_ONE)}
                className="flex flex-col items-center justify-center p-4 rounded border border-slate-700 hover:border-primary hover:bg-slate-800 transition-all group"
              >
                 <div className="text-lg font-bold text-slate-300 group-hover:text-primary mb-1">1 : 1</div>
                 <div className="text-xs text-slate-500">{t('one_to_one')}</div>
              </button>

              <button 
                onClick={() => onConfirm(Cardinality.ONE_TO_MANY)}
                className="flex flex-col items-center justify-center p-4 rounded border border-slate-700 hover:border-primary hover:bg-slate-800 transition-all group"
              >
                 <div className="text-lg font-bold text-slate-300 group-hover:text-primary mb-1">1 : N</div>
                 <div className="text-xs text-slate-500">{t('one_to_many')}</div>
              </button>
              
               <button 
                onClick={() => onConfirm(Cardinality.MANY_TO_ONE)}
                className="flex flex-col items-center justify-center p-4 rounded border border-slate-700 hover:border-primary hover:bg-slate-800 transition-all group"
              >
                 <div className="text-lg font-bold text-slate-300 group-hover:text-primary mb-1">N : 1</div>
                 <div className="text-xs text-slate-500">{t('many_to_one')}</div>
              </button>

              <button 
                onClick={() => onConfirm(Cardinality.MANY_TO_MANY)}
                className="flex flex-col items-center justify-center p-4 rounded border border-slate-700 hover:border-primary hover:bg-slate-800 transition-all group"
              >
                 <div className="text-lg font-bold text-slate-300 group-hover:text-primary mb-1">N : N</div>
                 <div className="text-xs text-slate-500">{t('many_to_many')}</div>
              </button>
           </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
        </div>
      </div>
    </div>
  );
};