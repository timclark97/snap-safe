import { useState, createContext, useContext, ReactNode } from "react";

import { useSelf } from "./self-context";

type UploadContextType = {
  enqueueUpload: (id: string, file: File, albumId: string) => void;
};
type UploadItem = {
  file: File;
  albumId: string;
  state: "pending" | "preparing" | "uploading" | "done" | "error";
  error?: string;
};

const UploadContext = createContext<UploadContextType>({} as UploadContextType);

export const useUpload = () => useContext(UploadContext);

export function UploadContextProvider({ children }: { children: ReactNode }) {
  const user = useSelf();
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map());

  const enqueueUpload = (id: string, file: File, albumId: string) => {
    setUploads((uploads) => {
      if (uploads.has(id)) {
        return uploads;
      }
      uploads.set(id, { file, albumId, state: "pending" });

      return new Map(uploads);
    });

    // TODO: Cache this worker code
    const worker = new Worker("/workers/upload-worker.js", { type: "module" });
    worker.postMessage({
      id,
      albumId,
      userId: user.id,
      file
    });
    worker.onmessage = (event) => {
      const data = event.data;
      console.log(data);
      //   setUploads((uploads) => {
      //     const upload = uploads.get(id);
      //     if (!upload) {
      //       return uploads;
      //     }
      //     if (data.error) {
      //       uploads.set(id, {
      //         ...upload,
      //         state: data.state,
      //         error: data.error
      //       });
      //       return new Map(uploads);
      //     }

      //     uploads.set(id, {
      //       ...upload,
      //       state: data.state
      //     });

      //     return new Map(uploads);
      //   });
    };
  };

  return (
    <UploadContext.Provider value={{ enqueueUpload }}>
      {children}
      {uploads.size > 0 && (
        <div className="fixed bottom-0 right-2 border rounded-md">
          {[...uploads.entries()].map(([id, upload]) => (
            <div key={id} className="flex">
              <div>{upload.file.name}</div>
              <div>{upload.state}</div>
            </div>
          ))}
        </div>
      )}
    </UploadContext.Provider>
  );
}
