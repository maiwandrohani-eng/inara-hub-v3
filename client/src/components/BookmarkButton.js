import { jsx as _jsx } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
export default function BookmarkButton({ resourceType, resourceId }) {
    const queryClient = useQueryClient();
    const { data } = useQuery(['bookmark', resourceType, resourceId], async () => {
        try {
            const res = await api.get(`/bookmarks?resourceType=${resourceType}&resourceId=${resourceId}`);
            return res.data;
        }
        catch {
            return { bookmarks: [] };
        }
    });
    const isBookmarked = (data?.bookmarks || []).length > 0;
    const bookmark = (data?.bookmarks || [])[0];
    const createMutation = useMutation(async () => {
        const res = await api.post('/bookmarks', { resourceType, resourceId });
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark', resourceType, resourceId] });
        },
    });
    const deleteMutation = useMutation(async (id) => {
        const res = await api.delete(`/bookmarks/${id}`);
        return res.data;
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmark', resourceType, resourceId] });
        },
    });
    const handleToggle = () => {
        if (isBookmarked && bookmark) {
            deleteMutation.mutate(bookmark.id);
        }
        else {
            createMutation.mutate();
        }
    };
    return (_jsx("button", { onClick: handleToggle, className: `p-2 rounded transition-colors ${isBookmarked
            ? 'text-yellow-400 hover:text-yellow-300'
            : 'text-gray-400 hover:text-white'}`, title: isBookmarked ? 'Remove bookmark' : 'Add bookmark', children: _jsx("svg", { className: "w-5 h-5", fill: isBookmarked ? 'currentColor' : 'none', stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) }) }));
}
