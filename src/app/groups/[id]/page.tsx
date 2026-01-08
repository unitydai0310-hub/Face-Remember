"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGroupById, addMember } from "@/app/actions";
import { Chat } from "./chat";

interface Member {
  id: string;
  name: string;
  description: string | null;
}

interface Group {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
  members: Member[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [memberName, setMemberName] = useState("");
  const [memberDesc, setMemberDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch logic using Server Actions
  const fetchData = async () => {
    if (id) {
       const data = await getGroupById(id);
       if (data) {
          // @ts-ignore
          setGroup(data);
       } else {
          router.push("/dashboard");
       }
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !memberName) return;

    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", memberName);
      formData.append("description", memberDesc);
      formData.append("groupId", group.id);
      
      await addMember(formData);
      
      // Refresh data
      // router.refresh() works well with Server Components, but we are fetching manually in useEffect (Client)
      // so we call fetchData() again or just reload window
      await fetchData();
      
      setMemberName("");
      setMemberDesc("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-20 text-center">読み込み中...</div>;
  }

  if (!group) return null;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ダッシュボードに戻る
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-start">
             <h1 className="text-3xl font-bold">{group.name}</h1>
             <div className="text-sm text-muted-foreground">
               作成日: {new Date(group.createdAt).toLocaleDateString("ja-JP")}
             </div>
          </div>
          
          <div className="rounded-lg overflow-hidden border bg-muted relative">
            <img 
              src={group.imageUrl} 
              alt={group.name}
              className="w-full h-auto max-h-[500px] object-contain mx-auto"
            />
          </div>

          <Chat groupId={group.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>メンバーの登録</CardTitle>
              <CardDescription>
                写真に写っている人の名前と特徴を教えてください。AI識別のヒントになります。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberName">名前</Label>
                  <Input 
                    id="memberName" 
                    placeholder="例：田中くん" 
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberDesc">特徴 (AI識別用)</Label>
                  <Input 
                    id="memberDesc" 
                    placeholder="例：右から2番目、赤い帽子" 
                    value={memberDesc}
                    onChange={(e) => setMemberDesc(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isAdding || !memberName}>
                  <Plus className="mr-2 h-4 w-4" />
                  メンバーを追加
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>登録済みメンバー ({group.members.length}人)</CardTitle>
            </CardHeader>
            <CardContent>
              {group.members.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  まだメンバーが登録されていません
                </div>
              ) : (
                <div className="space-y-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.description && (
                          <div className="text-xs text-muted-foreground">{member.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
