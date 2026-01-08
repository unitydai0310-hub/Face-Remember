"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { askAIAction } from "@/app/actions";

interface ChatProps {
  groupId: string;
}

interface Message {
  role: "user" | "ai";
  content: string;
  image?: string;
}

export function Chat({ groupId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "この写真について何でも聞いてください。「この人は誰？」と聞いたり、個人の写真をアップロードして特定することもできます。" }
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      formData.append("prompt", userMessage.content);

      const response = await askAIAction(groupId, formData);
      
      setMessages((prev) => [...prev, { role: "ai", content: response.message }]);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "ai", content: "エラーが発生しました。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col mt-6">
      <CardHeader>
        <CardTitle>AI アシスタント</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.image && (
                <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded mb-2 border border-white/20" />
              )}
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">AIが考え中...</span>
            </div>
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded border" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setSelectedFile(null);
              }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageSelect}
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1"
          />
          <Button type="submit" disabled={(!input && !selectedImage) || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
