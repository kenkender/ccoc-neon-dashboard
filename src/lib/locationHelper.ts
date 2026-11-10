export const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กรุงเทพ", "กทม",
  "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
  "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด",
  "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
  "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "อยุธยา", "พังงา", "พัทลุง", "พิจิตร",
  "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร",
  "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี",
  "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ",
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

export function isThaiProvince(name: string): boolean {
  if (!name) return false;
  const clean = name.replace(/^จ(?:ังหวัด|\.)\s*/, "").trim();
  return THAI_PROVINCES.some(p => clean === p || clean.startsWith(p) || p.startsWith(clean));
}

export function formatProvinceName(prov: string): string {
  if (!prov || prov === "-") return "-";
  const clean = prov.trim();
  if (clean.startsWith("จ.") || clean.startsWith("จังหวัด")) {
    return clean.startsWith("จังหวัด") ? clean.replace(/^จังหวัด\s*/, "จ.") : clean;
  }
  if (isThaiProvince(clean)) {
    return `จ.${clean}`;
  }
  // Not a Thai province (e.g. landmark, station, or agency name)
  return clean;
}

export function formatLocationAndProvince(rawLoc: any, rawProv: any): { coordinatesStr: string; locationStr: string } {
  const loc = rawLoc ? String(rawLoc).trim() : "";
  const prov = rawProv ? String(rawProv).trim() : "";

  let coordinatesStr = "-";
  let locationStr = "-";

  if (loc && prov && loc !== prov) {
    coordinatesStr = loc;
    locationStr = formatProvinceName(prov);
  } else if (prov) {
    if (prov.includes("จ.")) {
      const parts = prov.split(/จ\./);
      if (parts[0].trim()) {
        coordinatesStr = parts[0].trim();
        locationStr = `จ.${parts[1].trim()}`;
      } else {
        coordinatesStr = "-";
        locationStr = formatProvinceName(prov);
      }
    } else {
      // Check if prov is actually a province
      if (isThaiProvince(prov)) {
        coordinatesStr = "-";
        locationStr = formatProvinceName(prov);
      } else {
        // User typed a landmark/agency into province field!
        coordinatesStr = "-";
        locationStr = prov; // Do NOT prefix with จ.!
      }
    }
  } else if (loc) {
    if (isThaiProvince(loc)) {
      coordinatesStr = "-";
      locationStr = formatProvinceName(loc);
    } else {
      coordinatesStr = loc;
      locationStr = "-";
    }
  }

  return { coordinatesStr, locationStr };
}
