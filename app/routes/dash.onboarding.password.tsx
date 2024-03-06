import type { MetaFunction } from "@remix-run/node";

import { LinkButton } from "@/components/common";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export default function DashLayout() {
  return (
    <div>
      <div className="m-auto  mt-4 max-w-md rounded border-gray-200 p-8 md:mt-10 md:border">
        <div className="pb-6">
          <div className="pb-4 text-center text-2xl font-bold tracking-tight">
            <span className="text-primary pointer-events-none">Snap</span>
            <span className="text-secondary pointer-events-none">Safe</span>
          </div>
          <div className="text-center text-2xl">Create Your Account</div>
          <div className="text-center text-gray-600">Set Your Password</div>
        </div>
        <div className="grid gap-8">
          <p>
            In the next step, you will set your password. Your password is used
            to encrypt and decrypt your photos.
          </p>
          <p>
            It is important to remember your password because{" "}
            <span className="text-primary pointer-events-none font-bold">
              Snap
            </span>
            <span className="text-secondary pointer-events-none font-bold">
              Safe
            </span>{" "}
            cannot recover it for you if you forget.
          </p>
          <p>
            We recommend using a password manager to create and store a strong
            password.
          </p>
          <LinkButton to="/dash/onboarding/password-set">Continue</LinkButton>
        </div>
      </div>
    </div>
  );
}
