import { useEffect, useRef } from "react";
import { ShareIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "@remix-run/react";

import { CircleIconButton } from "../common";
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
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const addBorderListener = () => {
    if (window.scrollY > 76 && navRef.current) {
      navRef.current.setAttribute("style", "border-bottom: 1px solid #e5e7eb");
    }
  };

  const removeBorderListener = () => {
    if (window.scrollY <= 76) {
      navRef.current?.removeAttribute("style");
    }
  };

  useEffect(() => {
    if (navRef.current) {
      window.addEventListener("scroll", addBorderListener);
    }
    if (navRef.current) {
      window.addEventListener("scroll", removeBorderListener);
    }
    return () => {
      window.removeEventListener("scroll", addBorderListener);
      window.removeEventListener("scroll", removeBorderListener);
    };
  }, []);

  return (
    <div
      ref={navRef}
      className={`text-2xl my-5 py-2 font-medium sticky top-0 bg-white px-0.5 md:px-8 z-10`}
    >
      <div className="relative">
        <div className="absolute md:text-xl text-base center h-full flex items-center left-[50%] -translate-x-1/2">
          <h1>{album.name}</h1>
        </div>
        <div className="justify-between items-center flex md:-ml-2.5">
          <CircleIconButton onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="h-5 w-5 stroke-2" />
          </CircleIconButton>
          <div className="flex md:gap-2 gap-1 items-center">
            {permission.permission === "owner" && (
              <CircleIconButton onClick={() => navigate(`/albums/${album.id}/share`)}>
                <ShareIcon className="h-5 w-5 stoke-2" />
              </CircleIconButton>
            )}
            {(permission.permission == "write" || permission.permission === "owner") && (
              <UploadButton albumId={album.id} onSuccess={uploadCallback} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
