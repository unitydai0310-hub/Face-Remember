"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroups } from "@/app/actions";
import { UserButton } from "@clerk/nextjs";

// Define a minimal interface for what we expect from the server action
interface Group {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Adding a timeout to prevent infinite loading state perception if server hangs
    const timeoutId = setTimeout(() => {
        if (loading) setLoading(false);
    }, 10000); // 10s timeout safety

    getGroups()
      .then((data) => {
        // @ts-ignore
        setGroups(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch groups:", err);
        setError("データの取得に失敗しました。しばらく経ってから再読み込みしてください。");
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(timeoutId);
      });
      
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">思い出のアルバム</h1>
        <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/"/>
            <Link href="/create">
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                新しい集合写真
            </Button>
            </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p>読み込み中...</p>
        </div>
      ) : groups.length === 0 && !error ? (
        <div className="text-center py-20 border rounded-lg bg-secondary/10">
          <h2 className="text-xl font-semibold mb-2">まだ思い出がありません</h2>
          <p className="text-muted-foreground mb-6">最初の集合写真をアップロードして始めましょう。</p>
          <Link href="/create">
            <Button variant="secondary">グループを作成</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group h-full">
                <div className="aspect-video relative bg-muted">
                  <img 
                    src={group.imageUrl} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{group.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                  作成日: {new Date(group.createdAt).toLocaleDateString("ja-JP")}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
