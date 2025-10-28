
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Chat } from "@google/genai";
import { Message, Role } from './types';
import ChatInterface from './components/ChatInterface';
import { SYSTEM_INSTRUCTION } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: Role.AI,
      text: "Hello! I'm your Socratic math tutor. Please upload a photo of a calculus or algebra problem, and I'll help you work through the first step.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);

  const initializeChat = useCallback(() => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });
      chatRef.current = chat;
    } catch (error) {
      console.error("Failed to initialize Gemini chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-init',
          role: Role.AI,
          text: "I'm sorry, there was an error connecting to my brain. Please check the API key and refresh the page.",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [mimePart, base64Part] = result.split(';base64,');
        const mimeType = mimePart.split(':')[1];
        resolve({ mimeType, data: base64Part });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if ((!text && !imageFile) || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
    };
    
    let imagePart = null;
    let base64DataUrl = null;

    if (imageFile) {
        try {
            const { mimeType, data } = await fileToBase64(imageFile);
            imagePart = { inlineData: { mimeType, data } };
            base64DataUrl = `data:${mimeType};base64,${data}`;
            userMessage.image = base64DataUrl;
        } catch (error) {
            console.error("Error converting file to base64:", error);
            setMessages((prev) => [...prev, {
                id: 'error-file',
                role: Role.AI,
                text: "I'm sorry, I had trouble reading that image file. Please try another one."
            }]);
            setIsLoading(false);
            return;
        }
    }
    
    setMessages((prev) => [...prev, userMessage]);

    try {
      if (!chatRef.current) {
        throw new Error("Chat is not initialized.");
      }
      
      const promptParts: (string | { inlineData: { mimeType: string; data: string }})[] = [];
      if (imagePart) {
          promptParts.push(imagePart);
      }
      // Add text only if it provides context, especially for the first image upload.
      if (text || imagePart) {
         promptParts.push(text || "Here is the problem. Please guide me through the first step.");
      }

      const response = await chatRef.current.sendMessage({
        contents: { parts: promptParts.map(p => typeof p === 'string' ? { text: p } : p) },
      });
      
      const aiResponseText = response.text;
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.AI,
        text: aiResponseText || "I'm not sure how to respond to that. Could you rephrase?",
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      setMessages((prev) => [...prev, {
          id: 'error-send',
          role: Role.AI,
          text: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4">
        <h1 className="text-xl md:text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Socratic Math Tutor
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Your compassionate AI guide for Calculus & Algebra</p>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
};

export default App;
