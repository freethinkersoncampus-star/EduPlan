
import React, { useState, useEffect } from 'react';
import { KnowledgeDocument } from '../types';

interface DocumentLibraryProps {
  documents: KnowledgeDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<KnowledgeDocument[]>>;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents, setDocuments }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: file.name,
        content: content.substring(0, 10000), // Cap for context safety
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        date: new Date().toLocaleDateString(),
        category: 'Teacher Upload',
        isActiveContext: true
      };
      
      const updated = [newDoc, ...documents];
      setDocuments(updated);
      setIsUploading(false);
    };
    
    // For now, read as text. In a production app, we'd use PDF.js or OCR for PDFs
    reader.readAsText(file);
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
          <p className="text-slate-500 text-sm">Documents marked as "Active Context" will be used by Gemini to personalize your AI outputs.</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer flex items-center gap-2 font-bold shadow-lg shadow-indigo-100">
            {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
            Upload Reference
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className={`bg-white p-5 rounded-xl border transition group ${doc.isActiveContext ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <i className={`fas ${doc.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-alt'} text-2xl`}></i>
              </div>
              <button onClick={() => deleteDoc(doc.id)} className="text-slate-300 hover:text-red-500 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
            <h4 className="font-bold text-slate-800 truncate mb-1" title={doc.title}>{doc.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{doc.size} • {doc.date}</p>
            
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                  {doc.category}
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <span className="mr-2 text-[10px] font-bold text-slate-400">AI CONTEXT</span>
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={doc.isActiveContext}
                    onChange={() => toggleContext(doc.id)}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 italic line-clamp-2">
                {doc.content ? doc.content.substring(0, 80) + '...' : 'No content extracted.'}
              </p>
            </div>
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl py-20 flex flex-col items-center justify-center text-slate-400">
            <i className="fas fa-cloud-upload-alt text-5xl mb-4 opacity-20"></i>
            <h3 className="font-bold">No Documents Uploaded</h3>
            <p className="text-sm max-w-xs text-center mt-2">Upload your school's specific curriculum notes or books to train the AI on your specific teaching style.</p>
          </div>
        )}
      </div>

      <div className="mt-10 bg-indigo-900 p-8 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-4">KICD Digital Integration</h3>
          <p className="text-indigo-200 mb-6 leading-relaxed">
            EduPlan is currently being configured to synchronize directly with the KICD Cloud Repository. 
            Once live, all approved textbooks will be available for instant AI referencing.
          </p>
          <button className="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition shadow-xl">
            Request Early Access
          </button>
        </div>
        <i className="fas fa-globe absolute right-[-40px] bottom-[-40px] text-[200px] text-indigo-800 opacity-20 rotate-12"></i>
      </div>
    </div>
  );
};

export default DocumentLibrary;
