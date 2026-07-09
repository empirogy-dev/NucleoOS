export interface Palette {
  key: string;
  name: string;
  /** [fondo, principal, secundario, texto, acento] */
  dots: [string, string, string, string, string];
}

export const PALETTES: Palette[] = [
  { key: "salvia", name: "Verde salvia", dots: ["#F7F3EA", "#8FAF9B", "#C7D7C2", "#2F3A35", "#D9A38F"] },
  { key: "niebla", name: "Azul niebla", dots: ["#FAFAF7", "#A9C7D8", "#DCEBF2", "#263B45", "#E8D9C5"] },
  { key: "lavanda", name: "Lavanda", dots: ["#F5F4F8", "#B8A9D9", "#E3DDF2", "#373142", "#E6B8C4"] },
  { key: "arena", name: "Arena + azul", dots: ["#F3EDE2", "#4E7C90", "#D8CFC0", "#24292B", "#8AA399"] },
  { key: "menta", name: "Menta suave", dots: ["#FBFDFB", "#8FCBB5", "#D6F0E7", "#243C35", "#E7B487"] },
  { key: "rosa", name: "Rosa polvo", dots: ["#F8F1EA", "#D9A7A0", "#F0D6D2", "#3B2F2C", "#A8B89E"] },
  { key: "cielo", name: "Azul cielo", dots: ["#F2F8FA", "#8FBED0", "#9DBEAE", "#2C3E45", "#E7CE8C"] },
  { key: "verdemono", name: "Verde suave", dots: ["#F3F8F4", "#78A88C", "#CFE3D5", "#1F3A2E", "#BFD89E"] },
  { key: "azulgris", name: "Azul grisáceo", dots: ["#F1F5F7", "#7FA6B8", "#C8C3E0", "#25323A", "#D8AFC0"] },
  { key: "tierra", name: "Tierra suave", dots: ["#FAF4E8", "#8E9F7D", "#D8B59C", "#342C24", "#D9C178"] },
];

export const DEFAULT_PALETTE = "salvia";
