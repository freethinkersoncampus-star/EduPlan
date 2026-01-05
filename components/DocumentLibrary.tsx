
import React from 'react';

const DocumentLibrary: React.FC = () => {
  const documents = [
    { title: 'Grade 4 Math KICD Approved.pdf', type: 'PDF', size: '4.2 MB', date: '2023-12-10', category: 'KICD Book' },
    { title: 'Grade 5 English Guide.pdf', type: 'PDF', size: '3.1 MB', date: '2023-11-15', category: 'KICD Book' },
    { title: 'Term 1 Exam Prep.docx', type: 'DOCX', size: '1.2 MB', date: '2024-01-05', category: 'Personal' },
    { title: 'CBC Guidelines 2024.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-01', category: 'Policy' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Resources & KICD Books</h2>
        <div className="flex gap-3">
          <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition">
            <i className="fas fa-filter mr-2"></i> Filter
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            <i className="fas fa-upload mr-2"></i> Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <i className={`fas ${doc.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'} text-2xl`}></i>
              </div>
              <button className="text-slate-300 hover:text-slate-500 group-hover:block transition">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
            <h4 className="font-bold text-slate-800 truncate mb-1" title={doc.title}>{doc.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{doc.size} • {doc.date}</p>
            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {doc.category}
              </span>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition">
                  <i className="fas fa-eye"></i>
                </button>
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition">
                  <i className="fas fa-download"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer">
          <i className="fas fa-plus-circle text-2xl mb-2"></i>
          <span className="text-sm font-medium">Add New Resource</span>
        </div>
      </div>

      <div className="mt-10 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-6">
        <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg flex-none">
          <i className="fas fa-globe"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900">Access KICD Digital Library</h3>
          <p className="text-indigo-700 text-sm">Official Kenya Institute of Curriculum Development repository is synchronized with your profile. Access thousands of vetted CBC materials instantly.</p>
        </div>
        <button className="bg-indigo-900 text-white px-6 py-2 rounded-xl font-bold ml-auto hover:bg-indigo-800 transition">
          Browse Library
        </button>
      </div>
    </div>
  );
};

export default DocumentLibrary;
