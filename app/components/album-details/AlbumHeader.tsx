import { ShareIcon } from "@heroicons/react/20/solid";

import { LinkButton } from "../common";
import UploadButton from "./UploadButton";

export default function AlbumHeader({
  album,
  permission,
  uploadCallback
}: {
  album: { name: string; id: string };
  permission: { permission: string };
  uploadCallback: () => void;
}) {
  return (
    <div className="text-2xl font-medium justify-between items-center flex">
      <h1>{album.name}</h1>
      <div className="flex gap-2 items-center">
        {permission.permission === "owner" && (
          <LinkButton to={`/dash/albums/${album.id}/share`}>
            <ShareIcon className="h-5 w-5" />
          </LinkButton>
        )}
        {(permission.permission == "write" || permission.permission === "owner") && (
          <UploadButton albumId={album.id} onSuccess={uploadCallback} />
        )}
      </div>
    </div>
  );
}
