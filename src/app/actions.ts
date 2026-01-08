"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;
  const imageFile = formData.get("image") as File;

  if (!name || !imageFile) {
    throw new Error("Missing required fields");
  }

  const buffer = await imageFile.arrayBuffer();
  const base64Image = `data:${imageFile.type};base64,${Buffer.from(buffer).toString("base64")}`;

  await prisma.group.create({
    data: {
      name,
      imageUrl: base64Image,
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
  console.log("--- askAIAction Started (Strict Mode) ---");
  const imageFile = formData.get("image") as File | null;
  const promptText = formData.get("prompt") as string || "";

  if (!imageFile && !promptText) {
    return { message: "画像または質問を入力してください。" };
  }

  // 1. Fetch Group Data
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    return { message: "グループ情報が見つかりません。" };
  }
  if (group.members.length === 0) {
      return { message: "このグループにはメンバーが登録されていません。" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key Missing");
    // Return honest error
    return { message: "システムエラー: AIのAPIキーが設定されていません。" };
  }

  try {
    // 2. Prepare Group Image
    const groupImageParts = group.imageUrl.split(",");
    if (groupImageParts.length !== 2) {
        return { message: "エラー: グループ写真のデータが破損しています。" };
    }
    const groupImageBase64 = groupImageParts[1];
    const groupMimeType = groupImageParts[0].match(/:(.*?);/)?.[1] || "image/png";

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
        
        If you cannot identify the person with confidence, set "matchedMemberName" to null and explain why in "reply" (e.g., "Not found in member list", "Image too blurry").
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: groupImageBase64, mimeType: groupMimeType } },
            { inlineData: { data: targetImageBase64, mimeType: imageFile.type } }
        ]);
        
        const responseText = result.response.text();
        console.log("Gemini Ident Response:", responseText);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const member = group.members.find(m => m.name === parsed.matchedMemberName);
            
            // Allow returning the message even if member is not found (AI explanation)
            return {
                message: parsed.reply || "解析結果を取得できませんでした。",
                member: member || undefined
            };
        } else {
            console.warn("Invalid JSON from AI");
            return { message: "AIからの応答を解析できませんでした。" };
        }

    } else {
        // --- Q&A MODE (Text Only) ---
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
        If you cannot answer, honestly state that you don't know.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: groupImageBase64, mimeType: groupMimeType } }
        ]);

        const responseText = result.response.text();
        console.log("Gemini Q&A Response:", responseText);
        return { message: responseText };
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Explicitly returning error message instead of fallback
    return { message: "AIの処理中にエラーが発生しました。しばらく待ってから再度お試しください。" };
  }
}
