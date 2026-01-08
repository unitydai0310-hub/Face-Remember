"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { put } from "@vercel/blob";

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;
  const imageFile = formData.get("image") as File;

  if (!name || !imageFile) {
    throw new Error("Missing required fields");
  }

  // Upload to Vercel Blob
  const blob = await put(imageFile.name, imageFile, {
    access: "public",
  });

  await prisma.group.create({
    data: {
      name,
      imageUrl: blob.url,
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function addMember(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const groupId = formData.get("groupId") as string;

  if (!name || !groupId) {
    throw new Error("Missing required fields");
  }

  await prisma.member.create({
    data: {
      name,
      description,
      groupId,
    },
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function getGroups() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
  });
  return groups;
}

export async function getGroupById(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });
  return group;
}

export async function askAIAction(groupId: string, formData: FormData) {
  console.log("--- askAIAction Started (Vercel Blob Mode) ---");
  const imageFile = formData.get("image") as File | null;
  const promptText = formData.get("prompt") as string || "";

  if (!imageFile && !promptText) {
    return { message: "画像または質問を入力してください。" };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group || group.members.length === 0) {
    return { message: "グループ情報が見つかりません、またはメンバーがいません。" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { message: "システムエラー: AIのAPIキーが設定されていません。" };
  }

  try {
    // 2. Fetch Group Image from Vercel Blob (URL)
    // We need to fetch the image via URL and convert to base64 for Gemini
    console.log("Fetching group image from URL:", group.imageUrl);
    const groupImageRes = await fetch(group.imageUrl);
    if (!groupImageRes.ok) {
        return { message: "エラー: グループ写真の取得に失敗しました。" };
    }
    const groupImageBuffer = await groupImageRes.arrayBuffer();
    const groupImageBase64 = Buffer.from(groupImageBuffer).toString("base64");
    const groupMimeType = groupImageRes.headers.get("content-type") || "image/png";

    const membersList = group.members.map(m => `- Name: ${m.name}, Description: ${m.description || "None"}`).join("\n");
    const genAI = new GoogleGenerativeAI(apiKey);
    // User requested gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Mode Selection
    if (imageFile) {
        // --- IDENTIFICATION MODE ---
        console.log("Mode: Identification");
        const targetBuffer = await imageFile.arrayBuffer();
        const targetImageBase64 = Buffer.from(targetBuffer).toString("base64");

        const prompt = `
        You are an expert at identifying people in photos.
        I will provide two images:
        1. A group photo containing multiple people.
        2. A target individual photo (a crop or separate photo of one person).
        
        Member List:
        ${membersList}
        
        User Question/Hint: "${promptText}"
        
        Task:
        Identify which member from the list matches the person in the "target individual photo".
        If the user provided a question, answer it in the context of this person.
        
        Return a JSON object:
        {
          "matchedMemberName": "Name or null",
          "reply": "A natural Japanese response explaining who it is and why, or answering the question."
        }
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: groupImageBase64, mimeType: groupMimeType } },
            { inlineData: { data: targetImageBase64, mimeType: imageFile.type } }
        ]);
        
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const member = group.members.find(m => m.name === parsed.matchedMemberName);
            return {
                message: parsed.reply || "解析結果を取得できませんでした。",
                member: member || undefined
            };
        } else {
            return { message: "AIからの応答を解析できませんでした。" };
        }

    } else {
        // --- Q&A MODE ---
        console.log("Mode: Q&A");
        const prompt = `
        You are an assistant for a group memory app.
        I will provide a group photo and a list of members.
        
        Member List:
        ${membersList}
        
        User Question: "${promptText}"
        
        Task:
        Answer the user's question based on the visual information in the group photo and the member list.
        Reply in natural Japanese.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: groupImageBase64, mimeType: groupMimeType } }
        ]);

        return { message: result.response.text() };
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { message: "AIの処理中にエラーが発生しました。" };
  }
}
