import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export const models = {
  pro: "gemini-3.1-pro-preview",
  flash: "gemini-3-flash-preview",
  lite: "gemini-3.1-flash-lite-preview",
  image: "gemini-3.1-flash-image-preview",
  imagePro: "gemini-3-pro-image-preview",
  video: "veo-3.1-fast-generate-preview",
  music: "lyria-3-clip-preview",
  tts: "gemini-2.5-flash-preview-tts",
};

export async function chatWithGemini(message: string, history: any[] = [], systemInstruction?: string) {
  const chat = ai.chats.create({
    model: models.flash,
    config: {
      systemInstruction,
    },
  });

  // Convert history to Gemini format if needed, but sendMessage only takes message
  // For multi-turn, we'd typically use the chat object's history
  const response = await chat.sendMessage({ message });
  return response;
}

export async function searchGrounding(query: string) {
  const response = await ai.models.generateContent({
    model: models.flash,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response;
}

export async function mapsGrounding(query: string, location?: { latitude: number; longitude: number }) {
  const response = await ai.models.generateContent({
    model: models.flash,
    contents: query,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: location ? {
        retrievalConfig: {
          latLng: location
        }
      } : undefined
    },
  });
  return response;
}

export async function analyzeImage(imagePrompt: string, base64Image: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: models.pro,
    contents: {
      parts: [
        { text: imagePrompt },
        { inlineData: { data: base64Image, mimeType } }
      ]
    }
  });
  return response;
}

export async function generateImage(prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") {
  const response = await ai.models.generateContent({
    model: models.image,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: imageSize as any
      }
    }
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateVideo(prompt: string, aspectRatio: string = "16:9", resolution: string = "1080p") {
  let operation = await ai.models.generateVideos({
    model: models.video,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution as any,
      aspectRatio: aspectRatio as any
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(downloadLink!, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey!,
    },
  });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function generateMusic(prompt: string) {
  const response = await ai.models.generateContentStream({
    model: models.music,
    contents: prompt,
  });

  let audioBase64 = "";
  let mimeType = "audio/wav";

  for await (const chunk of response) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.inlineData?.data) {
        if (!audioBase64 && part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        audioBase64 += part.inlineData.data;
      }
    }
  }

  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export async function textToSpeech(text: string, voice: string = "Kore") {
  const response = await ai.models.generateContent({
    model: models.tts,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
  return null;
}

export async function complexReasoning(query: string) {
  const response = await ai.models.generateContent({
    model: models.pro,
    contents: query,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });
  return response;
}

export async function validateConfig(config: string) {
  const response = await ai.models.generateContent({
    model: models.pro,
    contents: `Validate the following Cisco IOS configuration snippet for potential errors or security best practices:\n\n${config}`,
    config: {
      systemInstruction: "You are a network security expert. Provide a concise analysis of the configuration, highlighting any security risks or syntax errors.",
    },
  });
  return response.text;
}
