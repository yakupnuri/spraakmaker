"use client";

import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("bug");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; msg: string } | null>(null);

  const web3formsKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    if (!web3formsKey) {
      console.warn("Spraakmaker Feedback: NEXT_PUBLIC_WEB3FORMS_KEY is not defined. Simulating API call.");
      console.log("Feedback Submitted:", { feedbackType, email, message });
      
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitResult({
          success: true,
          msg: "Demo Modu: Geri bildiriminiz konsola yazdırıldı! Gerçek gönderimler için lütfen .env.local dosyasına NEXT_PUBLIC_WEB3FORMS_KEY değerini ekleyin.",
        });
        setMessage("");
      }, 1000);
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          name: "Spraakmaker Gebruiker",
          email: email || "no-email@spraakmaker.app",
          subject: `Spraakmaker Feedback: ${feedbackType.toUpperCase()}`,
          message: message,
          from_name: "Spraakmaker App",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitResult({
          success: true,
          msg: "Bedankt! Je feedback is succesvol verzonden. We gaan ermee aan de slag!",
        });
        setMessage("");
        setEmail("");
      } else {
        setSubmitResult({
          success: false,
          msg: data.message || "Er is iets misgegaan bij het verzenden. Probeer het later opnieuw.",
        });
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        msg: "Netwerkfout. Controleer je internetverbinding en probeer het opnieuw.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 select-none">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-5 py-4 shadow-sm flex justify-between items-center shrink-0">
        <span className="text-sm font-black uppercase tracking-wider text-[var(--text)]">Feedback & Destek</span>
        <Link href="/meer" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full border border-[var(--accent)]/15">
          SLUITEN
        </Link>
      </header>

      {/* Banner */}
      <div className="bg-[var(--primary)] p-5 text-white">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
          HELP MEEDENCKEN (Bize Yardım Et)
        </span>
        <h1 className="text-xl font-extrabold">Feedback & Foutrapportage</h1>
        <p className="text-xs opacity-75 mt-1 leading-normal">
          Heb je een fout (bug) gevonden, of heb je een geweldig idee voor een nieuwe functie? Laat het ons weten!
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto w-full max-w-lg mx-auto">
        
        {/* Type Selection */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl shadow-sm">
          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-3">
            WAAR GAAT HET OVER? (Konu Nedir?)
          </span>
          <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)]">
            {(["bug", "feature", "general"] as const).map((t) => {
              const active = feedbackType === t;
              const labels = {
                bug: "Bug 🐛",
                feature: "Fikir 💡",
                general: "Diğer 💬",
              };
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFeedbackType(t)}
                  className={`flex-grow py-2.5 text-xs font-bold border-none rounded-lg cursor-pointer transition-all active:scale-98 ${
                    active
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Address */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl shadow-sm">
          <label htmlFor="email" className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-2">
            JE E-MAILADRES (E-posta Adresin - İsteğe Bağlı)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@voorbeeld.nl"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none font-semibold text-sm placeholder:opacity-30 text-[var(--text)] transition-all focus:border-[var(--accent)]"
          />
          <p className="text-[9px] text-[var(--text-muted)] opacity-60 mt-1.5 leading-normal">
            Vul dit in als je wilt dat we contact met je opnemen over je melding.
          </p>
        </div>

        {/* Feedback Message */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl shadow-sm flex-grow flex flex-col min-h-[220px]">
          <label htmlFor="message" className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-2">
            JE BERICHT (Mesajın - Zorunlu)
          </label>
          <textarea
            id="message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              feedbackType === "bug"
                ? "Wat ging er mis? Wat gebeurde er en wat had er moeten gebeuren? Voeg indien mogelijk stappen toe..."
                : feedbackType === "feature"
                ? "Welke nieuwe functie zou je willen zien? Hoe zou het moeten werken? Waarom is dit nuttig?"
                : "Schrijf hier je opmerking of suggestie..."
            }
            className="w-full flex-grow bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none font-semibold text-sm placeholder:opacity-30 text-[var(--text)] resize-none transition-all focus:border-[var(--accent)] min-h-[120px]"
          />
        </div>

        {/* Submit Results */}
        {submitResult && (
          <div
            className={`border p-4 rounded-xl font-bold text-xs shadow-sm ${
              submitResult.success
                ? "bg-[var(--success-soft)] border-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--danger-soft)] border-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {submitResult.msg}
          </div>
        )}

        {/* Dev warning */}
        {!web3formsKey && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] p-3 rounded-xl text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-bold text-[var(--text)]">Ontwikkelaarsnotitie:</span> Om echte e-mails te ontvangen, maak je een key aan op{" "}
            <a
              href="https://web3forms.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-[var(--accent)]"
            >
              web3forms.com
            </a>{" "}
            ve voeg deze toe aan <code className="bg-white/10 dark:bg-black/10 px-1 rounded">.env.local</code>.
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="w-full bg-[var(--primary)] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer border-none mb-4 active:scale-98 shadow-sm"
        >
          {isSubmitting ? "VERZENDEN..." : "FEEDBACK VERZENDEN"}
        </button>

      </form>
    </div>
  );
}
