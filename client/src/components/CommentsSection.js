import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
export default function CommentsSection({ resourceType, resourceId }) {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { data, isLoading } = useQuery(['comments', resourceType, resourceId], async () => {
        const res = await api.get(`/comments/${resourceType}/${resourceId}`);
        return res.data;
    });
    const createMutation = useMutation(async (data) => {
        const res = await api.post('/comments', {
            resourceType,
            resourceId,
            ...data,
        });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', resourceType, resourceId] });
            setNewComment('');
            setReplyingTo(null);
            setReplyText('');
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/comments/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', resourceType, resourceId] });
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            createMutation.mutate({ content: newComment.trim() });
        }
    };
    const handleReply = (parentId) => {
        if (replyText.trim()) {
            createMutation.mutate({ content: replyText.trim(), parentId });
        }
    };
    const comments = data?.comments || [];
    return (_jsxs("div", { className: "bg-gray-800 rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "Comments & Discussion" }), user && (_jsxs("form", { onSubmit: handleSubmit, className: "mb-6", children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", rows: 3, className: "w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" }), _jsx("div", { className: "flex justify-end mt-2", children: _jsx("button", { type: "submit", disabled: !newComment.trim() || createMutation.isLoading, className: "px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50", children: "Post Comment" }) })] })), isLoading ? (_jsx("div", { className: "text-center py-8 text-gray-400", children: "Loading comments..." })) : comments.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-400", children: "No comments yet. Be the first to comment!" })) : (_jsx("div", { className: "space-y-4", children: comments.map((comment) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold", children: [comment.user.firstName[0], comment.user.lastName[0]] }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-white", children: [comment.user.firstName, " ", comment.user.lastName] }), _jsxs("p", { className: "text-xs text-gray-400", children: [new Date(comment.createdAt).toLocaleString(), comment.isEdited && ' (edited)'] })] })] }), user?.id === comment.userId && (_jsx("div", { className: "flex space-x-2", children: _jsx("button", { onClick: () => {
                                            if (confirm('Delete this comment?')) {
                                                deleteMutation.mutate(comment.id);
                                            }
                                        }, className: "text-gray-400 hover:text-red-400 text-sm", children: "Delete" }) }))] }), _jsx("p", { className: "text-gray-200 mb-3", children: comment.content }), _jsx("div", { className: "flex items-center space-x-4", children: user && (_jsx("button", { onClick: () => setReplyingTo(replyingTo === comment.id ? null : comment.id), className: "text-sm text-primary-500 hover:text-primary-400", children: replyingTo === comment.id ? 'Cancel' : 'Reply' })) }), replyingTo === comment.id && user && (_jsxs("div", { className: "mt-3 ml-8", children: [_jsx("textarea", { value: replyText, onChange: (e) => setReplyText(e.target.value), placeholder: "Write a reply...", rows: 2, className: "w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400" }), _jsx("div", { className: "flex justify-end mt-2", children: _jsx("button", { onClick: () => handleReply(comment.id), disabled: !replyText.trim(), className: "px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm", children: "Reply" }) })] })), comment.replies && comment.replies.length > 0 && (_jsx("div", { className: "mt-3 ml-8 space-y-3", children: comment.replies.map((reply) => (_jsxs("div", { className: "bg-gray-600 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "w-6 h-6 bg-primary-400 rounded-full flex items-center justify-center text-white text-xs font-semibold", children: [reply.user.firstName[0], reply.user.lastName[0]] }), _jsxs("div", { children: [_jsxs("p", { className: "text-xs font-medium text-white", children: [reply.user.firstName, " ", reply.user.lastName] }), _jsx("p", { className: "text-xs text-gray-400", children: new Date(reply.createdAt).toLocaleString() })] })] }), user?.id === reply.userId && (_jsx("button", { onClick: () => {
                                                    if (confirm('Delete this reply?')) {
                                                        deleteMutation.mutate(reply.id);
                                                    }
                                                }, className: "text-gray-400 hover:text-red-400 text-xs", children: "Delete" }))] }), _jsx("p", { className: "text-sm text-gray-200", children: reply.content })] }, reply.id))) }))] }, comment.id))) }))] }));
}
