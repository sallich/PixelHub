export interface PixelDto {
  x: number;
  y: number;
  c: number;
}

export interface BoardResponse {
  pixels: PixelDto[];
}

export interface UserDto {
  nickname: string;
  pixelCount: number;
}

export interface LeaderBoardResponse {
  users: UserDto[];
}

export interface TokenDto {
  nickname: string;
  token: string;
}

export interface ErrorDto {
  message: string;
  timestamp: string;
}


