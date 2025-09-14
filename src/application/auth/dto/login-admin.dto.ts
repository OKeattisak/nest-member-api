export interface LoginAdminRequest {
  username: string;
  password: string;
}

export interface LoginAdminResponse {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    username: string;
    role: string;
  };
}