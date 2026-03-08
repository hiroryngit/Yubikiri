import { AgreementForm } from "@/components/agreement-form";

export default function NewAgreementPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <h1 className="font-bold text-2xl">同意書を作成</h1>
      <p className="text-muted-foreground">
        合意内容を記入し、相手のメールアドレスを指定してください。
        作成後にURLを共有して合意を得ることができます。
      </p>
      <AgreementForm />
    </div>
  );
}
