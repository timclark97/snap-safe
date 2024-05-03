import type { MetaFunction } from "@remix-run/node";

import { LinkButton, FormCard } from "@/components/common";

export const meta: MetaFunction = () => {
  return [{ title: "SnapSafe | Welcome" }];
};

export default function DashLayout() {
  return (
    <FormCard header="Create Your Account" subHeader="Set Your Password">
      <div className="grid gap-8">
        <p>
          In the next step, you will set your password. Your password is used to encrypt
          and decrypt your photos.
        </p>
        <p>
          It is important to remember your password because{" "}
          <span className="text-primary pointer-events-none font-bold">Snap</span>
          <span className="text-secondary pointer-events-none font-bold">Safe</span>{" "}
          cannot recover it for you if you forget.
        </p>
        <p>
          We recommend using a password manager to create and store a strong password.
        </p>
        <LinkButton to="/onboarding/password-set" prefetch="none">
          Continue
        </LinkButton>
      </div>
    </FormCard>
  );
}
