export interface IDebate {
  title: string;
  description: string;
  tags: string[];
  category: string;
  duration: number;
  status: "Active" | "Closed";
  authorEmail: string;
}
