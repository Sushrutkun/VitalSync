import { request } from "../lib/api";
import type { UpdateProfileRequest, UserProfile } from "../types/api";

export const usersApi = {
  me(): Promise<UserProfile> {
    return request<UserProfile>("/api/v1/users/me");
  },
  updateMe(patch: UpdateProfileRequest): Promise<UserProfile> {
    return request<UserProfile>("/api/v1/users/me", {
      method: "PATCH",
      body: patch,
    });
  },
};
