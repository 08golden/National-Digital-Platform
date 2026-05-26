import React from 'react';

interface ModerationTabProps {
  uploads: any[];
  onSelectFile: (fileId: string) => void;
  onDeleteFiles: () => void;
  onChangeStatus: () => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({ uploads, onSelectFile, onDeleteFiles, onChangeStatus }) => {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Moderation</h3>
          <p className="text-sm text-white/50">Review uploads awaiting approval.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onChangeStatus} className="px-4 py-2 rounded-2xl bg-amber-500 text-black font-bold">Change status</button>
          <button onClick={onDeleteFiles} className="px-4 py-2 rounded-2xl bg-white/5 text-white font-bold">Delete</button>
        </div>
      </div>

      {uploads.length === 0 ? (
        <div className="glass rounded-3xl border border-white/10 p-8 text-white/50 text-center">
          No moderation items yet.
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectFile(item.id)}
              className="w-full text-left glass rounded-3xl p-4 border border-white/10 hover:bg-white/5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{item.filename}</p>
                  <p className="text-sm text-white/50">{item.uploadedBy}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.25em] text-amber-400">{item.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
