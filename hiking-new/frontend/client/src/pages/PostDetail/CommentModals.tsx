import React from 'react';
import type { HikingComment } from '@client/src/data/hiking-types';
import { Image } from '@client/src/components/ui/image';

interface CommentModalsProps {
  deleteTarget: HikingComment | null;
  deleteSaving: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  viewImage: string | null;
  onCloseImage: () => void;
}

const CommentModals: React.FC<CommentModalsProps> = ({
  deleteTarget,
  deleteSaving,
  onCancelDelete,
  onConfirmDelete,
  viewImage,
  onCloseImage,
}) => {
  return (
    <>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancelDelete}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-charcoal mb-2">确认删除</h3>
            <p className="text-sm text-slate-500 mb-4">确定要删除这条评论吗？此操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancelDelete}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={onConfirmDelete} disabled={deleteSaving}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                {deleteSaving ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer" onClick={onCloseImage}>
          <Image src={viewImage} className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain"
            onClick={(e: React.MouseEvent<HTMLImageElement>) => e.stopPropagation()} alt="" />
          <button onClick={onCloseImage}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center text-lg md:text-xl transition-all">&times;</button>
        </div>
      )}
    </>
  );
};

export default CommentModals;
