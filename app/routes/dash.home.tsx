import { useLoaderData } from "@remix-run/react";
import { type LoaderFunctionArgs, json } from "@remix-run/node";

import { useSelf } from "@/lib/hooks/useSelf";
import { LinkButton, StyledLink } from "@/components/common";
import { requireSession } from "@/lib/services/session-service";
import { sqlite } from "@/lib/sqlite";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const albums = await sqlite.query.albums.findMany({
    where: (a, { eq }) => eq(a.userId, session.userId)
  });
  return json({ albums });
}

export default function DashHome() {
  const user = useSelf();
  const albums = useLoaderData<typeof loader>();
  return (
    <div className="">
      <div className="text-2xl font-semibold flex justify-between items-center">
        <div>Welcome {user.firstName}</div>
        <LinkButton to="/dash/albums/create">Create an album</LinkButton>
      </div>

      <div className="py-4">
        <div className="text-lg font-medium">Your albums</div>
        <div className="grid">
          {albums.albums.map((album) => (
            <StyledLink key={album.id} to={`/dash/albums/${album.id}`}>
              {album.name}
            </StyledLink>
          ))}
        </div>
      </div>
    </div>
  );
}
