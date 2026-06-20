import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages, scenario, targetSentences } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API anahtarı bulunamadı (.env dosyasını kontrol edin)." },
        { status: 500 }
      );
    }

    // Gemini API formatına dönüştür
    // Gelen mesaj formatı: { role: 'user' | 'assistant', content: string }
    // Gemini formatı: { role: 'user' | 'model', parts: [{ text: string }] }
    let formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Gemini API kuralları gereği sohbet geçmişi her zaman bir 'user' mesajıyla başlamalıdır.
    if (formattedContents.length > 0 && formattedContents[0].role === "model") {
      formattedContents.shift();
    }

    let systemInstruction = `Sen cana yakın bir Hollandaca öğretmenisin. Kullanıcıyla A1/A2 seviyesinde Hollandaca sohbet et.
Sana kullanıcının girdiği son cümle ve konuşmanın geçmişi gelecek.
Kullanıcının gönderdiği son cümleyi dil bilgisi, yazım kuralları ve özellikle Hollandaca kelime sırası (woordvolgorde - fiilin yeri, zaman zarflarının yeri vb.) açısından kontrol et.
Eğer kullanıcının son cümlesinde hata varsa, "analysis.hasError" değerini true yap, hatayı Türkçe olarak detaylı, samimi ve öğretici bir şekilde "analysis.explanation" alanında açıkla ve cümlenin tamamen doğru halini "analysis.corrected" alanına yaz.
Eğer kullanıcının son cümlesi tamamen doğruysa "analysis.hasError" değerini false yap, diğer analiz alanlarını boş bırak.
Hollandaca olarak vereceğin cevabı ise "reply" alanına yaz. Hollandaca cevabın her zaman kısa, anlaşılır ve A1/A2 seviyesinde olsun. Kullanıcıya bir soru sorarak veya sohbeti devam ettirecek bir cümle kurarak konuşmayı uzat.
Seçilen senaryoya sadık kal. Aktif senaryo: "${scenario || 'Serbest Sohbet'}".`;

    if (targetSentences && targetSentences.length > 0) {
      const targetsStr = targetSentences.map((s: any) => `- "${s.nl}" (Türkçe anlamı: ${s.tr})`).join("\n");
      systemInstruction += `\n\nBu sohbette kullanıcının şu Hollandaca cümleleri öğrenmesi hedeflenmektedir:\n${targetsStr}\nLütfen konuşmayı öyle yönlendir ki kullanıcı bu cümleleri (veya benzer yapıları) kurmaya teşvik edilsin. Kullanıcı bu hedef cümlelerden birini veya çok benzerini kurarsa, Hollandaca cevabının başında onu tebrik et. Ayrıca konuşma sırasında bu cümleleri kendi cevaplarında da doğal bir şekilde kullanmaya çalış.`;
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
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json(
        { error: `Gemini API hatası: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json(
        { error: "Gemini API boş yanıt döndürdü." },
        { status: 500 }
      );
    }

    const parsedResult = JSON.parse(resultText);
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Bilinmeyen bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
