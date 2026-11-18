/* Kho dữ liệu kích thước thang theo hãng – CHỈ chứa số liệu trích từ tài liệu hãng, có ghi nguồn.
   Hàng: [cửa, Q kg, số người, vận tốc tối đa của hàng, BB rộng cabin, DD sâu cabin, LL rộng cửa thông thuỷ, WW rộng hố min, WD sâu hố min] (mm).
   Cửa: 2S = mở một bên (side opening), CO = mở giữa (centre opening). */
(function (global) {
  'use strict';
  const AL = (global.AL = global.AL || {});
  AL.LIFT_LIB = {
    KONE: [{
      model: 'KONE MonoSpace 500 DX',
      type: 'MRL',
      typeLabel: 'Không phòng máy (MRL)',
      source: 'KONE MonoSpace 500 DX – Options and shaft dimensions 1.0–1.75 m/s; 320–1150 kg, EN 81-20, ấn phẩm 8571/OCT 2018, trang 2–3 (kone.co.uk)',
      url: 'https://www.kone.co.uk/Images/8571_KONE_MonoSpace_500_DX_planning-data_EN81-20_GBIR_tcm45-17968.pdf',
      speeds: [1.0, 1.6, 1.75],
      notes: ['Kích thước hố đã gồm dung sai hố ±25 mm (theo tài liệu).', 'Một số cấu hình cần lan can nóc cabin 1100 mm → tăng SH thêm 400 mm.', 'Cửa mở giữa (CO) chỉ có từ 630 kg.'],
      // PH hố pit tiêu chuẩn theo vận tốc (mm), tối đa 1550
      pit: { '1': 1050, '1.6': 1200, '1.75': 1200 },
      // SH chiều cao tầng trên cùng tối thiểu = CH + giá trị (trần tiêu chuẩn)
      shAdd: { '1': 1300, '1.6': 1500, '1.75': 1500 },
      // giới hạn hành trình / số điểm dừng: [v, Q tối đa, hành trình m, số dừng]
      duty: [[1.0, 1150, 55, 21], [1.6, 1000, 75, 24], [1.75, 1000, 75, 24], [1.6, 1150, 65, 24], [1.75, 1150, 65, 24]],
      tool: 'kone',
      rows: [["2S", 320, 4, 1.0, 750, 1100, 600, 1220, 1500], ["2S", 320, 4, 1.0, 750, 1100, 700, 1300, 1500], ["2S", 400, 4, 1.0, 800, 1200, 600, 1270, 1600], ["2S", 400, 4, 1.0, 800, 1200, 700, 1300, 1600], ["2S", 400, 5, 1.75, 950, 1100, 700, 1420, 1500], ["2S", 400, 5, 1.75, 950, 1100, 800, 1450, 1500], ["2S", 450, 6, 1.75, 1000, 1200, 800, 1470, 1600], ["2S", 450, 6, 1.75, 1000, 1200, 900, 1600, 1600], ["2S", 480, 6, 1.75, 950, 1300, 700, 1420, 1700], ["2S", 480, 6, 1.75, 950, 1300, 800, 1450, 1700], ["2S", 480, 6, 1.75, 950, 1300, 900, 1600, 1700], ["2S", 480, 6, 1.75, 1000, 1250, 800, 1470, 1650], ["2S", 480, 6, 1.75, 1000, 1250, 900, 1600, 1650], ["2S", 630, 8, 1.75, 1100, 1400, 800, 1570, 1800], ["2S", 630, 8, 1.75, 1100, 1400, 900, 1600, 1800], ["2S", 680, 8, 1.75, 1130, 1400, 800, 1600, 1800], ["2S", 680, 8, 1.75, 1130, 1400, 900, 1600, 1800], ["2S", 680, 8, 1.75, 1130, 1400, 1000, 1750, 1800], ["2S", 680, 9, 1.75, 1200, 1400, 900, 1670, 1800], ["2S", 800, 10, 1.75, 1350, 1400, 800, 1850, 1800], ["2S", 800, 10, 1.75, 1350, 1400, 900, 1850, 1800], ["2S", 800, 10, 1.75, 1350, 1400, 1000, 1850, 1800], ["2S", 900, 12, 1.75, 1400, 1500, 800, 1900, 1900], ["2S", 900, 12, 1.75, 1400, 1500, 900, 1900, 1900], ["2S", 900, 12, 1.75, 1400, 1500, 1000, 1900, 1900], ["2S", 1000, 13, 1.75, 1100, 2100, 800, 1600, 2500], ["2S", 1000, 13, 1.75, 1100, 2100, 900, 1600, 2500], ["2S", 1000, 13, 1.75, 1100, 2100, 1000, 1750, 2500], ["2S", 1000, 13, 1.75, 1300, 1700, 900, 1800, 2100], ["2S", 1000, 13, 1.75, 1300, 1700, 1000, 1800, 2100], ["2S", 1000, 13, 1.75, 1400, 1600, 900, 1900, 2000], ["2S", 1000, 13, 1.75, 1400, 1600, 1000, 1900, 2000], ["2S", 1000, 13, 1.75, 1450, 1550, 900, 1950, 1950], ["2S", 1000, 13, 1.75, 1450, 1550, 1000, 1950, 1950], ["2S", 1150, 15, 1.75, 1200, 2100, 900, 1700, 2500], ["2S", 1150, 15, 1.75, 1200, 2100, 1000, 1750, 2500], ["2S", 1150, 15, 1.75, 1200, 2100, 1100, 1900, 2500], ["2S", 1150, 15, 1.75, 1400, 1850, 900, 1900, 2250], ["2S", 1150, 15, 1.75, 1400, 1850, 1000, 1900, 2250], ["2S", 1150, 15, 1.75, 1400, 1850, 1100, 1900, 2250], ["CO", 630, 8, 1.75, 1100, 1400, 800, 1740, 1700], ["CO", 630, 8, 1.75, 1100, 1400, 900, 1940, 1700], ["CO", 630, 8, 1.75, 1100, 1400, 1000, 2140, 1700], ["CO", 800, 10, 1.75, 1350, 1400, 800, 1840, 1700], ["CO", 800, 10, 1.75, 1350, 1400, 900, 1940, 1700], ["CO", 900, 12, 1.75, 1400, 1500, 800, 1900, 1800], ["CO", 900, 12, 1.75, 1400, 1500, 900, 1940, 1800], ["CO", 1000, 13, 1.75, 1100, 2100, 800, 1740, 2400], ["CO", 1000, 13, 1.75, 1100, 2100, 900, 1940, 2400], ["CO", 1000, 13, 1.75, 1100, 2100, 1000, 2140, 2400], ["CO", 1000, 13, 1.75, 1300, 1700, 900, 1940, 2000], ["CO", 1000, 13, 1.75, 1300, 1700, 1000, 2140, 2000], ["CO", 1000, 13, 1.75, 1300, 1700, 1100, 2340, 2000], ["CO", 1000, 13, 1.75, 1400, 1600, 1000, 2140, 1900], ["CO", 1000, 13, 1.75, 1400, 1600, 1100, 2340, 1900], ["CO", 1000, 13, 1.75, 1450, 1550, 900, 1940, 1850], ["CO", 1000, 13, 1.75, 1450, 1550, 1000, 2140, 1850], ["CO", 1000, 13, 1.75, 1600, 1400, 900, 2100, 1700], ["CO", 1000, 13, 1.75, 1600, 1400, 1000, 2140, 1700], ["CO", 1000, 13, 1.75, 1600, 1400, 1100, 2340, 1700], ["CO", 1150, 15, 1.75, 1200, 2100, 900, 1940, 2400], ["CO", 1150, 15, 1.75, 1200, 2100, 1000, 2140, 2400], ["CO", 1150, 15, 1.75, 1200, 2100, 1100, 2340, 2400], ["CO", 1150, 15, 1.75, 1400, 1850, 900, 1940, 2150], ["CO", 1150, 15, 1.75, 1400, 1850, 1000, 2140, 2150], ["CO", 1150, 15, 1.75, 1400, 1850, 1100, 2340, 2150]]
    }].concat([
      ['KONE N MonoSpace', 'MRL', 'Không phòng máy (MRL)', 1.75, 75, 1150, 4],
      ['KONE S MonoSpace', 'MRL', 'Không phòng máy (MRL)', 2.5, 90, 2000, 6],
      ['KONE N MiniSpace', 'MR', 'Có phòng máy nhỏ (MR)', 2.5, 135, 1150, 6],
      ['KONE S MiniSpace', 'MR', 'Có phòng máy nhỏ (MR)', 3.0, 150, 1600, 8],
    ].map(function (k) {
      // dòng máy chỉ có giới hạn (chưa có kích thước) — từ tài liệu hướng dẫn công cụ online của KONE
      return { model: k[0], type: k[1], typeLabel: k[2], tool: 'kone',
        source: 'Tài liệu "Huong dan thiet ke online.pdf" (hướng dẫn KONE Elevator Toolbox, tư vấn KONE miền Bắc, không ghi ngày), trang 3–4 — thư viện A:\\09. Other\\01. Phong Kien Truc\\6.Thu vien\\2. Thang may\\KONE',
        limits: { vmax: k[3], trmax: k[4], qmax: k[5], group: k[6] },
        noDims: 'Tài liệu chỉ cho giới hạn: vận tốc ≤ ' + k[3] + ' m/s, hành trình ≤ ' + k[4] + ' m, tải ≤ ' + k[5] + ' kg, ≤ ' + k[6] + ' thang/nhóm — CẦN XÁC MINH trên KONE Studio (tài liệu cũ, không ghi ngày). Kích thước hố/pit/OH: chạy KONE Studio rồi nhập ở mục "Nhập kết quả từ công cụ hãng".',
        rows: [] };
    })),
    // Hàng mở rộng: [..., PH, OH, phòng máy, hành trình max, số dừng max, CH cao cabin, HH cao cửa, ghi chú, đối trọng (B sau / L trái / R phải / S bên, nhìn từ sảnh), số lối vào]
    Mitsubishi: [{
      model: 'Mitsubishi – thang có phòng máy (bảng TKCS FPT Plaza 5)',
      type: 'MR',
      typeLabel: 'Có phòng máy (MR)',
      source: 'File "MITSUBISHI Thông số kỹ thuật thang máy P5 (M).xlsx", sheet "PA De xuat Kien Truc", dòng 7–13 — bảng lựa chọn giải pháp TKCS dự án FPT Plaza 5 (Catalog hãng\\, KTS cung cấp)',
      exactSpeed: true,
      notes: ['Số liệu theo một dự án cụ thể (hành trình 81,7 m / 23 điểm dừng; rác 75,15 m / 20 điểm dừng), không phải bảng tra đầy đủ của hãng — dùng cho cấu hình tương tự, cần hãng xác nhận khi đổi hành trình.',
        'OP1/OP2 là hai phương án vận tốc trong bảng.', 'Thang rác ghi tải trọng 750–800 kg; nạp ở mức 800 kg.'],
      rows: [
        ['CO', 1150, 15, 2.0, 1800, 1500, 1000, 2200, 2110, 1600, 4700, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang khách (EL), đối trọng sau – OP1', 'B'],
        ['CO', 1150, 15, 2.5, 1800, 1500, 1000, 2200, 2110, 2000, 4900, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang khách (EL), đối trọng sau – OP2', 'B'],
        ['2S', 1350, 18, 2.0, 1350, 2300, 1100, 2110, 2904, 1600, 4700, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang chữa cháy (CC), đối trọng bên – OP1', 'S'],
        ['2S', 1350, 18, 2.5, 1350, 2300, 1100, 2110, 2904, 2000, 4900, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang chữa cháy (CC), đối trọng bên – OP2', 'S'],
        ['CO', 800, 10, 1.5, 1400, 1350, 800, 1800, 2010, 1400, 4400, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang chở rác (R), đối trọng sau/bên, tải 750–800 kg – OP1'],
        ['CO', 800, 10, 2.0, 1400, 1350, 800, 1800, 2010, 1500, 4650, 'Phòng máy cao thông thuỷ tối thiểu 2200 mm', null, null, 2200, 2100, 'Thang chở rác (R), đối trọng sau/bên, tải 750–800 kg – OP2'],
      ],
    }, {
      model: 'Shanghai Mitsubishi LEHY-MRL-II',
      type: 'MRL',
      typeLabel: 'Không phòng máy (MRL)',
      source: 'Catalog "LEHY-MRL-II (English) May 2023.pdf", trang 18 – Basic Specifications (Shanghai Mitsubishi Elevator)',
      exactSpeed: true,
      speeds: [0.63, 1.0, 1.75, 2.0, 2.5],
      loadsBySpeed: { '0.63': [320, 450, 550], '1': [320, 450, 550, 630, 825, 1050, 1200, 1350, 1600, 1800, 2000, 2250, 2500], '1.75': [630, 825, 1050, 1200, 1350, 1600, 1800, 2000, 2250, 2500], '2': [1050, 1200, 1350, 1600], '2.5': [1050, 1200, 1350, 1600] },
      duty: [[0.63, 550, 30, 11], [1.0, 2500, 55, 18], [1.75, 2500, 80, 28], [2.0, 1600, 120, 32], [2.5, 1600, 120, 32]],
      noDims: 'Catalog chỉ có thông số cơ bản (tải trọng, vận tốc, số điểm dừng, hành trình 3,4–30 / 3,4–55 / 7,3–80 / 9,1–120 / 13,3–120 m); kích thước hố/pit/OH hãng cung cấp qua công cụ "LEHY Civil Engineering" (mã QR trong catalog). Nạp cấu hình bằng mục "Nạp dữ liệu" bên dưới.',
      rows: [],
    }, {
      model: 'Shanghai Mitsubishi LEHY-III-S',
      type: 'MR',
      typeLabel: 'Phòng máy thu gọn (bằng hố thang)',
      source: 'Catalog "LEHY-III-S (English) June 2023.pdf", trang 10 (tờ 16) – Basic Specifications (Shanghai Mitsubishi Elevator)',
      exactSpeed: true,
      speeds: [1.0, 1.6, 1.75, 2.0, 2.5],
      loadsBySpeed: { '1': [630, 825, 900, 1050], '1.6': [630, 825, 900, 1050], '1.75': [630, 825, 900, 1050], '2': [825, 900, 1050], '2.5': [825, 900, 1050] },
      duty: [[1.0, 1050, 55, 18], [1.6, 1050, 90, 32], [1.75, 1050, 90, 32], [2.0, 1050, 120, 36], [2.5, 1050, 120, 36]],
      noDims: 'Catalog chỉ có thông số cơ bản: hành trình 3,4–55 (1,0) / 7,3–90 (1,6–1,75) / 9,1–120 (2,0) / 13,3–120 m (2,5); 900 kg chỉ với đối trọng sau; phòng máy thu gọn bằng kích thước hố; tầng tối thiểu 2600 mm. Kích thước hố/pit/OH: công cụ "LEHY Civil Engineering" (mã QR). Nạp cấu hình bằng mục "Nạp dữ liệu".',
      rows: [],
    }, {
      model: 'Shanghai Mitsubishi LEHY-III',
      type: 'MR',
      typeLabel: 'Có phòng máy (MR)',
      source: 'Catalog "LEHY-III(EN-E)_20221019.pdf", trang 20 – Basic Specifications (Shanghai Mitsubishi Elevator)',
      exactSpeed: true,
      speeds: [1.0, 1.75, 2.0, 2.5, 3.0],
      loadsBySpeed: { '1': [630, 825, 1050, 1200, 1350, 1600, 1800, 2025, 2250, 2500], '1.75': [630, 825, 1050, 1200, 1350, 1600, 1800, 2025, 2250, 2500], '2': [825, 1050, 1200, 1350, 1600, 1800, 2025], '2.5': [825, 1050, 1200, 1350, 1600, 1800, 2025], '3': [825, 1050, 1200, 1350, 1600] },
      duty: [[1.0, 2500, 55, 54], [1.75, 2500, 90, 54], [2.0, 2025, 120, 54], [2.5, 2025, 140, 54], [3.0, 1600, 150, 54]],
      notes: ['Tải 1800–2500 kg: LEHY-III/LEHY-IIIB; 630–1600 kg: LEHY-III.',
        'Ghi chú catalog: tải 2250 và 2500 kg, hành trình tối đa có thể đến 105 m ở 1,75 m/s (bảng ghi 7,3–90 m) — cần hãng xác nhận.',
        'Đối trọng sau hoặc bên; treo cáp 2:1; cửa mở giữa (CO) hoặc hai cánh lùa một bên (2S), cao cửa thông thuỷ tiêu chuẩn 2100–2400 (ngoài tiêu chuẩn 2500, 2600 mm).',
        'Chiều cao tầng tối thiểu 2300–3200 mm (theo cấu hình); nhóm điều khiển tối đa 8 thang (3C–8C-ITS-2100).'],
      noDims: 'Catalog chỉ có thông số cơ bản: hành trình 3,4–55 (1,0) / 7,3–90 (1,75) / 9,1–120 (2,0) / 13,3–140 (2,5) / 15–150 m (3,0); ≤ 54 điểm dừng; 180 lần khởi động/giờ. Kích thước hố/pit/OH/phòng máy: công cụ "LEHY Civil Engineering" (mã QR) hoặc hãng. Nạp cấu hình bằng mục "Nạp dữ liệu".',
      rows: [],
    }],
    Schindler: [{
      model: 'Schindler 5000',
      type: 'MRL',
      typeLabel: 'Không phòng máy (MRL)',
      source: 'Catalog "Schindler 1.pdf" (Schindler 5000), trang 17 – Key figures: 600–1360 kg, 1,0–2,5 m/s, hành trình ≤ 80 m, ≤ 40 điểm dừng, MRL. Kích thước hố/pit/OH: từ ảnh cấu hình Schindler Plan (KTS cung cấp)',
      exactSpeed: true,
      notes: ['Catalog không có bảng kích thước hố; mỗi cấu hình phải lấy từ công cụ Schindler Plan.',
        'BK×TK là kích thước cabin thô (chưa ốp), theo Schindler Plan.'],
      // Hàng mở rộng như Mitsubishi: [..., PH, OH, phòng máy, hành trình max, số dừng max, CH, HH, ghi chú]
      rows: [
        ['CO', 1350, 18, 1.75, 1800, 1600, 1000, 2450, 2100, 1450, 4200, null, 80, 40, 2400, 2100,
          'Ảnh Schindler Plan (Catalog hãng\\Schindler.jpg, KTS cung cấp; vận tốc 1,75 m/s theo KTS 18/11/2026): cabin thô BK×TK 1800×1600, cao thô HK 2500, trần trang trí HKC 2400; hố BS×TS 2450×2100 (BS cho phép 2393,5–3159); HSK 4200 (tối thiểu 4141); HSG 1450 (1427–2252); đối trọng bên trái, có bộ hãm an toàn đối trọng; 2 lối vào (ZKE = 2); BKF1 = BKF2 = 400', 'L', 2],
      ],
    }],
  };
})(typeof window !== 'undefined' ? window : globalThis);
