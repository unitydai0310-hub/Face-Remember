"use client";

import { useState } from "react";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroup } from "@/app/actions";

export default function CreatePage() {
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("image", selectedFile);
      
      await createGroup(formData);
      // createGroup redirects, so we don't need to manually push
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        ダッシュボードに戻る
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>新しい思い出グループを作成</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">グループ名</Label>
              <Input
                id="name"
                placeholder="例：2024年 夏合宿"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>集合写真</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-secondary/20 transition-colors cursor-pointer relative overflow-hidden group">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required={!imagePreview}
                />
                
                {imagePreview ? (
                  <div className="relative w-full aspect-video">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-md" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                      写真を変更
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <Upload className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm font-medium">クリックしてアップロード<br/>またはドラッグ＆ドロップ</p>
                    <p className="text-xs mt-2">PNG, JPG (10MBまで)</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" type="button">キャンセル</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || !name || !imagePreview}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              作成する
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
