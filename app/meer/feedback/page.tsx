"use client";

import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("bug");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Web3Forms API Key from environment variables (client-accessible in Next.js when prefixed with NEXT_PUBLIC_)
  const web3formsKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    // If there is no API key configured, we will simulate a successful send for development/testing
    if (!web3formsKey) {
      console.warn("Spraakmaker Feedback: NEXT_PUBLIC_WEB3FORMS_KEY is not defined. Simulating API call.");
      console.log("Feedback Submitted:", { feedbackType, email, message });
      
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitResult({
          success: true,
          msg: "Demo Modu: Geri bildiriminiz konsola yazdırıldı! Gerçek gönderimler için lütfen .env.local dosyasına NEXT_PUBLIC_WEB3FORMS_KEY değerini ekleyin.",
        });
        // Clear message
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
    <div className="flex flex-col min-h-screen bg-[var(--ds-white)]">
      {/* Header */}
      <div className="bg-[var(--ds-black)] px-5 py-4 flex justify-between items-center">
        <span className="text-sm font-bold text-[var(--ds-white)] lowercase tracking-wide">feedback</span>
        <Link href="/meer" className="text-xs font-bold uppercase tracking-widest text-[var(--ds-yellow)]">
          SLUITEN
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-[var(--ds-blue)] border-b-[3px] border-[var(--ds-black)] p-5 text-[var(--ds-white)]">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">
          HELP MEEDENCKEN
        </span>
        <h1 className="text-xl font-black">Feedback & Foutrapportage</h1>
        <p className="text-xs opacity-75 mt-1">
          Heb je een fout (bug) gevonden, of heb je een geweldig idee voor een nieuwe functie? Laat het ons weten!
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        
        {/* Type Selection */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4">
          <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest block mb-3">
            WAAR GAAT HET OVER?
          </span>
          <div className="flex gap-[3px] bg-[var(--ds-black)] p-[3px]">
            {(["bug", "feature", "general"] as const).map((t) => {
              const active = feedbackType === t;
              const labels = {
                bug: "Fout/Bug 🐛",
                feature: "Idee 💡",
                general: "Algemeen 💬",
              };
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFeedbackType(t)}
                  className={`flex-1 py-3 text-xs font-bold border-none cursor-pointer transition-colors ${
                    active
                      ? "bg-[var(--ds-yellow)] text-[var(--ds-black)]"
                      : "bg-[var(--ds-white)] text-[var(--ds-black)] hover:bg-[var(--ds-gray)]"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Address */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4">
          <label htmlFor="email" className="text-[9px] font-bold opacity-50 uppercase tracking-widest block mb-2">
            JE E-MAILADRES (OPTIONEEL)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@voorbeeld.nl"
            className="w-full bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] px-3 py-2 outline-none font-bold text-sm placeholder:opacity-30 text-[var(--ds-black)]"
          />
          <p className="text-[9px] opacity-40 mt-1">
            Vul dit in als je wilt dat we contact met je opnemen over je melding.
          </p>
        </div>

        {/* Feedback Message */}
        <div className="bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] p-4 flex-1 flex flex-col min-h-[200px]">
          <label htmlFor="message" className="text-[9px] font-bold opacity-50 uppercase tracking-widest block mb-2">
            JE BERICHT (VERPLICHT)
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
            className="w-full flex-1 bg-[var(--ds-white)] border-[3px] border-[var(--ds-black)] px-3 py-2 outline-none font-bold text-sm placeholder:opacity-30 text-[var(--ds-black)] resize-none"
          />
        </div>

        {/* Submit Results */}
        {submitResult && (
          <div
            className={`border-[3px] border-[var(--ds-black)] p-4 font-bold text-xs ${
              submitResult.success
                ? "bg-[var(--ds-green)] text-[var(--ds-white)]"
                : "bg-[var(--ds-red)] text-[var(--ds-white)]"
            }`}
          >
            {submitResult.msg}
          </div>
        )}

        {/* Development Instruction warning if API key is not yet set */}
        {!web3formsKey && (
          <div className="bg-[var(--ds-gray)] border-[3px] border-[var(--ds-black)] p-3 text-[10px] text-[var(--ds-black)] opacity-70">
            <span className="font-bold">Ontwikkelaarsnotitie:</span> Om echte e-mails te ontvangen, maak je een gratis key aan op{" "}
            <a
              href="https://web3forms.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-[var(--ds-blue)]"
            >
              web3forms.com
            </a>{" "}
            en voeg deze toe aan <code className="bg-white px-1">.env.local</code> als:
            <pre className="mt-1 font-mono text-[9px] bg-white p-1 select-all overflow-x-auto">
              NEXT_PUBLIC_WEB3FORMS_KEY=your_key_here
            </pre>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="w-full bg-[var(--ds-black)] text-[var(--ds-white)] py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer border-none mb-4"
        >
          {isSubmitting ? "VERZENDEN..." : "FEEDBACK VERZENDEN"}
        </button>

      </form>
    </div>
  );
}
