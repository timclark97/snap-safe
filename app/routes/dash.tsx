import { useEffect, useState } from "react";
import { Outlet, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useNavigate, useLocation } from "@remix-run/react";

import { requireSession } from "@/lib/services/session-service";
import { DashHeader } from "@/components/common";
import { getKey } from "@/lib/services/keydb-service";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Dashboard" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  return json({ user: session.user });
}

type UploadItem = {
  file: File;
  albumId: string;
  state: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function DashLayout() {
  const { user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map());
  const { pathname } = useLocation();

  useEffect(() => {
    getKey(user.id, user.id).then((key) => {
      if (
        !key &&
        ![
          "/dash/confirm-password",
          "/dash/onboarding/password",
          "/dash/onboarding/password-set",
          "/dash/onboarding/name"
        ].includes(pathname)
      ) {
        navigate("/dash/confirm-password");
        return;
      }
      if (pathname === "/dash") {
        navigate("/dash/home");
      }
    });
  }, [user.id]);

  const enqueuePhoto = (id: string, file: File, albumId: string) => {
    setUploads((uploads) => {
      if (uploads.has(id)) {
        return uploads;
      }
      uploads.set(id, { file, albumId, state: "pending" });

      return new Map(uploads);
    });
    const worker = new Worker("/workers/upload-worker.js");
    worker.postMessage({
      id,
      albumId,
      userId: user.id,
      file
    });
    worker.onmessage = (event) => {
      const data = event.data;
      setUploads((uploads) => {
        const upload = uploads.get(id);
        if (!upload) {
          return uploads;
        }
        if (data.error) {
          uploads.set(id, {
            ...upload,
            state: data.state,
            error: data.error
          });
          return new Map(uploads);
        }

        uploads.set(id, {
          ...upload,
          state: data.state
        });

        return new Map(uploads);
      });
    };
  };
  return (
    <>
      <DashHeader user={user} />
      <div className="py-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Outlet context={{ user, enqueuePhoto }} />
      </div>
      {uploads.size > 0 && (
        <div className="fixed bottom-0 right-2 border rounded-md">
          {[...uploads.entries()].map(([id, upload]) => (
            <div key={id} className="flex">
              <div>{upload.file.name}</div>
              <div>{upload.state}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
