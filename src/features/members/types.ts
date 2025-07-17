import { Models } from "node-appwrite";

export enum MemberRole {
    ADMIN = "ADMIN",
    MEMBER ="MEMBER"
};

export type Member = Models.Document & {
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER"; // required
  speciality: string;        // required
};
