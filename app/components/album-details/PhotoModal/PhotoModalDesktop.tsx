import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

import type { PhotosWithObjectUrl } from "@/routes/albums.$id";
import { EncryptedPhoto } from "../EncryptedPhoto";

export default function PhotoModalDesktop({
  isOpen,
  setIsOpen,
  photos,
  index
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  photos: PhotosWithObjectUrl[];
  index: number;
}) {
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(index);

  useEffect(() => {
    setCurrentIndex(index);
  }, [isOpen, index]);

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50"
      onClick={() => {
        setCurrentIndex(undefined);
        setIsOpen(false);
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center ">
        <div className="absolute w-full lg:px-20 px-10 flex justify-between">
          <div>
            {currentIndex !== undefined && currentIndex > 0 && (
              <button
                className="bg-white rounded-full p-2 transition-transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex === 0) {
                    return;
                  }
                  setCurrentIndex(currentIndex - 1);
                }}
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}
          </div>
          <div>
            {currentIndex !== undefined && currentIndex < photos.length - 1 && (
              <button
                className="bg-white rounded-full p-2 transition-transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex === photos.length - 1) {
                    return;
                  }
                  setCurrentIndex(currentIndex + 1);
                }}
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="h-[95vh]">
            {currentIndex !== undefined && (
              <EncryptedPhoto
                photo={photos[currentIndex]}
                className="object-contain h-full w-auto max-w-[70vw] rounded-md overflow-hidden bg-transparent text-transparent"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
