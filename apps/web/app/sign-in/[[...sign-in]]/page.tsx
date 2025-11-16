import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl rounded-2xl",
            headerTitle: "text-charcoal",
            headerSubtitle: "text-charcoal/70",
            socialButtonsBlockButton: "bg-emerald-600 hover:bg-emerald-700",
            formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
            footerActionLink: "text-emerald-600 hover:text-emerald-700"
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

