import { AgreementForm } from "@/components/agreement-form";
import { NewAgreementHeader } from "@/components/new-agreement-header";

export default function NewAgreementPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <NewAgreementHeader variant="protected" />
      <AgreementForm />
    </div>
  );
}
