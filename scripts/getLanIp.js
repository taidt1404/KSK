const os = require('os');

function getLanIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        ips.push({ name, ip: net.address });
      }
    }
  }
  return ips;
}

const list = getLanIps();
console.log('========================================================================');
console.log('       🏥 HỆ THỐNG NHẬP LIỆU KHÁM SỨC KHỎE ĐỊNH KỲ (MẠNG LAN)');
console.log('========================================================================');
console.log('  Máy chủ tại chỗ (máy này): http://localhost:3000');
console.log('');
if (list.length > 0) {
  console.log('  CÁC PHÒNG KHÁM KHÁC (Mắt, TMH, Thể Lực...) MỞ TRÌNH DUYỆT GÕ ĐỊA CHỈ:');
  list.forEach((item) => {
    console.log(`  👉  http://${item.ip}:3000   (${item.name})`);
  });
} else {
  console.log('  👉  http://localhost:3000');
}
console.log('========================================================================');
console.log('  (Giữ cửa sổ màu đen này mở trong suốt thời gian các phòng khám làm việc)');
console.log('========================================================================\n');
