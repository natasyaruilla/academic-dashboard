import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, FileText, HelpCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth'; 
import { manualBooks, faqs, contactPerson } from '../../utils/helpData';
import Sidebar from './Sidebar';
import Footer from './Footer';

const HelpCenter = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  
  // Filter Role
  const { isAdmin } = useAuth();
  const currentRole = isAdmin ? 'admin' : 'student';
  const filteredBooks = manualBooks.filter(book => book.role === currentRole);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Pusat Bantuan</h1>
              <p className="text-gray-600 mt-2">
                Halaman bantuan dan panduan untuk <span className="font-semibold capitalize">{currentRole}</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Buku Panduan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700">Buku Panduan</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 w-16 text-center">No</th>
                        <th className="px-6 py-3">Dokumen</th>
                        <th className="px-6 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.length > 0 ? (
                        filteredBooks.map((book, index) => (
                          <tr key={book.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-center text-gray-500">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                            <td className="px-6 py-4 text-right">
                              <a 
                                href={book.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download Panduan"
                              >
                                <Download size={18} />
                              </a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500 italic">
                            Tidak ada buku panduan untuk role ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                  <HelpCircle size={20} className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700">Pertanyaan yang sering diajukan</h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {faqs.map((faq, index) => (
                    <div key={faq.id} className="group">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="flex items-center justify-between w-full p-5 text-left transition-all hover:bg-gray-50 focus:outline-none"
                      >
                        <span className={`text-sm font-medium ${openFaqIndex === index ? 'text-blue-600' : 'text-gray-700'}`}>
                          {faq.question}
                        </span>
                        {openFaqIndex === index ? (
                          <ChevronUp size={18} className="text-blue-600" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600" />
                        )}
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-5 pb-5 text-sm text-gray-600 animate-fadeIn">
                          <div className="pl-4 border-l-2 border-blue-100">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kontak */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <MessageCircle size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Pertanyaan masih belum terjawab?</h3>
                <p className="text-gray-500 max-w-md">
                  {contactPerson.description} : <span className="font-bold text-gray-700">{contactPerson.name}</span>
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default HelpCenter;