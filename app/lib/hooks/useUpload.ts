import { useOutletContext } from "@remix-run/react";

type EnqueuePhoto = (id: string, file: File, albumId: string) => void;

export const useUpload = () => {
  const outlet = useOutletContext<{ enqueuePhoto: EnqueuePhoto }>();
  return { enqueuePhoto: outlet.enqueuePhoto };
};
