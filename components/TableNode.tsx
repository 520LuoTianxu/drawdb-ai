
import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow';
import { Key, Table2, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { TableData, Column } from '../types';
import { useLanguage } from '../context/LanguageContext';

// Helper to determine badge color based on type
const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('int')) return 'bg-blue-900/50 text-blue-200 border-blue-700/50';
  if (t.includes('char') || t.includes('text')) return 'bg-green-900/50 text-green-200 border-green-700/50';
  if (t.includes('date') || t.includes('time')) return 'bg-yellow-900/50 text-yellow-200 border-yellow-700/50';
  if (t.includes('bool')) return 'bg-purple-900/50 text-purple-200 border-purple-700/50';
  return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
};

interface ColumnRowProps {
  column: Column;
  tableId: string;
}

const ColumnRow: React.FC<ColumnRowProps> = memo(({ column, tableId }) => {
  return (
    <div 
      className="group relative flex items-center justify-between px-3 py-2 border-b border-border last:border-0 hover:bg-slate-700/30 transition-colors"
      style={{ backgroundColor: column.color || 'transparent' }}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${column.id}-target`}
        className="!w-3 !h-3 !-left-1.5 !bg-slate-400 !border-2 !border-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:!bg-primary hover:!w-4 hover:!h-4"
      />
      
      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2 min-w-0">
        {/* Keys Icons */}
        <div className="w-5 flex-shrink-0 flex justify-center">
          {column.isPk && <Key size={12} className="text-yellow-500 fill-yellow-500/20" />}
          {!column.isPk && column.isFk && <Key size={12} className="text-blue-400 rotate-90" />}
        </div>

        {/* Name and Comment */}
        <div className="flex items-baseline gap-1.5 overflow-hidden min-w-0">
             <span className={`text-xs font-semibold whitespace-nowrap ${column.isPk ? 'text-white' : 'text-slate-300'}`}>
               {column.name}
             </span>
             {column.comment && (
               <span className="text-[10px] text-slate-500 italic truncate min-w-0 max-w-[80px]" title={column.comment}>
                 {column.comment}
               </span>
             )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
         {/* Type Badge */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getTypeColor(column.type)}`}>
          {column.type}
        </span>
      </div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-source`}
        className="!w-3 !h-3 !-right-1.5 !bg-slate-400 !border-2 !border-slate-800 opacity-0 group-hover:opacity-100 transition-all hover:!bg-primary hover:!w-4 hover:!h-4"
      />
    </div>
  );
});

const TableNode = ({ data, id, selected }: NodeProps<TableData>) => {
  const [expanded, setExpanded] = React.useState(data.isExpanded ?? true);
  const { t } = useLanguage();

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const opacityClass = data.dimmed ? 'opacity-20 grayscale' : 'opacity-100';

  return (
    <>
      <NodeResizeControl 
        minWidth={240}
        position="right"
        style={{ 
          background: 'transparent', 
          border: 'none',
          display: selected ? 'block' : 'none'
        }}
      >
        <div className="absolute right-[-6px] top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group">
             <div className="w-1.5 h-8 bg-slate-600/50 group-hover:bg-primary rounded-full transition-colors" />
        </div>
      </NodeResizeControl>

      <div
        className={`h-auto w-full min-w-[240px] bg-surface rounded-lg shadow-xl transition-all duration-300 flex flex-col ${
          selected ? 'ring-2 ring-primary border-primary' : 'border border-border hover:border-slate-500 hover:shadow-2xl'
        } ${opacityClass}`}
      >
        {/* Header */}
        <div 
          className="p-2 rounded-t-lg border-b border-border flex items-center justify-between"
          style={{ backgroundColor: data.headerColor || 'rgba(15, 23, 42, 0.5)' }}
          onDoubleClick={toggleExpand}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className={`p-1.5 rounded flex-shrink-0 ${selected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-400'}`}>
              <Table2 size={16} />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-bold text-slate-100 truncate leading-tight">{data.label}</span>
              {data.comment && (
                <span className="text-[10px] text-slate-400 italic truncate" title={data.comment}>
                  {data.comment}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleExpand}
            className="p-1 hover:bg-white/10 rounded text-slate-400 transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Columns */}
        {expanded && (
          <div className="bg-surface rounded-b-lg">
            {data.columns.map((col) => (
              <ColumnRow key={col.id} column={col} tableId={id} />
            ))}
            {data.columns.length === 0 && (
              <div className="p-4 text-xs text-slate-500 text-center italic border-t border-dashed border-border">
                {t('no_columns')} <br/> {t('double_click_edit')}
              </div>
            )}
            <div className="h-2"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(TableNode);
