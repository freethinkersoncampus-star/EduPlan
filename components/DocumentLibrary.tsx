
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

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // Load PDF.js worker from CDN
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
        // Fallback for TXT, MD, JSON, ODT (as raw text for now)
        const decoder = new TextDecoder();
        content = decoder.decode(arrayBuffer);
      }

      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: file.name,
        content: content.substring(0, 30000), // Larger cap for context
        type: extension?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        category: 'Teacher Upload',
        isActiveContext: true
      };

      setDocuments(docs => [newDoc, ...docs]);
    } catch (err) {
      alert("Error processing file. Please ensure it is a valid document.");
    } finally {
      setIsUploading(false);
      // Clear input
      e.target.value = '';
    }
  };

  const toggleContext = (id: string) => {
    setDocuments(docs => docs.map(d => d.id === id ? { ...d, isActiveContext: !d.isActiveContext } : d));
  };

  const deleteDoc = (id: string) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Resources & Knowledge Base</h2>
          <p className="text-slate-500 text-sm">Upload PDF, DOCX, or Text files to train the AI on your school's specific books.</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition cursor-pointer flex items-center gap-2 font-black shadow-xl shadow-indigo-100">
            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
            {isUploading ? 'PROCESSING...' : 'UPLOAD DOCUMENTS'}
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.doc,.txt,.md" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className={`bg-white p-5 rounded-2xl border transition group ${doc.isActiveContext ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                doc.type === 'PDF' ? 'bg-red-50 text-red-500' : 
                doc.type === 'DOCX' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
              }`}>
                <i className={`fas ${doc.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'} text-2xl`}></i>
              </div>
              <button onClick={() => deleteDoc(doc.id)} className="text-slate-300 hover:text-red-500 transition p-2">
                <i className="fas fa-trash"></i>
              </button>
            </div>
            <h4 className="font-bold text-slate-800 truncate mb-1" title={doc.title}>{doc.title}</h4>
            <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-tighter">{doc.size} • {doc.date}</p>
            
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                  {doc.type} SOURCE
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <span className="mr-2 text-[9px] font-black text-slate-400">ACTIVE CONTEXT</span>
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={doc.isActiveContext}
                    onChange={() => toggleContext(doc.id)}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 italic line-clamp-3 leading-relaxed">
                {doc.content ? doc.content.substring(0, 150) + '...' : 'No content extracted.'}
              </p>
            </div>
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl py-24 flex flex-col items-center justify-center text-slate-400">
            <i className="fas fa-cloud-upload-alt text-6xl mb-4 opacity-20"></i>
            <h3 className="font-black uppercase tracking-widest">Knowledge Base Empty</h3>
            <p className="text-sm max-w-xs text-center mt-2 font-medium">Upload PDF books, DOCX notes, or curriculum guides to power your AI generation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;
