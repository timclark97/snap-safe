import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

import MobileModalPhoto from "./MobileModalPhoto";

type MobilCarouselPhoto = {
  objectUrl?: string;
  id: string;
};
export default function PhotoModalMobile({
  photos,
  setIsOpen,
  index
}: {
  photos: MobilCarouselPhoto[];
  setIsOpen: (value: boolean) => void;
  index: number;
}) {
  const trackRef = React.useRef(null);
  return (
    <div className="h-full w-full fixed inset-0 z-50 bg-black">
      <div className="relative">
        <div className="absolute z-[100] right-0 px-4 top-1.5 text-white">
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center rounded-full p-1.5"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      {/* The no-scrollbar class comes from `globals.css` of the next app */}
      <div
        ref={trackRef}
        className="no-scrollbar box-border max-w-[500px] m-auto flex items h-full w-full snap-x snap-mandatory list-none overflow-y-hidden overflow-x-scroll"
      >
        {photos.map((p, i) => (
          <div
            className="relative box-border h-full w-full min-w-full snap-start"
            key={p.objectUrl}
          >
            <MobileModalPhoto ref={trackRef} photo={p} index={i + 1} startIndex={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
