import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";

import { colors, sizes } from "../common/Button";
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
        className={`${colors.primary} ${sizes.base} flex items-center font-medium text-sm cursor-pointer rounded-md`}
      >
        Upload
        <ArrowUpTrayIcon className="h-4 w-4 inline-block ml-2 stroke-2" />
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
