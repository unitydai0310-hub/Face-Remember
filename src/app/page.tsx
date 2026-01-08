import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-20 text-center text-foreground">
      <main className="flex flex-col gap-8 items-center max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
          Face Memory
        </h1>
        <p className="text-xl text-neutral-400">
          集合写真をアップロードして、思い出を整理しましょう。<br />
          AIが友達を識別して、あなたの質問に答えてくれます。
        </p>

        <div className="flex gap-4 mt-8">
          <SignedOut>
            <SignInButton mode="modal">
                <button className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition">
                はじめる（ログイン）
                </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
                <button className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition">
                ダッシュボードへ
                </button>
            </Link>
          </SignedIn>
          
          <button className="px-6 py-3 rounded-full border border-neutral-700 hover:bg-neutral-900 transition">
            詳しく見る
          </button>
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 w-full backdrop-blur-xl">
           <div className="text-neutral-500 text-sm mb-4 uppercase tracking-wider font-mono">質問の例</div>
           <div className="flex flex-col gap-4 text-left">
             <div className="bg-neutral-800/50 p-3 rounded-lg self-end max-w-[80%]">
               「右から2番目の人は誰？」
             </div>
             <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200 p-3 rounded-lg self-start max-w-[80%]">
               「それはカイトくんです。写真とハイキングが趣味です。」
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}
