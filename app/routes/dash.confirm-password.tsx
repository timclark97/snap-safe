import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";

import { sqlite } from "@/lib/sqlite";
import { requireSession } from "@/lib/services";
import { Button, FormCard, Input } from "@/components/common";
import { deriveMK } from "@/lib/services/crypto-service";
import { getKey, updateKey, storeKey } from "@/lib/services/keydb-service";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const user = await sqlite.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, session.userId),
    columns: {
      id: true,
      mkS: true,
    },
  });

  if (!user?.mkS) {
    return redirect("/dash/onboarding/password");
  }
  return json({ userId: user!.id, mks: user!.mkS });
}

export default function ConfirmKey() {
  const [loading, setLoading] = useState(false);
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  return (
    <div>
      <FormCard
        header="Enter your password"
        subHeader="You are required to re-enter your password every 2 weeks."
      >
        <form
          onSubmit={async (e) => {
            console.log("submitting");
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const password = fd.get("password") as string;
            const tmpKey = await getKey(data.userId, data.userId);
            console.log("tmpKey", tmpKey);
            const key = await deriveMK(data.userId, password, data.mks);
            await storeKey(key, data.userId, data.userId);
          }}
        >
          <fieldset className="grid gap-6">
            <Input name="password" label="Password" type="password" />
            <Button type="submit">Continue</Button>
          </fieldset>
        </form>
      </FormCard>
    </div>
  );
}
