import { Outlet, useLoaderData, useRouteError, Link } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { sqlite } from "@/lib/sqlite";
import { requireSession } from "@/lib/services/session-service";
import { Alert, StyledLink } from "@/components/common";
import { getErrorBoundaryMessage } from "@/lib/helpers/error-helpers";
import { EncryptedPhoto } from "@/components/album-details/EncryptedPhoto";
import SideNav from "@/components/SideNav";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Dashboard" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albums = await sqlite.query.albums.findMany({
    where: (a, { eq }) => eq(a.userId, session.userId),
    with: {
      photos: {
        limit: 1
      }
    }
  });
  return json({ albums });
}

export default function DashLayout() {
  const { albums } = useLoaderData<typeof loader>();

  return (
    <div className="flex">
      <SideNav />
      <div className="py-8 px-6 w-full">
        <div className="grid grid-cols-4 gap-6">
          {albums.map((album) => (
            <div key={album.id} className="">
              <div className="aspect-square w-full rounded-md overflow-hidden">
                <StyledLink to={`/albums/${album.id}`} className="w-full h-full">
                  {album.photos.length > 0 ? (
                    <EncryptedPhoto photo={album.photos[0]} />
                  ) : (
                    <div className="bg-gray-200 text-gray-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-full"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                    </div>
                  )}
                </StyledLink>
              </div>
              <Link to={`/albums/${album.id}`} className="line-clamp-1 pt-1">
                {album.name}
              </Link>
            </div>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <Alert variant="error" revalidateable>
      {getErrorBoundaryMessage(error)}
    </Alert>
  );
}
