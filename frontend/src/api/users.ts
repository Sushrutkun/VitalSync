import { request } from "../lib/api";
import type { UpdateProfileRequest, UserProfile } from "../types/api";

export const usersApi = {
  me(): Promise<UserProfile> {
    return request<UserProfile>("/users/me");
  },
  updateMe(patch: UpdateProfileRequest): Promise<UserProfile> {
    return request<UserProfile>("/users/me", {
      method: "PATCH",
      body: patch,
    });
  },
};
