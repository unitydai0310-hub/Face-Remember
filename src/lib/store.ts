export interface Member {
  id: string;
  name: string;
  description: string;
}

export interface Group {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  members: Member[];
}

// Initial mock data
let groups: Group[] = [];

export const getGroups = async (): Promise<Group[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(groups));
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const g = groups.find((g) => g.id === id);
  return g ? JSON.parse(JSON.stringify(g)) : undefined;
};

export const createGroup = async (name: string, imageUrl: string): Promise<Group> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newGroup: Group = {
    id: Date.now().toString() + "-" + Math.random().toString(36).substring(7),
    name,
    imageUrl,
    createdAt: new Date().toISOString(),
    members: [],
  };
  groups = [newGroup, ...groups];
  return JSON.parse(JSON.stringify(newGroup));
};

export const addMemberToGroup = async (groupId: string, member: Omit<Member, "id">): Promise<Member> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const group = groups.find((g) => g.id === groupId);
  if (!group) throw new Error("Group not found");

  const newMember: Member = {
    id: Date.now().toString() + "-" + Math.random().toString(36).substring(7),
    ...member,
  };
  group.members.push(newMember);
  return newMember;
};

export const identifyMember = async (groupId: string, photoUrl: string): Promise<Member | null> => {
   // Mock AI Identification
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const group = groups.find((g) => g.id === groupId);
   if (!group || group.members.length === 0) return null;
   
   // Randomly return a member or null to simulate AI matching
   // For demo purposes, we will return the first member if available
   const randomMember = group.members[Math.floor(Math.random() * group.members.length)];
   return randomMember || null;
};
