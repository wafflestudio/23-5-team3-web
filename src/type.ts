export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Post {
  id: string;
  companyName: string;
  profileImageKey: string;
  employmentEndDate: string;
  positionTitle: string;
  domain: string;
  detailSummary: string;
  positionType: string;
  isBookmarked: boolean;
}
