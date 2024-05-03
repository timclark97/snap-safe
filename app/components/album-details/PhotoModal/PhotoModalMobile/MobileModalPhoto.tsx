import React from "react";
import { EncryptedPhoto } from "../../EncryptedPhoto";

const MobilePhotoCarouselPhoto = React.forwardRef(
  (
    {
      photo,
      index,
      startIndex
    }: {
      photo: { objectUrl?: string; id: string };
      index: number;
      startIndex?: number;
    },
    ref: any
  ) => {
    const itemRef = React.useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = React.useState(false);

    React.useEffect(() => {
      if (startIndex === index && itemRef.current) {
        itemRef.current.scrollIntoView();
      }

      if (itemRef.current && typeof IntersectionObserver === "function") {
        const observer = new IntersectionObserver(
          ([e]) => {
            if (e.isIntersecting) {
              setShouldLoad(true);
              observer.disconnect();
            }
          },
          {
            root: ref.current,
            rootMargin: "0px 100% 0px 0px"
          } as IntersectionObserverInit
        );
        observer.observe(itemRef.current);
        return () => observer.disconnect();
      }
      return;
    }, [itemRef.current]);

    return (
      <div className="h-full w-full flex justify-center" ref={itemRef}>
        <EncryptedPhoto
          className="object-contain w-full h-full"
          src={photo.objectUrl}
          loading={shouldLoad ? "eager" : "lazy"}
        />
      </div>
    );
  }
);

MobilePhotoCarouselPhoto.displayName = "MobilePhotoCarouselPhoto";

export default MobilePhotoCarouselPhoto;
