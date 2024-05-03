import { ReactNode, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "@remix-run/react";
import { CircleIconButton } from ".";

export default function RouteModal({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const scrollBarCompensation = window.innerWidth - document.body.offsetWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollBarCompensation}px`;

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/65 z-50 flex justify-center items-center"
      onClick={() => navigate(-1)}
    >
      <div
        className="bg-white md:rounded-md md:w-fit md:h-fit h-full w-full overflow-y-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2 px-2 flex md:justify-end justify-start items-center">
          <CircleIconButton onClick={() => navigate(-1)}>
            <XMarkIcon className="size-6" />
          </CircleIconButton>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
