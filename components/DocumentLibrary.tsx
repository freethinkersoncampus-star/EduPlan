
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
      return "Failed to extract PDF."; 
    }
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) { 
      console.error("DOCX extraction failed:", err);
      return "Failed to extract DOCX."; 
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
      if (extension === 'pdf') content = await extractPdfText(arrayBuffer);
      else if (extension === 'docx' || extension === 'doc') content = await extractDocxText(arrayBuffer);
      else content = new TextDecoder().decode(arrayBuffer);
      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: file.name,
        content: content.substring(0, 50000),
        type: extension?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        category: 'Teacher Upload',
        isActiveContext: true,
        isSystemDoc: false
      };
      setDocuments([newDoc, ...documents]);
      setActiveTab('personal');
    } catch (err) { alert("Error processing file."); } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const toggleContext = (id: string) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, isActiveContext: !d.isActiveContext } : d));
  };

  const deleteDoc = (id: string) => {
    if (confirm("Permanently delete this resource?")) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const groupedOfficial = useMemo(() => {
    const filtered = documents.filter(d => d.isSystemDoc && d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const groups: Record<string, KnowledgeDocument[]> = {};
    filtered.forEach(doc => {
      const cat = doc.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });
    return groups;
  }, [documents, searchQuery]);

  const personalDocs = documents.filter(d => !d.isSystemDoc && d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 md:p-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Knowledge Hub</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">CBE Contextual Intelligence</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search subjects..." 
              className="pl-11 pr-4 py-4 bg-white border-2 border-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-indigo-600 w-full sm:w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-3 font-black shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-[0.2em]">
            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
            {isUploading ? 'SCRAPING...' : 'ADD RESOURCE'}
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.doc,.txt,.md" />
          </label>
        </div>
      </div>

      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit mb-12 shadow-inner">
        <button onClick={() => setActiveTab('official')} className={`px-8 py-3.5 rounded-xl font-black text-[9px] tracking-widest transition-all uppercase flex items-center gap-3 ${activeTab === 'official' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-certificate text-amber-500"></i>
          Official Designs
        </button>
        <button onClick={() => setActiveTab('personal')} className={`px-8 py-3.5 rounded-xl font-black text-[9px] tracking-widest transition-all uppercase flex items-center gap-3 ${activeTab === 'personal' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>
          <i className="fas fa-user-graduate"></i>
          My Library ({personalDocs.length})
        </button>
      </div>

      {activeTab === 'official' ? (
        <div className="space-y-12">
          {Object.entries(groupedOfficial).map(([level, docs]) => (
            <div key={level}>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[2px] bg-slate-200 flex-1"></div>
                <h3 className="text-[12px] font-black text-indigo-900 uppercase tracking-[0.3em]">{level}</h3>
                <div className="h-[2px] bg-slate-200 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {docs.map(doc => (
                  <div key={doc.id} className={`group relative rounded-[2.5rem] p-10 border-2 transition-all duration-500 flex flex-col h-full ${doc.isActiveContext ? 'bg-white border-indigo-400 shadow-2xl shadow-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-amber-100 text-amber-600">
                        <i className="fas fa-scroll text-2xl"></i>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 uppercase tracking-tighter">{doc.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{doc.size} • {doc.date}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-3 mb-8">
                      {doc.content ? doc.content.substring(0, 150) + '...' : 'No preview available.'}
                    </p>
                    <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">KICD OFFICIAL</span>
                      <button 
                        onClick={() => toggleContext(doc.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${doc.isActiveContext ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-400'}`}
                      >
                        {doc.isActiveContext ? 'ACTIVE' : 'ACTIVATE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personalDocs.map((doc) => (
            <div key={doc.id} className={`group relative rounded-[2.5rem] p-10 border-2 transition-all duration-500 flex flex-col h-full ${doc.isActiveContext ? 'bg-white border-indigo-400 shadow-2xl shadow-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-indigo-100 text-indigo-600">
                  <i className={`fas ${doc.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'} text-2xl`}></i>
                </div>
                <button onClick={() => deleteDoc(doc.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
              <div className="mb-6">
                <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 uppercase tracking-tighter">{doc.title}</h4>
                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{doc.size} • {doc.date}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-3 mb-8">
                {doc.content ? doc.content.substring(0, 150) + '...' : 'No preview available.'}
              </p>
              <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{doc.category}</span>
                <button 
                  onClick={() => toggleContext(doc.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${doc.isActiveContext ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-400'}`}
                >
                  {doc.isActiveContext ? 'ACTIVE' : 'ACTIVATE'}
                </button>
              </div>
            </div>
          ))}
          {personalDocs.length === 0 && <div className="col-span-full py-20 text-center font-black uppercase text-slate-300 text-[10px] tracking-widest italic">No personal documents found.</div>}
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;
