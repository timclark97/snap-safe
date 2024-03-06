import { useState, useEffect } from "react";
import { eq } from "drizzle-orm";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react";

import {
  hasLength,
  hasNumber,
  hasSymbol,
  hasUpperCase,
  isSecurePassword,
} from "@/lib/helpers/password-helper";
import { sqlite, users } from "@/lib/sqlite";
import { bufferToBase64, arrayToBase64 } from "@/lib/helpers/binary-helper";
import {
  deriveMK,
  createKeyPair,
  createSalt,
  createIv,
} from "@/lib/services/crypto-service";
import { requireSession } from "@/lib/services";
import { Button, Input, Alert } from "@/components/common";
import { storeKey } from "@/lib/services/keydb-service";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request);

  const user = await sqlite.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, session.userId),
  });

  if (user!.mkS || user!.puK || user!.prK || user!.prKIv) {
    console.log("Redirecting password-set server");
    return redirect("/dash");
  }
  return json({ userId: user!.id });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request);

  const body = await request.formData();
  const puK = body.get("puK") as string;
  const prK = body.get("prK") as string;
  const prKIv = body.get("prKIv") as string;
  const mkS = body.get("mkS") as string;

  if (!puK || !prK || !prKIv || !mkS) {
    throw new Error("Something went wrong. Please try again.");
  }
  const user = await sqlite.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, session.userId),
  });

  if (!user || user.mkS || user.puK || user.prK || user.prKIv) {
    return redirect("/dash");
  }

  await sqlite
    .update(users)
    .set({
      mkS,
      puK,
      prK,
      prKIv,
    })
    .where(eq(users.id, session.userId));

  return redirect("/dash");
}

export default function DashLayout() {
  const [isLoading, setIsLoading] = useState(false);
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [mk, setMk] = useState<CryptoKey | null>(null);

  const { state, submit, data } = useFetcher<typeof action>();
  const { userId } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (state === "idle") {
      setIsLoading(false);
    }
  }, [state, data]);

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setIsLoading(true);
          const fd = new FormData(e.target as HTMLFormElement);
          const pw = fd.get("password")?.toString() ?? "";
          fd.delete("password");
          const mkS = createSalt();
          const mk = await deriveMK(userId, pw, mkS);
          setMk(mk);
          const keyPair = await createKeyPair();
          const puK = await window.crypto.subtle.exportKey(
            "jwk",
            keyPair.publicKey
          );
          const prKIv = createIv();
          const prKBuffer = await window.crypto.subtle.wrapKey(
            "pkcs8",
            keyPair.privateKey,
            mk,
            {
              name: "AES-GCM",
              iv: prKIv,
            }
          );
          const prK = bufferToBase64(prKBuffer);
          const body = new FormData();

          body.append("puK", JSON.stringify(puK));
          body.append("prK", prK);
          body.append("prKIv", arrayToBase64(prKIv));
          body.append("mkS", arrayToBase64(mkS));
          await storeKey(mk, userId, userId);
          submit(body, { method: "POST" });
        }}
      >
        <div className="m-auto mt-4 max-w-md rounded border-gray-200 p-8 md:mt-10 md:border">
          <div className="pb-6">
            <div className="pb-4 text-center text-2xl font-bold tracking-tight">
              <span className="text-primary pointer-events-none">Snap</span>
              <span className="text-secondary pointer-events-none">Safe</span>
            </div>
            <div className="text-center text-2xl">Create Your Account</div>
            <div className="text-center text-gray-600">Set Your Password</div>
          </div>
          <fieldset disabled={isLoading} className="grid gap-8">
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
            <div className="grid gap-2">
              {hasLength(password1) ? (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Minimum 8 characters
                </div>
              ) : (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Minimum 8 characters
                </div>
              )}
              {hasUpperCase(password1) ? (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes uppercase letter
                </div>
              ) : (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes uppercase letter
                </div>
              )}
              {hasSymbol(password1) ? (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes symbol
                </div>
              ) : (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes symbol
                </div>
              )}
              {hasNumber(password1) ? (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes number
                </div>
              ) : (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Includes number
                </div>
              )}
              {password1 && password2 && password1 === password2 ? (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-green-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Passwords Match
                </div>
              ) : (
                <div className="flex gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Passwords Match
                </div>
              )}
            </div>
            <Button
              isLoading={isLoading}
              disabled={!isSecurePassword(password1)}
              type="submit"
            >
              Next
            </Button>
          </fieldset>
        </div>
      </form>
    </div>
  );
}

export function ErrorBoundary() {
  const revalidator = useRevalidator();
  return (
    <div className="m-auto mt-4 max-w-md rounded border border-gray-200 p-8 md:mt-10">
      <div className="pb-6">
        <div className="pb-4 text-center text-2xl font-bold tracking-tight">
          <span className="text-primary pointer-events-none">Snap</span>
          <span className="text-secondary pointer-events-none">Safe</span>
        </div>
        <div className="text-center text-2xl">Create Your Account</div>
        <div className="text-center text-gray-600">Enter your name</div>
      </div>

      <Alert variant="error" header="Something went wrong">
        <div>Something went wrong. Please try again.</div>
        <button
          className="font-semibold underline"
          onClick={() => revalidator.revalidate()}
        >
          Try Again
        </button>
      </Alert>
    </div>
  );
}
