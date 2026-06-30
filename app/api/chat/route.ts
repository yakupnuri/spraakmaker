import { NextResponse } from "next/server";

// Groq API Çağrısı (Ana Motor)
async function callGroq(apiKey: string, messages: any[], systemInstruction: string) {
  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }))
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Boş yanıt döndü.");
  }
  return JSON.parse(content);
}

// Gemini API Çağrısı (1. Yedek Motor)
async function callGemini(apiKey: string, messages: any[], systemInstruction: string) {
  let formattedContents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (formattedContents.length > 0 && formattedContents[0].role === "model") {
    formattedContents.shift();
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" },
              analysis: {
                type: "OBJECT",
                properties: {
                  hasError: { type: "BOOLEAN" },
                  explanation: { type: "STRING" },
                  corrected: { type: "STRING" }
                },
                required: ["hasError", "explanation", "corrected"]
              }
            },
            required: ["reply", "analysis"]
          }
        },
        systemInstruction: {
          parts: [
            {
              text: systemInstruction
            }
          ]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    throw new Error("Boş yanıt döndü.");
  }
  return JSON.parse(resultText);
}

// OpenRouter API Çağrısı (2. Yedek Motor - Ücretsiz Model)
async function callOpenRouter(apiKey: string, messages: any[], systemInstruction: string) {
  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }))
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Spraakmaker",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free", // OpenRouter Ücretsiz Llama 3.3 70B modeli
      messages: formattedMessages,
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Boş yanıt döndü.");
  }
  return JSON.parse(content);
}

export async function POST(request: Request) {
  try {
    const { messages, scenario, targetSentences } = await request.json();

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!groqKey && !geminiKey && !openrouterKey) {
      return NextResponse.json(
        { error: "API anahtarı bulunamadı (.env dosyasını kontrol edin)." },
        { status: 500 }
      );
    }

    let systemInstruction = `Sen cana yakın bir Hollandaca öğretmenisin. Kullanıcıyla A1/A2 seviyesinde Hollandaca sohbet et.
Sana kullanıcının girdiği son cümle ve konuşmanın geçmişi gelecek.
Kullanıcının gönderdiği son cümleyi dil bilgisi, yazım kuralları ve özellikle Hollandaca kelime sırası (woordvolgorde - fiilin yeri, zaman zarflarının yeri vb.) açısından kontrol et.
Eğer kullanıcının son cümlesinde hata varsa, "analysis.hasError" değerini true yap, hatayı Türkçe olarak detaylı, samimi ve öğretici bir şekilde "analysis.explanation" alanında açıkla ve cümlenin tamamen doğru halini "analysis.corrected" alanına yaz.
Eğer kullanıcının son cümlesi tamamen doğruysa "analysis.hasError" değerini false yap, diğer analiz alanlarını boş bırak (boş string olarak: explanation: "", corrected: "").
Hollandaca olarak vereceğin cevabı ise "reply" alanına yaz. Hollandaca cevabın her zaman kısa, anlaşılır ve A1/A2 seviyesinde olsun. Kullanıcıya bir soru sorarak veya sohbeti devam ettirecek bir cümle kurarak konuşmayı uzat.

Döneceğin JSON formatı kesinlikle şu şemaya uymalıdır:
{
  "reply": "Hollandaca cevabınız",
  "analysis": {
    "hasError": true/false,
    "explanation": "Türkçe hata açıklaması veya boş string",
    "corrected": "Cümlenin doğru hali veya boş string"
  }
}
Seçilen senaryoya sadık kal. Aktif senaryo: "${scenario || 'Serbest Sohbet'}".`;

    if (targetSentences && targetSentences.length > 0) {
      const targetsStr = targetSentences.map((s: any) => `- "${s.nl}" (Türkçe anlamı: ${s.tr})`).join("\n");
      systemInstruction += `\n\nBu sohbette kullanıcının şu Hollandaca cümleleri öğrenmesi hedeflenmektedir:\n${targetsStr}\nLütfen konuşmayı öyle yönlendir ki kullanıcı bu cümleleri (veya benzer yapıları) kurmaya teşvik edilsin. Kullanıcı bu hedef cümlelerden birini veya çok benzerini kurarsa, Hollandaca cevabının başında onu tebrik et. Ayrıca konuşma sırasında bu cümleleri kendi cevaplarında da doğal bir şekilde kullanmaya çalış.`;
    }

    let resultJson = null;
    let errors: string[] = [];

    // 1. Adım: Öncelikli olarak Groq API ile dene (Ana Motor)
    if (groqKey) {
      try {
        console.log("Calling Groq API (Ana Motor)...");
        resultJson = await callGroq(groqKey, messages, systemInstruction);
      } catch (err: any) {
        console.error("Groq API failed. Falling back to Gemini...", err.message);
        errors.push(`Groq Hatası: ${err.message}`);
      }
    }

    // 2. Adım: Groq başarısız olduysa veya anahtar yoksa Gemini API ile dene (1. Yedek Motor)
    if (!resultJson && geminiKey) {
      try {
        console.log("Calling Gemini API (1. Yedek Motor)...");
        resultJson = await callGemini(geminiKey, messages, systemInstruction);
      } catch (err: any) {
        console.error("Gemini API fallback failed. Falling back to OpenRouter...", err.message);
        errors.push(`Gemini Hatası: ${err.message}`);
      }
    }

    // 3. Adım: Gemini de başarısız olduysa veya anahtar yoksa OpenRouter (Ücretsiz Model) ile dene (2. Yedek Motor)
    if (!resultJson && openrouterKey) {
      try {
        console.log("Calling OpenRouter API (2. Yedek Motor - Ücretsiz Model)...");
        resultJson = await callOpenRouter(openrouterKey, messages, systemInstruction);
      } catch (err: any) {
        console.error("OpenRouter API fallback failed:", err.message);
        errors.push(`OpenRouter Hatası: ${err.message}`);
      }
    }

    // Eğer tüm motorlar başarısız olduysa
    if (!resultJson) {
      return NextResponse.json(
        { error: `Tüm yapay zeka motorları başarısız oldu. Detaylar: ${errors.join(" | ")}` },
        { status: 500 }
      );
    }

    return NextResponse.json(resultJson);
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Bilinmeyen bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
