
import React, { useState } from 'react';
import { KnowledgeDocument } from '../types';

// Declare external libraries for TypeScript
declare const pdfjsLib: any;
declare const mammoth: any;

const DocumentLibrary: React.FC<{
  documents: KnowledgeDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<KnowledgeDocument[]>>;
}> = ({ documents, setDocuments }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'official' | 'personal'>('official');
  const [searchQuery, setSearchQuery] = useState('');

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const PDFJS = await import('https://esm.sh/pdfjs-dist@4.10.38/build/pdf.mjs');
      PDFJS.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
      
      const loadingTask = PDFJS.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (err) {
      console.error("PDF Extraction Error:", err);
      return "Failed to extract PDF text.";
    }
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const mammoth = await import('https://esm.sh/mammoth@1.8.0');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      console.error("DOCX Extraction Error:", err);
      return "Failed to extract DOCX text.";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase();
    let content = '';

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (extension === 'pdf') {
        content = await extractPdfText(arrayBuffer);
      } else if (extension === 'docx' || extension === 'doc') {
        content = await extractDocxText(arrayBuffer);
      } else {
        const decoder = new TextDecoder();
        content = decoder.decode(arrayBuffer);
      }

      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: file.name,
        content: content.substring(0, 30000),
        type: extension?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        category: 'Teacher Upload',
        isActiveContext: true,
        isSystemDoc: false
      };

      setDocuments(docs => [newDoc, ...docs]);
      setActiveTab('personal');
    } catch (err) {
      alert("Error processing file. Please ensure it is a valid document.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const toggleContext = (id: string) => {
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, isActiveContext: !d.isActiveContext } : d));
  };

  const deleteDoc = (id: string) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
  };

  const filterDocs = (docs: KnowledgeDocument[]) => {
    return docs.filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const officialDocs = filterDocs(documents.filter(d => d.isSystemDoc));
  const personalDocs = filterDocs(documents.filter(d => !d.isSystemDoc));

  return (
    <div className="p-6 md:p-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Knowledge Ecosystem</h2>
          <p className="text-slate-500 text-sm mt-1">Ground your AI assistant in official curriculum designs and your personal library.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Search designs..." 
              className="pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all w-full sm:w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition cursor-pointer flex items-center justify-center gap-3 font-black shadow-xl shadow-indigo-100 text-[10px] uppercase tracking-widest">
            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
            {isUploading ? 'SCRAPING...' : 'ADD RESOURCE'}
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.doc,.txt,.md" />
          </label>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-10 shadow-inner">
        <button 
          onClick={() => setActiveTab('official')} 
          className={`px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase flex items-center gap-2 ${activeTab === 'official' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}
        >
          <i className="fas fa-award text-amber-500"></i>
          National Repository ({officialDocs.length})
        </button>
        <button 
          onClick={() => setActiveTab('personal')} 
          className={`px-8 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase flex items-center gap-2 ${activeTab === 'personal' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}
        >
          <i className="fas fa-user"></i>
          Teacher's Library ({personalDocs.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(activeTab === 'official' ? officialDocs : personalDocs).map((doc) => (
          <div 
            key={doc.id} 
            className={`relative group rounded-[2.5rem] p-8 border-2 transition-all duration-500 flex flex-col h-full overflow-hidden ${
              doc.isActiveContext 
                ? 'bg-white border-indigo-400 shadow-2xl shadow-indigo-100' 
                : 'bg-slate-50 border-slate-100 hover:border-slate-300'
            } ${doc.isSystemDoc ? 'ring-1 ring-amber-200/50' : ''}`}
          >
            {/* Background Decoration for Official Docs */}
            {doc.isSystemDoc && (
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <i className="fas fa-scroll text-8xl text-amber-600"></i>
              </div>
            )}

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                doc.isSystemDoc ? 'bg-amber-100 text-amber-600 shadow-amber-100' :
                doc.type === 'PDF' ? 'bg-red-50 text-red-500 shadow-red-50' : 
                'bg-indigo-50 text-indigo-500 shadow-indigo-50'
              }`}>
                <i className={`fas ${doc.isSystemDoc ? 'fa-scroll' : (doc.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-word')} text-2xl`}></i>
              </div>
              <div className="flex gap-2">
                {doc.officialSourceUrl && (
                  <a href={doc.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-amber-500 transition-colors" title="Verify Official Source">
                    <i className="fas fa-shield-check"></i>
                  </a>
                )}
                {!doc.isSystemDoc && (
                  <button onClick={() => deleteDoc(doc.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 relative z-10">
              {doc.isSystemDoc && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-amber-500 text-white px-3 py-1 rounded-full shadow-sm">
                    <i className="fas fa-certificate mr-1 text-[7px]"></i> KICD OFFICIAL
                  </span>
                </div>
              )}
              <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{doc.title}</h4>
              <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{doc.size} • {doc.date}</p>
            </div>

            <div className="flex-1 space-y-4 relative z-10">
              <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-4">
                {doc.content ? doc.content.substring(0, 180) + '...' : 'No content available.'}
              </p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{doc.category}</span>
              <button 
                onClick={() => toggleContext(doc.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  doc.isActiveContext 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600'
                }`}
              >
                {doc.isActiveContext ? (
                  <><i className="fas fa-check-circle"></i> ACTIVE IN AI</>
                ) : (
                  <><i className="fas fa-plus-circle"></i> ADD TO CONTEXT</>
                )}
              </button>
            </div>
          </div>
        ))}
        
        {((activeTab === 'official' && officialDocs.length === 0) || (activeTab === 'personal' && personalDocs.length === 0)) && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem]">
            <i className="fas fa-folder-open text-7xl mb-6 opacity-10"></i>
            <h3 className="font-black uppercase tracking-[0.3em] text-xs">Repository is Empty</h3>
            <p className="text-xs max-w-xs text-center mt-3 font-bold uppercase text-slate-400">Add documents to build your pedagogical intelligence.</p>
          </div>
        )}
      </div>

      <div className="mt-16 bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-xl font-black">
                  <i className="fas fa-shield-alt"></i>
               </div>
               <h4 className="text-2xl font-black tracking-tighter uppercase">Authenticity Verification</h4>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
               Every document in the <strong>National Repository</strong> is cross-referenced with the official KICD Rationalized Curriculum portal. 
               The golden seal indicates a tamper-proof digital fingerprint of the original KICD document, ensuring your AI generations are 100% compliant with Ministry of Education standards.
            </p>
         </div>
         <div className="flex gap-4">
            <a href="https://kicd.ac.ke/rationalized-curriculum-designs/" target="_blank" className="bg-white/10 hover:bg-white/20 px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition flex items-center gap-3 border border-white/10">
               <i className="fas fa-external-link-alt"></i> KICD RATIONALIZED DESIGNS
            </a>
         </div>
      </div>
    </div>
  );
};

export default DocumentLibrary;
