import { useState, useEffect } from "react";
import { eq } from "drizzle-orm";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
  json
} from "@remix-run/node";
import {
  ShouldRevalidateFunctionArgs,
  useFetcher,
  useLoaderData,
  useNavigate
} from "@remix-run/react";

import { isSecurePassword } from "@/lib/helpers/password-helpers";
import { sqlite, users } from "@/lib/sqlite";
import { bufferToBase64, arrayToBase64 } from "@/lib/helpers/binary-helpers";
import { initializeKeyPair, initializeMK } from "@/lib/services/crypto-service";
import { requireSession } from "@/lib/services/session-service";
import { Button, Input, Alert, FormCard } from "@/components/common";
import PasswordChecker from "@/components/PasswordChecker";
import { storeKey } from "@/lib/services/keydb-service";
import { debug } from "@/lib/helpers/logger";
import { setPasswordValidator } from "@/lib/validators/onboarding-validators";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionResult) {
    return false;
  }
  return args.defaultShouldRevalidate;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireSession(request);

  if (user.mkS) {
    debug(`User ${user.id} has already created a password`);
    return redirect("/dash/home");
  }

  return json({ userId: user.id });
}

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await requireSession(request);
  if (user.mkS || user.prK || user.prKIv || user.mkT || user.mkTIv) {
    return redirect("/dash");
  }

  const validation = setPasswordValidator(await request.formData());

  if (!validation.success) {
    throw json({ message: "Something went wrong." }, { status: 400 });
  }

  await sqlite.update(users).set(validation.data).where(eq(users.id, user.id));

  return json({ message: "Password set successfully." });
}

export default function SetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetcher = useFetcher<typeof action>();
  const { userId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && key) {
      setIsLoading(false);
      storeKey(key, userId, userId)
        .then(() => {
          navigate("/dash/home");
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Something went wrong.");
          setIsLoading(false);
        });
    }
  }, [fetcher.state]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const fd = new FormData(e.currentTarget);
      const pw = fd.get("password")?.toString();
      if (!pw || !isSecurePassword(pw)) {
        setError(
          "Your password does not meet the requirements. Try a new one."
        );
        setIsLoading(false);
        return;
      }
      fd.delete("password");

      const { key, salt, mkt, mktIv } = await initializeMK(userId, pw);
      const { puK, prKIv, wrappedPrK } = await initializeKeyPair(key);
      setKey(key);

      const body = new FormData();
      body.append("puK", JSON.stringify(puK));
      body.append("prK", wrappedPrK);
      body.append("prKIv", arrayToBase64(prKIv));
      body.append("mkS", arrayToBase64(salt));
      body.append("mkT", bufferToBase64(mkt));
      body.append("mkTIv", arrayToBase64(mktIv));
      fetcher.submit(body, { method: "POST" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setIsLoading(false);
    }
  };

  return (
    <FormCard header="Create Your Account" subHeader="Set Your Password">
      <form onSubmit={onSubmit}>
        <fieldset disabled={isLoading} className="grid gap-4">
          <Alert variant="error" dismissible>
            {error}
          </Alert>
          <Input
            required
            type="password"
            name="password"
            label="Password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            required
            type="password"
            name="password2"
            label="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordChecker password1={password1} password2={password2} />
          <Button
            isLoading={isLoading}
            disabled={!isSecurePassword(password1)}
            type="submit"
          >
            Next
          </Button>
        </fieldset>
      </form>
    </FormCard>
  );
}
