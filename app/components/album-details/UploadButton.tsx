import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

import { generateId } from "@/lib/helpers/id-generator";
import { useUpload } from "@/lib/contexts/upload-context";

export default function UploadButton({
  albumId,
  onSuccess
}: {
  albumId: string;
  onSuccess: () => void;
}) {
  const { enqueueUpload } = useUpload();
  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const id = generateId();
      enqueueUpload({
        id,
        file,
        albumId: albumId,
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          }
        }
      });
    }
  };
  return (
    <div>
      <label
        htmlFor="files"
        className="rounded-full flex justify-center items-center hover:bg-gray-200 transition-colors p-2.5 cursor-pointer"
      >
        <ArrowUpTrayIcon className="h-5 w-5 stroke-2" />
      </label>

      <input
        type="file"
        id="files"
        className="sr-only"
        multiple
        accept="image/jpeg,image/png,image/webp/,image/gif"
        onChange={onFileSelect}
      />
    </div>
  );
}
