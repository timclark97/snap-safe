import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";

import { sqlite } from "@/lib/sqlite";
import { requireSession } from "@/lib/services";
import { Button, FormCard, Input, Alert } from "@/components/common";
import { deriveMK } from "@/lib/services/crypto-service";
import { getKey, updateKey, storeKey } from "@/lib/services/keydb-service";
import { base64ToArray } from "@/lib/helpers/binary-helper";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);
  const user = await sqlite.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, session.userId),
    columns: {
      id: true,
      mkS: true,
      mkT: true,
      mkTIv: true,
    },
  });

  if (!user?.mkS || !user?.mkT || !user?.mkTIv) {
    return redirect("/dash/onboarding/password");
  }
  return json({
    userId: user!.id,
    mks: user!.mkS,
    mkTIv: user!.mkTIv,
    mkT: user!.mkT,
  });
}

export default function ConfirmKey() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  return (
    <div>
      <FormCard
        header="Enter your password"
        subHeader="You are required to re-enter your password every 2 weeks."
      >
        <form
          onSubmit={async (e) => {
            setLoading(true);
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const password = fd.get("password") as string;
            const mk = await deriveMK(data.userId, password, data.mks);
            try {
              await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: base64ToArray(data.mkTIv) },
                mk,
                base64ToArray(data.mkT)
              );
            } catch (e) {
              setError("Wrong password");
              setLoading(false);
              return;
            }
            const currentKey = await getKey(data.userId, data.userId);
            if (currentKey) {
              await updateKey(mk, data.userId, data.userId);
              return navigate("/dash");
            }
            await storeKey(mk, data.userId, data.userId);
            navigate("/dash");
          }}
        >
          <fieldset className="grid gap-6" disabled={loading}>
            <Alert variant="error" header="Uh Oh" dismissible>
              {error}
            </Alert>
            <Input name="password" label="Password" type="password" />
            <Button type="submit" isLoading={loading}>
              Continue
            </Button>
          </fieldset>
        </form>
      </FormCard>
    </div>
  );
}
