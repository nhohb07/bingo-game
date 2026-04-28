const WORD_BANK_LIMIT = 1000;

const animalNouns = [
  "Mèo", "Chó", "Thỏ", "Chim", "Cá", "Gà", "Vịt", "Bò", "Ngựa", "Voi",
  "Hổ", "Sói", "Khỉ", "Gấu", "Cừu", "Dê", "Heo", "Rùa", "Ếch", "Ong",
  "Kiến", "Cua", "Tôm", "Mực", "Cáo", "Sóc", "Hươu", "Nai", "Sếu", "Cò"
];

const animalDescriptors = [
  "trắng", "đen", "vàng", "nâu", "xám", "nhỏ", "lớn", "con", "mẹ", "đực",
  "cái", "hiền", "nhanh", "chậm", "rừng", "biển", "nhà", "non", "già", "đốm"
];

const objectNouns = [
  "Bút", "Sách", "Vở", "Thước", "Tẩy", "Cặp", "Bàn", "Ghế", "Đèn", "Cốc",
  "Ly", "Chén", "Đĩa", "Muỗng", "Nĩa", "Kéo", "Hộp", "Túi", "Mũ", "Áo",
  "Quần", "Giày", "Dép", "Khăn", "Lược", "Gương", "Khóa", "Chuông", "Bóng", "Tranh"
];

const objectDescriptors = [
  "đỏ", "xanh", "vàng", "tím", "hồng", "cam", "trắng", "đen", "nâu", "xám",
  "gỗ", "nhựa", "giấy", "vải", "sắt", "nhỏ", "lớn", "mới", "cũ", "đẹp"
];

const peopleNames = [
  "An Nhiên", "Bảo An", "Minh Anh", "Gia Bảo", "Tuấn Kiệt", "Khánh Linh", "Ngọc Anh", "Hoàng Nam", "Hà My", "Quang Huy",
  "Phương Thảo", "Đức Anh", "Thanh Tâm", "Mai Chi", "Lan Anh", "Hải Đăng", "Nhật Minh", "Bảo Ngọc", "Gia Hân", "Minh Châu",
  "Anh Thư", "Tuệ Lâm", "Hoài An", "Khôi Nguyên", "Đăng Khoa", "Thảo Vy", "Quỳnh Anh", "Thiên Phúc", "Bảo Trâm", "Hồng Nhung",
  "Thanh Bình", "Hoàng Long", "Minh Khang", "Gia Linh", "Ngọc Hân", "Tuấn Anh", "Phúc An", "Mai Anh", "Hữu Minh", "Diệu Linh",
  "Khánh An", "Bảo Minh", "Thành Đạt", "Minh Đức", "Quốc Bảo", "Hoàng Anh", "Tường Vy", "Hương Giang", "Trúc Linh", "Mỹ Duyên"
];

const classroomNouns = [
  "Lớp", "Bảng", "Phấn", "Bút", "Sách", "Vở", "Cặp", "Bàn", "Ghế", "Thước",
  "Tẩy", "Chuông", "Sân", "Cổng", "Bài", "Điểm", "Nhóm", "Tổ", "Bạn", "Thầy"
];

const classroomDescriptors = [
  "học", "trắng", "màu", "mực", "toán", "văn", "nhạc", "vẽ", "mới", "cũ",
  "nhỏ", "lớn", "vui", "giỏi", "ngoan", "đẹp", "sạch", "xanh"
];

const englishAdjectives = [
  "red", "blue", "green", "yellow", "white", "black", "small", "big", "happy", "funny",
  "fast", "slow", "new", "old", "good", "nice", "bright", "sweet"
];

const englishNouns = [
  "apple", "book", "pen", "pencil", "table", "chair", "school", "teacher", "student", "house",
  "window", "garden", "river", "mountain", "flower", "cloud", "bird", "fish", "cat", "dog"
];

const houseNouns = [
  "Nhà", "Cửa", "Bếp", "Phòng", "Giường", "Tủ", "Kệ", "Rèm", "Sofa", "Gối",
  "Chăn", "Thảm", "Quạt", "Đèn", "Sân", "Vườn", "Tường", "Mái", "Cổng", "Hiên"
];

const houseDescriptors = [
  "bếp", "ngủ", "khách", "tắm", "ăn", "trắng", "xanh", "gỗ", "kính", "sạch",
  "ấm", "mát", "rộng", "hẹp", "cao", "thấp", "trước", "sau"
];

const sceneryNouns = [
  "Sông", "Suối", "Núi", "Đồi", "Biển", "Hồ", "Rừng", "Đồng", "Mây", "Gió",
  "Mưa", "Nắng", "Trăng", "Sao", "Hoa", "Cỏ", "Lá", "Cầu", "Đường", "Bến"
];

const sceneryDescriptors = [
  "xanh", "vàng", "trắng", "đỏ", "cao", "thấp", "rộng", "dài", "sâu", "cạn",
  "mát", "ấm", "đẹp", "yên", "sáng", "chiều", "sớm", "xa"
];

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function combine(nounList: string[], descriptorList: string[]) {
  return nounList.flatMap((noun) => descriptorList.map((descriptor) => `${noun} ${descriptor}`));
}

function interleave(groups: string[][]) {
  const result: string[] = [];
  const maxLength = Math.max(...groups.map((group) => group.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const group of groups) {
      if (group[index]) result.push(group[index]);
    }
  }
  return result;
}

export function buildMeaningfulWordBank() {
  return unique(
    interleave([
      combine(animalNouns, animalDescriptors),
      combine(objectNouns, objectDescriptors),
      peopleNames,
      combine(classroomNouns, classroomDescriptors),
      englishAdjectives.flatMap((adjective) => englishNouns.map((noun) => `${adjective} ${noun}`)),
      combine(houseNouns, houseDescriptors),
      combine(sceneryNouns, sceneryDescriptors)
    ])
  ).slice(0, WORD_BANK_LIMIT);
}

export function pickRandomBingoItems(count = 36) {
  const bank = buildMeaningfulWordBank();
  const shuffled = [...bank];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}
