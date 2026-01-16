
import React, { useState, useMemo } from 'react';
import { KnowledgeDocument } from '../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DocumentLibrary: React.FC<{
  documents: KnowledgeDocument[];
  setDocuments: (docs: KnowledgeDocument[]) => void;
}> = ({ documents, setDocuments }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'official' | 'personal'>('official');
  const [searchQuery, setSearchQuery] = useState('');

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const PDFJS = await import('pdfjs-dist');
      PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
      const loadingTask = PDFJS.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return fullText;
    } catch (err) { 
      console.error("PDF extraction failed:", err);
      return "Extraction limited for this PDF file."; 
    }
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) { 
      console.error("DOCX extraction failed:", err);
      return "Extraction limited for this DOCX file."; 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert(`FILE TOO LARGE: The limit is 50MB.`);
      return;
    }
    setIsUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase();
    let content = '';
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (extension === 'pdf') {
        content = await extractPdfText(arrayBuffer);
      } else if (extension === 'docx' || extension === 'doc') {
        content = await extractDocxText(arrayBuffer);
      } else if (['txt', 'md', 'csv', 'json'].includes(extension || '')) {
        content = new TextDecoder().decode(arrayBuffer);
      } else {
        // Handle all other formats as generic entries
        content = `Binary or non-text file format (${extension?.toUpperCase()}). Content indexing is limited for this file type.`;
      }

      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: file.name,
        content: content.substring(0, 100000), // Larger buffer for detailed context
        type: extension?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        category: 'Personal Repository',
        isActiveContext: true,
        isSystemDoc: false
      };
      
      setDocuments([newDoc, ...documents]);
      setActiveTab('personal');
    } catch (err) { 
      alert("Error processing file. It has been added to the library without indexing."); 
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const toggleContext = (id: string) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, isActiveContext: !d.isActiveContext } : d));
  };

  const deleteDoc = (id: string) => {
    if (confirm("Permanently delete this resource from your vault?")) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  // Explicitly type return value of useMemo to fix 'unknown' type error in entries map
  const groupedOfficial = useMemo<Record<string, KnowledgeDocument[]>>(() => {
    const filtered = documents.filter(d => d.isSystemDoc && 
      (d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       d.category?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const groups: Record<string, KnowledgeDocument[]> = {};
    
    // Strict ordering of school levels
    const levels = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior School', 'Senior School'];
    levels.forEach(l => groups[l] = []);
    
    filtered.forEach(doc => {
      const cat = doc.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });
    
    return groups;
  }, [documents, searchQuery]);

  const personalDocs = documents.filter(d => !d.isSystemDoc && d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 md:p-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">CBE Digital Vault</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">KICD Rationalized Curriculum Repository</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search design or subject..." 
              className="pl-11 pr-4 py-4 bg-white border-2 border-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-600 w-full sm:w-64 shadow-inner"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-3 font-black shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-[0.2em]">
            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
            {isUploading ? 'INDEXING...' : 'UPLOAD TO VAULT'}
            <input type="file" className="hidden" onChange={handleFileUpload} accept="*" />
          </label>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit mb-12 shadow-inner">
        <button onClick={() => setActiveTab('official')} className={`px-8 py-3.5 rounded-xl font-black text-[9px] tracking-widest transition-all uppercase flex items-center gap-3 ${activeTab === 'official' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-shield-halved text-amber-500"></i>
          Official KICD Designs
        </button>
        <button onClick={() => setActiveTab('personal')} className={`px-8 py-3.5 rounded-xl font-black text-[9px] tracking-widest transition-all uppercase flex items-center gap-3 ${activeTab === 'personal' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-folder-tree"></i>
          Personal Repository ({personalDocs.length})
        </button>
      </div>

      {activeTab === 'official' ? (
        <div className="space-y-16 animate-in fade-in duration-500">
          {Object.entries(groupedOfficial).map(([level, docs]) => (
            <div key={level}>
              <div className="flex items-center gap-6 mb-10">
                <h3 className="text-[14px] font-black text-indigo-950 uppercase tracking-[0.4em] whitespace-nowrap">{level}</h3>
                <div className="h-[2px] bg-indigo-100 flex-1 rounded-full"></div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{docs.length} Designs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {docs.map(doc => (
                  <div key={doc.id} className={`group relative rounded-[2rem] p-8 border-2 transition-all duration-300 flex flex-col h-full ${doc.isActiveContext ? 'bg-white border-indigo-200 shadow-xl' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${doc.isActiveContext ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <i className={`fas ${doc.title.includes('Math') ? 'fa-calculator' : doc.title.includes('Science') ? 'fa-microscope' : 'fa-scroll'} text-lg`}></i>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">KICD 2025</span>
                        <div className={`w-2 h-2 rounded-full mt-2 ${doc.isActiveContext ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-black text-slate-800 text-xs leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 uppercase tracking-tight">{doc.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{doc.size} • Rationalized</p>
                    </div>
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <button 
                        onClick={() => toggleContext(doc.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all ${doc.isActiveContext ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-400'}`}
                      >
                        {doc.isActiveContext ? 'SYNCED TO AI' : 'ADD TO CONTEXT'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedOfficial).length === 0 && (
             <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No matching curriculum designs found.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {personalDocs.map((doc) => (
            <div key={doc.id} className={`group relative rounded-[2rem] p-8 border-2 transition-all duration-300 flex flex-col h-full ${doc.isActiveContext ? 'bg-white border-emerald-200 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${doc.isActiveContext ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <i className={`fas ${
                    doc.type === 'PDF' ? 'fa-file-pdf' : 
                    doc.type === 'DOCX' || doc.type === 'DOC' ? 'fa-file-word' : 
                    doc.type === 'XLSX' || doc.type === 'CSV' ? 'fa-file-excel' :
                    doc.type === 'PPTX' ? 'fa-file-powerpoint' : 'fa-file'
                  } text-lg`}></i>
                </div>
                <button onClick={() => deleteDoc(doc.id)} className="text-slate-200 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
              <div className="mb-4">
                <h4 className="font-black text-slate-800 text-xs leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 uppercase tracking-tight">{doc.title}</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{doc.size} • {doc.date}</p>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2 mb-6 opacity-60">
                {doc.content ? doc.content.substring(0, 100) + '...' : 'Binary file entry.'}
              </p>
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => toggleContext(doc.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all ${doc.isActiveContext ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-400'}`}
                >
                  {doc.isActiveContext ? 'ACTIVE IN PLANNER' : 'USE AS CONTEXT'}
                </button>
              </div>
            </div>
          ))}
          {personalDocs.length === 0 && <div className="col-span-full py-20 text-center font-black uppercase text-slate-300 text-[10px] tracking-widest italic">Your personal repository is empty.</div>}
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
