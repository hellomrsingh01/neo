"use client";

import { useMemo } from "react";

export type ProfileFormData = {
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-gray-700">{children}</div>;
}

function baseInputClass(disabled: boolean) {
  return [
    "profile-field mt-2 w-full rounded-lg border border-gray-200 bg-[#F6F6F6] px-4 py-3 text-sm placeholder:text-gray-400",
    "focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50",
    disabled ? "cursor-not-allowed" : "",
  ].join(" ");
}

export function ProfileForm({
  data,
  disabled,
  onChange,
}: {
  data: ProfileFormData;
  disabled: boolean;
  onChange: (patch: Partial<ProfileFormData>) => void;
}) {
  const common = useMemo(() => baseInputClass(disabled), [disabled]);
  const modeClass = disabled ? "profile-readonly" : "profile-editing";

  return (
    <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
      <div>
        <FieldLabel>First Name</FieldLabel>
        <input
          disabled={disabled}
          value={data.firstName ?? ""}
          onChange={(e) => onChange({ firstName: e.target.value })}
          placeholder="Your First Name"
          className={`${common} ${modeClass}`}
        />
      </div>

      <div>
        <FieldLabel>Last Name</FieldLabel>
        <input
          disabled={disabled}
          value={data.lastName ?? ""}
          onChange={(e) => onChange({ lastName: e.target.value })}
          placeholder="Your Last Name"
          className={`${common} ${modeClass}`}
        />
      </div>

      <div>
        <FieldLabel>Gender</FieldLabel>
        <div className="relative">
          <select
            disabled={disabled}
            value={data.gender ?? ""}
            onChange={(e) => onChange({ gender: e.target.value })}
            className={`${common} ${modeClass} appearance-none pr-10`}
          >
            <option value="" disabled>
              Your Gender
            </option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_say">Prefer not to say</option>
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 8l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div>
        <FieldLabel>Email</FieldLabel>
        <input
          disabled
          value={data.email ?? ""}
          placeholder="Your Email"
          className={`${common} ${modeClass}`}
        />
      </div>

      <div>
        <FieldLabel>Phone Number</FieldLabel>
        <input
          disabled={disabled}
          value={data.phoneNumber ?? ""}
          onChange={(e) => onChange({ phoneNumber: e.target.value })}
          placeholder="Your Phone Number"
          className={`${common} ${modeClass}`}
        />
      </div>

      <div>
        <FieldLabel>Address</FieldLabel>
        <input
          disabled={disabled}
          value={data.address ?? ""}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Your Address"
          className={`${common} ${modeClass}`}
        />
      </div>
    </div>
  );
}

