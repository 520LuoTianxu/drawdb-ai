
import React from 'react';
import { X, Plus, Trash2, Save, Palette, Copy } from 'lucide-react';
import { TableData, Column } from '../types';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

interface EditorPanelProps {
  tableId: string;
  data: TableData;
  onClose: () => void;
  onSave: (id: string, newData: TableData) => void;
  onDuplicate: (id: string, data: TableData) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ tableId, data, onClose, onSave, onDuplicate }) => {
  const [formData, setFormData] = React.useState<TableData>(JSON.parse(JSON.stringify(data)));
  const { t } = useLanguage();

  const handleColumnChange = (index: number, field: keyof Column, value: any) => {
    const newCols = [...formData.columns];
    newCols[index] = { ...newCols[index], [field]: value };
    // update id if name changes to keep handles working (optional, but good practice)
    if (field === 'name') {
        newCols[index].id = `${formData.label}-${value}`;
    }
    setFormData({ ...formData, columns: newCols });
  };

  const addColumn = () => {
    const newCol: Column = {
        id: `${formData.label}-new_col_${Date.now()}`,
        name: 'new_column',
        type: 'VARCHAR',
        isPk: false,
        isFk: false
    };
    setFormData({ ...formData, columns: [...formData.columns, newCol] });
  };

  const removeColumn = (index: number) => {
    const newCols = formData.columns.filter((_, i) => i !== index);
    setFormData({ ...formData, columns: newCols });
  };

  const handleSave = () => {
      onSave(tableId, formData);
  };

  return (
    <div className="w-96 bg-surface border-l border-border h-full flex flex-col shadow-2xl absolute right-0 top-0 z-20">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">{t('edit_table')}</h3>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDuplicate(tableId, formData)} title={t('duplicate_table')}>
                <Copy size={14} />
            </Button>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Table Props */}
        <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase">{t('table_name')}</label>
            <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
            />
            
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">{t('comment')}</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-primary focus:outline-none"
                        value={formData.comment || ''}
                        onChange={(e) => setFormData({...formData, comment: e.target.value})}
                    />
                </div>
                <div>
                     <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">{t('color')}</label>
                     <div className="relative">
                        <input 
                            type="color" 
                            className="w-full h-9 bg-slate-900 border border-slate-700 rounded p-1 cursor-pointer"
                            value={formData.headerColor || '#0f172a'}
                            onChange={(e) => setFormData({...formData, headerColor: e.target.value})}
                        />
                     </div>
                </div>
            </div>
        </div>

        {/* Columns */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase">{t('columns')} ({formData.columns.length})</label>
                <Button size="sm" variant="secondary" onClick={addColumn} className="h-6 text-xs gap-1">
                    <Plus size={12} /> {t('add')}
                </Button>
            </div>
            
            <div className="flex flex-col gap-2">
                {formData.columns.map((col, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-3 rounded border border-slate-700 space-y-2">
                        {/* Row 1: Name, Type, Color, Delete */}
                        <div className="flex gap-2 items-center">
                            <input 
                                className="flex-1 bg-transparent border-b border-slate-700 text-sm py-1 focus:border-primary focus:outline-none text-white font-mono"
                                value={col.name}
                                placeholder={t('column_name_placeholder')}
                                onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
                            />
                            <select 
                                className="bg-slate-800 text-xs rounded border border-slate-600 text-slate-300 w-24"
                                value={col.type}
                                onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
                            >
                                <option>INT</option>
                                <option>BIGINT</option>
                                <option>VARCHAR</option>
                                <option>TEXT</option>
                                <option>BOOLEAN</option>
                                <option>DATETIME</option>
                                <option>DECIMAL</option>
                                <option>JSON</option>
                            </select>
                            
                             <div className="relative group/color" title="Column Color">
                                <input 
                                    type="color" 
                                    className="w-6 h-6 p-0 border-0 rounded bg-transparent cursor-pointer"
                                    value={col.color || '#1e293b'}
                                    onChange={(e) => handleColumnChange(idx, 'color', e.target.value)}
                                />
                             </div>

                            <button onClick={() => removeColumn(idx)} className="text-slate-500 hover:text-red-400">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Row 2: Comment */}
                        <div className="flex gap-2">
                             <input 
                                className="flex-1 bg-slate-800/50 border border-slate-700 rounded text-xs py-1 px-2 text-slate-400 focus:border-primary focus:outline-none"
                                value={col.comment || ''}
                                placeholder={t('column_comment_placeholder')}
                                onChange={(e) => handleColumnChange(idx, 'comment', e.target.value)}
                             />
                        </div>

                        {/* Row 3: Flags */}
                        <div className="flex gap-4 text-xs">
                             <label className="flex items-center gap-1 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    checked={col.isPk} 
                                    onChange={(e) => handleColumnChange(idx, 'isPk', e.target.checked)}
                                    className="rounded bg-slate-800 border-slate-600"
                                 />
                                 <span className={col.isPk ? "text-yellow-500" : "text-slate-400"}>PK</span>
                             </label>
                             <label className="flex items-center gap-1 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    checked={col.isFk} 
                                    onChange={(e) => handleColumnChange(idx, 'isFk', e.target.checked)}
                                    className="rounded bg-slate-800 border-slate-600"
                                 />
                                 <span className={col.isFk ? "text-blue-400" : "text-slate-400"}>FK</span>
                             </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-surface">
         <Button className="w-full gap-2" onClick={handleSave}>
             <Save size={16} /> {t('save_changes')}
         </Button>
      </div>
    </div>
  );
};
