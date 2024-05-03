import { Outlet, useLoaderData, useRouteError, Link } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { PhotoIcon } from "@heroicons/react/24/solid";

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
                  <EncryptedPhoto photo={album.photos[0]} />
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
