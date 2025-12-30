import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import api from '../api/client';
export default function INARABot() {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const handleAsk = async (e) => {
        e.preventDefault();
        if (!question.trim())
            return;
        setLoading(true);
        try {
            const response = await api.post('/bot/ask', { question });
            const newEntry = { question, answer: response.data.answer };
            setHistory([...history, newEntry]);
            setQuestion('');
        }
        catch (error) {
            const errorEntry = { question, answer: 'Sorry, I encountered an error. Please try again.' };
            setHistory([...history, errorEntry]);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(!isOpen), className: "fixed bottom-6 right-6 bg-primary-500 text-white rounded-full p-4 shadow-lg hover:bg-primary-600 transition-colors z-50 font-semibold", "aria-label": "Open Ask Me", children: _jsx("span", { className: "text-sm", children: "\uD83D\uDCAC Ask Me" }) }), isOpen && (_jsxs("div", { className: "fixed bottom-24 right-6 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 flex flex-col max-h-[600px]", children: [_jsxs("div", { className: "bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold", children: "\uD83D\uDCAC Ask Me" }), _jsx("p", { className: "text-xs text-primary-100", children: "Ask me anything about INARA" })] }), _jsx("button", { onClick: () => setIsOpen(false), className: "text-white hover:text-gray-200", children: "\u2715" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900", children: [history.length === 0 && (_jsxs("div", { className: "text-center text-gray-400 text-sm py-8", children: [_jsx("p", { className: "font-semibold", children: "\uD83D\uDCAC Hi! Ask me anything!" }), _jsx("p", { className: "mt-2", children: "Ask me about policies, procedures, trainings, or how to use systems." })] })), history.map((entry, idx) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "bg-gray-700 rounded-lg p-3 text-sm text-gray-200", children: [_jsx("strong", { children: "You:" }), " ", entry.question] }), _jsxs("div", { className: "bg-primary-900/30 border border-primary-700 rounded-lg p-3 text-sm text-gray-200", children: [_jsx("strong", { children: "\uD83D\uDCAC Ask Me:" }), " ", entry.answer] })] }, idx))), loading && (_jsx("div", { className: "text-center text-gray-400 text-sm", children: "Thinking..." }))] }), _jsx("form", { onSubmit: handleAsk, className: "border-t border-gray-700 p-4 bg-gray-800", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: question, onChange: (e) => setQuestion(e.target.value), placeholder: "Ask a question...", className: "flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400", disabled: loading }), _jsx("button", { type: "submit", disabled: loading || !question.trim(), className: "bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed", children: "Send" })] }) })] }))] }));
}
