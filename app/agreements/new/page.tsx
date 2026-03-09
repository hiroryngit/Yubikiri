import { AgreementForm } from "@/components/agreement-form";

export default function NewAgreementPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-bold text-2xl">同意書を作成</h1>
      <p className="text-muted-foreground">
        合意内容を記入してください。作成後にURLを共有して合意を得ることができます。
      </p>
      <AgreementForm />
    </div>
  );
}
