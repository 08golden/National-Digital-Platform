import React from 'react';

interface UploadsTabProps {
  uploads: any[];
  onDeleteFiles: () => void;
  onChangeStatus: () => void;
  onSelectFile: () => void;
}

export const UploadsTab: React.FC<UploadsTabProps> = ({ uploads, onDeleteFiles, onChangeStatus, onSelectFile }) => {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Uploads</h3>
          <p className="text-sm text-white/50">Manage file submissions and review progress.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onChangeStatus} className="px-4 py-2 rounded-2xl bg-amber-500 text-black font-bold">Change status</button>
          <button onClick={onDeleteFiles} className="px-4 py-2 rounded-2xl bg-white/5 text-white font-bold">Delete</button>
        </div>
      </div>

      {uploads.length === 0 ? (
        <div className="glass rounded-3xl border border-white/10 p-8 text-white/50 text-center">
          No uploads yet.
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => (
            <button
              key={item.id}
              onClick={onSelectFile}
              className="w-full text-left glass rounded-3xl p-4 border border-white/10 hover:bg-white/5"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{item.filename}</p>
                  <p className="text-sm text-white/50">Uploaded by {item.uploadedBy}</p>
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
