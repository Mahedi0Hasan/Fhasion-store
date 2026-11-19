import { PolicyPage, policyMetadata } from "@/components/info/policy-page";

export const generateMetadata = () => policyMetadata("return-policy");

export default function Page() {
  return <PolicyPage slug="return-policy" />;
}
