"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroups } from "@/app/actions";

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

  useEffect(() => {
    getGroups().then((data) => {
      // @ts-ignore: Prisma/Server Action serialization type mismatch handling
      setGroups(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">思い出のアルバム</h1>
        <Link href="/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新しい集合写真
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">読み込み中...</div>
      ) : groups.length === 0 ? (
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
