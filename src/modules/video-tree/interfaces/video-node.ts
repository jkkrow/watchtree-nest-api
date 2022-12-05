export class IVideoNode {
  id: string;
  name: string;
  url: string;
  label: string;
  level: number;
  size: number;
  duration: number;
  selectionTimeStart: number;
  selectionTimeEnd: number;
  children: IVideoNode[];
}