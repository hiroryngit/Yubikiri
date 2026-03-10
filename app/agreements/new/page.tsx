import { AgreementForm } from "@/components/agreement-form";
import { NewAgreementHeader } from "@/components/new-agreement-header";

export default function NewAgreementPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-2xl mx-auto px-5 sm:px-8 py-6 sm:py-12">
      <NewAgreementHeader variant="public" />
      <AgreementForm />
    </div>
  );
}
