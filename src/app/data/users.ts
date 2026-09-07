export interface UserAccount {
  username: string;
  password?: string;
  role: "admin" | "user";
  affiliation: string;
  vehicle_id: string;
  unit_name: string;
  vehicle_name?: string;
  vehicle_type: "ALL" | "CCOC Mobile" | "UAV Mobile";
}

export const SYSTEM_USERS: UserAccount[] = [
  // Admin
  { username: "admin", password: "admin", role: "admin", affiliation: "ALL", vehicle_id: "admin", unit_name: "Master Admin", vehicle_name: "Master Admin", vehicle_type: "ALL" },

  // CCOC Mobile (stc accounts, station accounts have vehicle_type = ALL)
  { username: "stc01", password: "ccocmobile01", role: "user", affiliation: "บช.ทท.", vehicle_id: "stc01", unit_name: "บช.ทท.", vehicle_name: "บช.ทท.", vehicle_type: "CCOC Mobile" },
  { username: "stc09", password: "ccocmobile09", role: "user", affiliation: "บก.ทท.1", vehicle_id: "stc09", unit_name: "กก.1 บก.ทท.1 (สนามศุภชลาศัย)", vehicle_name: "กก.1 บก.ทท.1 (สนามศุภชลาศัย)", vehicle_type: "CCOC Mobile" },
  { username: "stc03", password: "ccocmobile03", role: "user", affiliation: "บก.ทท.1", vehicle_id: "stc03", unit_name: "ส.ทท.2 กก.2 บก.ทท.1 (อยุธยา)", vehicle_name: "ส.ทท.2 กก.2 บก.ทท.1 (อยุธยา)", vehicle_type: "ALL" },
  { username: "stc04", password: "ccocmobile04", role: "user", affiliation: "บก.ทท.1", vehicle_id: "stc04", unit_name: "ส.ทท.4 กก.2 บก.ทท.1 (ชลบุรี/พัทยา)", vehicle_name: "ส.ทท.4 กก.2 บก.ทท.1 (ชลบุรี/พัทยา)", vehicle_type: "ALL" },
  { username: "stc05", password: "ccocmobile05", role: "user", affiliation: "บก.ทท.2", vehicle_id: "stc05", unit_name: "ส.ทท.2 กก.1 บก.ทท.2 (นครราชสีมา)", vehicle_name: "ส.ทท.2 กก.1 บก.ทท.2 (นครราชสีมา)", vehicle_type: "ALL" },
  { username: "stc06", password: "ccocmobile06", role: "user", affiliation: "บก.ทท.2", vehicle_id: "stc06", unit_name: "ส.ทท.1 กก.2 บก.ทท.2 (เชียงใหม่)", vehicle_name: "ส.ทท.1 กก.2 บก.ทท.2 (เชียงใหม่)", vehicle_type: "ALL" },
  { username: "stc07", password: "ccocmobile07", role: "user", affiliation: "บก.ทท.2", vehicle_id: "stc07", unit_name: "ส.ทท.1 กก.3 บก.ทท.2 (พิษณุโลก)", vehicle_name: "ส.ทท.1 กก.3 บก.ทท.2 (พิษณุโลก)", vehicle_type: "ALL" },
  { username: "stc08", password: "ccocmobile08", role: "user", affiliation: "บก.ทท.3", vehicle_id: "stc08", unit_name: "ส.ทท.2 กก.1 บก.ทท.3 (ประจวบคีรีขันธ์/หัวหิน)", vehicle_name: "ส.ทท.2 กก.1 บก.ทท.3 (ประจวบคีรีขันธ์/หัวหิน)", vehicle_type: "ALL" },
  { username: "stc02", password: "ccocmobile02", role: "user", affiliation: "บก.ทท.3", vehicle_id: "stc02", unit_name: "ส.ทท.1 กก.2 บก.ทท.3 (ภูเก็ต)", vehicle_name: "ส.ทท.1 กก.2 บก.ทท.3 (ภูเก็ต)", vehicle_type: "ALL" },
  { username: "stc10", password: "ccocmobile10", role: "user", affiliation: "บก.ทท.3", vehicle_id: "stc10", unit_name: "ส.ทท.1 กก.3 บก.ทท.3 (สงขลา/หาดใหญ่)", vehicle_name: "ส.ทท.1 กก.3 บก.ทท.3 (สงขลา/หาดใหญ่)", vehicle_type: "ALL" },

  // UAV Mobile (uav accounts)
  // บช.ทท.
  { username: "uav_bchtt", password: "uav@bchtt", role: "user", affiliation: "บช.ทท.", vehicle_id: "uav_bchtt", unit_name: "บช.ทท. (สายตรวจโดรน)", vehicle_name: "บช.ทท. (สายตรวจโดรน)", vehicle_type: "UAV Mobile" },

  // บก.ทท.1
  { username: "uav002", password: "uav@002", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav002", unit_name: "ส.ทท.1 กก.1 บก.ทท.1 (กรุงเทพเหนือ)", vehicle_name: "ส.ทท.1 กก.1 บก.ทท.1 (กรุงเทพเหนือ)", vehicle_type: "UAV Mobile" },
  { username: "uav008", password: "uav@008", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav008", unit_name: "ส.ทท.2 กก.1 บก.ทท.1 (กรุงเทพใต้)", vehicle_name: "ส.ทท.2 กก.1 บก.ทท.1 (กรุงเทพใต้)", vehicle_type: "UAV Mobile" },
  { username: "uav004", password: "uav@004", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav004", unit_name: "ส.ทท.3 กก.1 บก.ทท.1 (ธนบุรี)", vehicle_name: "ส.ทท.3 กก.1 บก.ทท.1 (ธนบุรี)", vehicle_type: "UAV Mobile" },
  { username: "uav006", password: "uav@006", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav006", unit_name: "ส.ทท.2 กก.2 บก.ทท.1 (ลพบุรี)", vehicle_name: "ส.ทท.2 กก.2 บก.ทท.1 (ลพบุรี)", vehicle_type: "UAV Mobile" },
  { username: "uav007", password: "uav@007", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav007", unit_name: "ส.ทท.3 กก.2 บก.ทท.1 (สระแก้ว)", vehicle_name: "ส.ทท.3 กก.2 บก.ทท.1 (สระแก้ว)", vehicle_type: "UAV Mobile" },
  { username: "uav009", password: "uav@009", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav009", unit_name: "ส.ทท.5 กก.2 บก.ทท.1 (ระยอง)", vehicle_name: "ส.ทท.5 กก.2 บก.ทท.1 (ระยอง)", vehicle_type: "UAV Mobile" },
  { username: "uav010", password: "uav@010", role: "user", affiliation: "บก.ทท.1", vehicle_id: "uav010", unit_name: "ส.ทท.6 กก.2 บก.ทท.1 (ตราด)", vehicle_name: "ส.ทท.6 กก.2 บก.ทท.1 (ตราด)", vehicle_type: "UAV Mobile" },

  // บก.ทท.2
  { username: "uav011", password: "uav@011", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav011", unit_name: "ส.ทท.1 กก.1 บก.ทท.2 (ขอนแก่น)", vehicle_name: "ส.ทท.1 กก.1 บก.ทท.2 (ขอนแก่น)", vehicle_type: "UAV Mobile" },
  { username: "uav025", password: "uav@025", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav025", unit_name: "ส.ทท.3 กก.1 บก.ทท.2 (อุบลราชธานี)", vehicle_name: "ส.ทท.3 กก.1 บก.ทท.2 (อุบลราชธานี)", vehicle_type: "UAV Mobile" },
  { username: "uav001", password: "uav@001", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav001", unit_name: "ส.ทท.4 กก.1 บก.ทท.2 (นครพนม)", vehicle_name: "ส.ทท.4 กก.1 บก.ทท.2 (นครพนม)", vehicle_type: "UAV Mobile" },
  { username: "uav013", password: "uav@013", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav013", unit_name: "ส.ทท.5 กก.1 บก.ทท.2 (อุดรธานี)", vehicle_name: "ส.ทท.5 กก.1 บก.ทท.2 (อุดรธานี)", vehicle_type: "UAV Mobile" },
  { username: "uav028", password: "uav@028", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav028", unit_name: "ส.ทท.6 กก.1 บก.ทท.2 (เลย)", vehicle_name: "ส.ทท.6 กก.1 บก.ทท.2 (เลย)", vehicle_type: "UAV Mobile" },
  { username: "uav026", password: "uav@026", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav026", unit_name: "ส.ทท.2 กก.2 บก.ทท.2 (เชียงราย)", vehicle_name: "ส.ทท.2 กก.2 บก.ทท.2 (เชียงราย)", vehicle_type: "UAV Mobile" },
  { username: "uav003", password: "uav@003", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav003", unit_name: "ส.ทท.3 กก.2 บก.ทท.2 (น่าน)", vehicle_name: "ส.ทท.3 กก.2 บก.ทท.2 (น่าน)", vehicle_type: "UAV Mobile" },
  { username: "uav016", password: "uav@016", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav016", unit_name: "ส.ทท.2 กก.3 บก.ทท.2 (นครสวรรค์)", vehicle_name: "ส.ทท.2 กก.3 บก.ทท.2 (นครสวรรค์)", vehicle_type: "UAV Mobile" },
  { username: "uav017", password: "uav@017", role: "user", affiliation: "บก.ทท.2", vehicle_id: "uav017", unit_name: "ส.ทท.3 กก.3 บก.ทท.2 (ตาก)", vehicle_name: "ส.ทท.3 กก.3 บก.ทท.2 (ตาก)", vehicle_type: "UAV Mobile" },

  // บก.ทท.3
  { username: "uav018", password: "uav@018", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav018", unit_name: "ส.ทท.1 กก.1 บก.ทท.3 (กาญจนบุรี)", vehicle_name: "ส.ทท.1 กก.1 บก.ทท.3 (กาญจนบุรี)", vehicle_type: "UAV Mobile" },
  { username: "uav019", password: "uav@019", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav019", unit_name: "ส.ทท.1 กก.1 บก.ทท.3 (กาญจนบุรี)", vehicle_name: "ส.ทท.1 กก.1 บก.ทท.3 (กาญจนบุรี)", vehicle_type: "UAV Mobile" },
  { username: "uav021", password: "uav@021", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav021", unit_name: "ส.ทท.2 กก.2 บก.ทท.3 (ระนอง)", vehicle_name: "ส.ทท.2 กก.2 บก.ทท.3 (ระนอง)", vehicle_type: "UAV Mobile" },
  { username: "uav022", password: "uav@022", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav022", unit_name: "ส.ทท.3 กก.2 บก.ทท.3 (กระบี่)", vehicle_name: "ส.ทท.3 กก.2 บก.ทท.3 (กระบี่)", vehicle_type: "UAV Mobile" },
  { username: "uav023", password: "uav@023", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav023", unit_name: "ส.ทท.4 กก.2 บก.ทท.3 (สุราษฎร์ธานี)", vehicle_name: "ส.ทท.4 กก.2 บก.ทท.3 (สุราษฎร์ธานี)", vehicle_type: "UAV Mobile" },
  { username: "uavsamui", password: "uav@samui", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uavsamui", unit_name: "ส.ทท.5 กก.2 บก.ทท.3 (เกาะสมุย)", vehicle_name: "ส.ทท.5 กก.2 บก.ทท.3 (เกาะสมุย)", vehicle_type: "UAV Mobile" },
  { username: "uav027", password: "uav@027", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav027", unit_name: "ส.ทท.2 กก.3 บก.ทท.3 (ตรัง)", vehicle_name: "ส.ทท.2 กก.3 บก.ทท.3 (ตรัง)", vehicle_type: "UAV Mobile" },
  { username: "uav005", password: "uav@005", role: "user", affiliation: "บก.ทท.3", vehicle_id: "uav005", unit_name: "ส.ทท.3 กก.3 บก.ทท.3 (นราธิวาส)", vehicle_name: "ส.ทท.3 กก.3 บก.ทท.3 (นราธิวาส)", vehicle_type: "UAV Mobile" },
];

export const VEHICLE_AFFILIATIONS: Record<string, string> = SYSTEM_USERS.reduce((acc, user) => {
  acc[user.username.toLowerCase()] = user.affiliation;
  return acc;
}, {} as Record<string, string>);

export const VEHICLE_UNIT_MAP: Record<string, string> = SYSTEM_USERS.reduce((acc, user) => {
  acc[user.username.toLowerCase()] = user.unit_name;
  return acc;
}, {} as Record<string, string>);

export const VEHICLE_NAMES: Record<string, string> = SYSTEM_USERS.reduce((acc, user) => {
  acc[user.username.toLowerCase()] = `${user.username} ${user.unit_name}`;
  return acc;
}, {
  "uav mobile": "UAV Mobile สายตรวจโดรน",
  "UAV Mobile": "UAV Mobile สายตรวจโดรน",
} as Record<string, string>);

export function findSystemUser(username: string): UserAccount | undefined {
  const clean = String(username || "").trim().toLowerCase();
  return SYSTEM_USERS.find(u => u.username.toLowerCase() === clean);
}

export function enrichUserData(rawUser: any): UserAccount {
  if (!rawUser) return rawUser as any;
  const username = String(rawUser.username || rawUser.vehicle_id || "").trim();
  if (!username) return rawUser as any;

  const sysUser = findSystemUser(username);

  // If user exists in pre-defined SYSTEM_USERS, strictly enforce official Thai unit names & affiliations!
  if (sysUser) {
    const rawAff = String(rawUser.affiliation || "").trim();
    const rawUnit = String(rawUser.unit_name || rawUser.vehicle_name || "").trim();

    // Check if rawUnit is valid and NOT just a generic short division name (e.g. "บก.ทท.1")
    const isGenericAffil = ["บช.ทท.", "บก.ทท.1", "บก.ทท.2", "บก.ทท.3", "ALL", "-", "ไม่ระบุ"].includes(rawUnit);
    const finalUnit = (rawUnit && !isGenericAffil) ? rawUnit : sysUser.unit_name;
    const finalAff = (rawAff && rawAff !== "ไม่ระบุ" && rawAff !== "-") ? rawAff : sysUser.affiliation;

    const rawVType = String(rawUser.vehicle_type || "").trim().toUpperCase();
    const finalVType = (rawVType === "ALL" || sysUser.username.toLowerCase() === "stc01") ? "ALL" : sysUser.vehicle_type;

    return {
      ...rawUser,
      username: sysUser.username,
      password: rawUser.password || sysUser.password,
      role: sysUser.role,
      affiliation: finalAff,
      vehicle_id: sysUser.vehicle_id,
      unit_name: finalUnit,
      vehicle_name: sysUser.vehicle_name || finalUnit,
      vehicle_type: finalVType,
    };
  }

  const role = rawUser.role === "admin" || username.toLowerCase() === "admin" ? "admin" : (rawUser.role || "user");
  let affiliation = String(rawUser.affiliation || "").trim();
  if (!affiliation || affiliation === "ไม่ระบุ" || affiliation === "-") {
    if (role === "admin") {
      affiliation = "ALL";
    } else {
      const unit = String(rawUser.unit_name || rawUser.vehicle_name || "").trim();
      if (unit.includes("บก.ทท.1")) affiliation = "บก.ทท.1";
      else if (unit.includes("บก.ทท.2")) affiliation = "บก.ทท.2";
      else if (unit.includes("บก.ทท.3")) affiliation = "บก.ทท.3";
      else if (unit.includes("บช.ทท.")) affiliation = "บช.ทท.";
      else affiliation = "บช.ทท.";
    }
  }

  const unitName = rawUser.unit_name || rawUser.vehicle_name || username.toUpperCase();
  const vehicleType = rawUser.vehicle_type || (username.toLowerCase().startsWith("uav") ? "UAV Mobile" : "CCOC Mobile");

  return {
    ...rawUser,
    username,
    role,
    affiliation,
    vehicle_id: username,
    unit_name: unitName,
    vehicle_name: unitName,
    vehicle_type: vehicleType,
  };
}

export function getUnifiedUsersList(gasUsers?: any[]): UserAccount[] {
  const userMap = new Map<string, UserAccount>();

  // 1. Initialize with all authoritative SYSTEM_USERS
  SYSTEM_USERS.forEach(u => {
    userMap.set(u.username.toLowerCase(), u);
  });

  // 2. Synchronize dynamic users from GAS with official SYSTEM_USERS entries
  if (Array.isArray(gasUsers)) {
    gasUsers.forEach(u => {
      const uname = String(u.username || u.vehicle_id || "").trim().toLowerCase();
      if (uname && uname !== "undefined" && uname !== "null") {
        const enriched = enrichUserData(u);
        if (enriched.username && enriched.affiliation && enriched.affiliation !== "ไม่ระบุ") {
          userMap.set(uname, enriched);
        }
      }
    });
  }

  return Array.from(userMap.values());
}
