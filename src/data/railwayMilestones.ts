export interface RailwayMilestone {
  id: string;
  name: string;
  km: number;
  note: string;
}

export interface RouteMilestone extends RailwayMilestone {
  percent: number; // 0 to 100 along user's route
  distanceFromStart: number;
}

export const RAILWAY_MILESTONES: RailwayMilestone[] = [
  { id: 'hn', name: 'Hà Nội', km: 0, note: 'Khởi hành từ ga Hà Nội cổ kính' },
  { id: 'phl', name: 'Hà Nam - Phủ Lý', km: 56, note: 'Qua vùng đồng bằng Bắc Bộ' },
  { id: 'ndi', name: 'Nam Định', km: 87, note: 'Vùng đất dệt & tháp Phổ Minh' },
  { id: 'nb', name: 'Ninh Bình', km: 115, note: 'Ngang qua non nước Tràng An, Tam Cốc' },
  { id: 'tha', name: 'Thanh Hóa', km: 175, note: 'Vượt cầu Hàm Rồng lịch sử' },
  { id: 'vin', name: 'Nghệ An - Vinh', km: 319, note: 'Qua mảnh đất xứ Nghệ nắng gió' },
  { id: 'hp', name: 'Hà Tĩnh - Hương Phố', km: 387, note: 'Men theo dãy Trường Sơn hùng vĩ' },
  { id: 'dho', name: 'Quảng Bình - Đồng Hới', km: 522, note: 'Qua vùng di sản Phong Nha - Kẻ Bàng' },
  { id: 'dha', name: 'Quảng Trị - Đông Hà', km: 622, note: 'Ngang qua vĩ tuyến 17 sông Bến Hải' },
  { id: 'hue', name: 'Thừa Thiên Huế', km: 688, note: 'Cố đô Huế mộng mơ & đầm Lập An' },
  { id: 'dn', name: 'Đà Nẵng', km: 791, note: 'Vượt đèo Hải Vân hùng vĩ bên bờ biển' },
  { id: 'tky', name: 'Quảng Nam - Tam Kỳ', km: 865, note: 'Qua miền di sản xứ Quảng' },
  { id: 'qng', name: 'Quảng Ngãi', km: 928, note: 'Ngang qua núi Ấn sông Trà' },
  { id: 'qn', name: 'Bình Định - Diêu Trì', km: 1096, note: 'Vùng đất võ trời văn Quy Nhơn' },
  { id: 'tho', name: 'Phú Yên - Tuy Hòa', km: 1198, note: 'Hoa vàng trên cỏ xanh & Mũi Điện' },
  { id: 'nt', name: 'Khánh Hòa - Nha Trang', km: 1315, note: 'Cung đường biển vịnh Nha Trang' },
  { id: 'tc', name: 'Ninh Thuận - Tháp Chàm', km: 1408, note: 'Qua vùng nắng gió & tháp Chăm cổ' },
  { id: 'pt', name: 'Bình Thuận', km: 1551, note: 'Qua những đồi thanh long bạt ngàn' },
  { id: 'bho', name: 'Đồng Nai - Biên Hòa', km: 1697, note: 'Cửa ngõ miền Đông Nam Bộ' },
  { id: 'sg', name: 'TP. Hồ Chí Minh - Sài Gòn', km: 1726, note: 'Ga cuối Sài Gòn hoa lệ' },
];

/**
 * Filter and compute intermediate milestones lying strictly or inclusively between departure and arrival km.
 * Handles both North-to-South and South-to-North directions.
 */
export function getRouteMilestones(depKm: number, arrKm: number): RouteMilestone[] {
  const totalDist = Math.abs(arrKm - depKm);
  if (totalDist === 0) return [];

  const isNorthToSouth = depKm < arrKm;

  const intermediate = RAILWAY_MILESTONES.filter((m) => {
    if (isNorthToSouth) {
      return m.km >= depKm && m.km <= arrKm;
    } else {
      return m.km <= depKm && m.km >= arrKm;
    }
  });

  // Sort based on journey direction
  intermediate.sort((a, b) => {
    return isNorthToSouth ? a.km - b.km : b.km - a.km;
  });

  return intermediate.map((m) => {
    const distanceFromStart = Math.abs(m.km - depKm);
    const percent = Math.min(100, Math.max(0, (distanceFromStart / totalDist) * 100));
    return {
      ...m,
      distanceFromStart,
      percent,
    };
  });
}
