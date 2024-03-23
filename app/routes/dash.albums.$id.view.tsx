import { useSearchParams, useNavigate, useParams } from "@remix-run/react";

export default function PhotoView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();

  const url = params.get("object_url");
  if (!url) {
    navigate(`/dash/albums/${id}`);
    return null;
  }
  return (
    <div className="fixed flex items-center justify-center inset-0 w-screen h-screen bg-black/50 z-50">
      <div className="bg-white my-4 w-2/3 max-w-lg">
        <img src={url} className="object-contain" />
      </div>
    </div>
  );
}
