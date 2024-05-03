import { useEffect } from "react";
import type { PhotosWithObjectUrl } from "@/routes/albums.$id";

import PhotoModalDesktop from "./PhotoModalDesktop";

export type PhotoModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  photos: PhotosWithObjectUrl[];
  index: number;
};

export default function PhotosModal(props: PhotoModalProps) {
  useEffect(() => {
    if (props.isOpen) {
      const scrollBarCompensation = window.innerWidth - document.body.offsetWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarCompensation}px`;
    }
    if (!props.isOpen) {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, [props.isOpen]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <>
      <PhotoModalDesktop {...props} />
    </>
  );
}
