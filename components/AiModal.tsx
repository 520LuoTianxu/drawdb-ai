
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Wand2, AlertTriangle, Terminal, ChevronRight, Check, Edit3 } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { generateSchema } from '../services/aiService';

interface AiModalProps {
  onSuccess: (sql: string) => void;
  onClose: () => void;
}

export const AiModal: React.FC<AiModalProps> = ({ onSuccess, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');
  
  // New state for Review Mode
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamContent]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setStreamContent(''); // Clear previous output
    setIsReviewing(false); // Ensure we aren't in review mode yet
    
    try {
      const finalSql = await generateSchema(prompt, (chunk) => {
        setStreamContent(prev => prev + chunk);
      });
      
      // Transition to Review Mode
      setGeneratedSql(finalSql);
      setIsGenerating(false);
      setIsReviewing(true);
      
    } catch (err) {
      setError(t('ai_error'));
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
      onSuccess(generatedSql);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animation-fade-in p-4">
      <div className="bg-surface w-full max-w-5xl rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Header with Gradient */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-indigo-900/50 to-purple-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={24} className="text-purple-400" /> 
            {isReviewing ? t('ai_review') : t('ai_title')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
           
           {/* Step 1: Input & Generation View */}
           {!isReviewing && (
             <>
                {!isGenerating && !streamContent && (
                    <>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {t('ai_desc')}
                        </p>

                        <textarea
                          className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-4 font-sans text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none transition-all"
                          placeholder={t('ai_placeholder')}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                    </>
                )}

                {/* Terminal / Streaming View */}
                {(isGenerating || streamContent) && (
                    <div className="flex flex-col gap-2 flex-1 min-h-0">
                        <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold tracking-wider">
                            <span className="flex items-center gap-2">
                                <Terminal size={14} /> AI Generation Log
                            </span>
                            {isGenerating && (
                                <span className="flex items-center gap-1 text-purple-400">
                                    <span className="animate-pulse">●</span> Processing
                                </span>
                            )}
                        </div>
                        <div 
                              ref={terminalRef}
                              className="flex-1 bg-black/80 rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto border border-slate-800 shadow-inner min-h-[300px]"
                        >
                            <div className="whitespace-pre-wrap">
                                {streamContent || <span className="text-slate-600">Initializing...</span>}
                                {isGenerating && <span className="animate-pulse inline-block w-2 h-4 bg-green-500 ml-1 align-middle"></span>}
                            </div>
                        </div>
                    </div>
                )}
             </>
           )}

           {/* Step 2: Review & Edit View */}
           {isReviewing && (
               <div className="flex flex-col gap-3 flex-1 min-h-0 h-full">
                   <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-900/20 p-3 rounded border border-blue-800/50">
                       <Edit3 size={16} />
                       {t('ai_review_desc')}
                   </div>
                   
                   <textarea
                     className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all min-h-[50vh]"
                     value={generatedSql}
                     onChange={(e) => setGeneratedSql(e.target.value)}
                     spellCheck={false}
                   />
               </div>
           )}

           {error && (
               <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50 shrink-0">
                   <AlertTriangle size={16} /> {error}
               </div>
           )}
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-3 bg-slate-900/30 shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
                {t('cancel')}
            </Button>
            
            {!isGenerating && !streamContent && !isReviewing && (
                <Button 
                    onClick={handleGenerate} 
                    disabled={!prompt.trim()}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-purple-900/20"
                >
                    <Wand2 size={16} /> {t('ai_generate')}
                </Button>
            )}

            {isGenerating && (
                <Button disabled className="gap-2 opacity-80 cursor-not-allowed">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    {t('ai_generating')}
                </Button>
            )}

            {isReviewing && (
                 <Button 
                    onClick={handleApply} 
                    className="gap-2 bg-green-600 hover:bg-green-500 border-none shadow-lg shadow-green-900/20"
                >
                    <Check size={16} /> {t('ai_apply')}
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};
