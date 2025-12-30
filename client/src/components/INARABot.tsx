import { useState } from 'react';
import api from '../api/client';

export default function INARABot() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/bot/ask', { question });
      const newEntry = { question, answer: response.data.answer };
      setHistory([...history, newEntry]);
      setQuestion('');
    } catch (error: any) {
      const errorEntry = { question, answer: 'Sorry, I encountered an error. Please try again.' };
      setHistory([...history, errorEntry]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary-500 text-white rounded-full p-4 shadow-lg hover:bg-primary-600 transition-colors z-50 font-semibold"
        aria-label="Open Ask Me"
      >
        <span className="text-sm">💬 Ask Me</span>
      </button>

      {/* Bot Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold">💬 Ask Me</h3>
              <p className="text-xs text-primary-100">Ask me anything about INARA</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
            {history.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <p className="font-semibold">💬 Hi! Ask me anything!</p>
                <p className="mt-2">Ask me about policies, procedures, trainings, or how to use systems.</p>
              </div>
            )}
            {history.map((entry, idx) => (
              <div key={idx} className="space-y-2">
                <div className="bg-gray-700 rounded-lg p-3 text-sm text-gray-200">
                  <strong>You:</strong> {entry.question}
                </div>
                <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-3 text-sm text-gray-200">
                  <strong>💬 Ask Me:</strong> {entry.answer}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-center text-gray-400 text-sm">Thinking...</div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAsk} className="border-t border-gray-700 p-4 bg-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

