import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

interface CommentsSectionProps {
  resourceType: 'training' | 'policy' | 'library' | 'template' | 'news' | 'suggestion';
  resourceId: string;
}

export default function CommentsSection({ resourceType, resourceId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery(
    ['comments', resourceType, resourceId],
    async () => {
      const res = await api.get(`/comments/${resourceType}/${resourceId}`);
      return res.data;
    }
  );

  const createMutation = useMutation(
    async (data: { content: string; parentId?: string }) => {
      const res = await api.post('/comments', {
        resourceType,
        resourceId,
        ...data,
      });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', resourceType, resourceId] });
        setNewComment('');
        setReplyingTo(null);
        setReplyText('');
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await api.delete(`/comments/${id}`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['comments', resourceType, resourceId] });
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createMutation.mutate({ content: newComment.trim() });
    }
  };

  const handleReply = (parentId: string) => {
    if (replyText.trim()) {
      createMutation.mutate({ content: replyText.trim(), parentId });
    }
  };

  const comments = data?.comments || [];

  return (
    <div className="bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-white mb-4">Comments & Discussion</h3>

      {/* Add Comment */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || createMutation.isLoading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {comment.user.firstName[0]}{comment.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {comment.user.firstName} {comment.user.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.isEdited && ' (edited)'}
                    </p>
                  </div>
                </div>
                {user?.id === comment.userId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (confirm('Delete this comment?')) {
                          deleteMutation.mutate(comment.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-200 mb-3">{comment.content}</p>
              <div className="flex items-center space-x-4">
                {user && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-sm text-primary-500 hover:text-primary-400"
                  >
                    {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && user && (
                <div className="mt-3 ml-8">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-8 space-y-3">
                  {comment.replies.map((reply: any) => (
                    <div key={reply.id} className="bg-gray-600 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {reply.user.firstName[0]}{reply.user.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">
                              {reply.user.firstName} {reply.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(reply.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {user?.id === reply.userId && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this reply?')) {
                                deleteMutation.mutate(reply.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-400 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-200">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

