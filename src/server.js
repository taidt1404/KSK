const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { initSchema } = require('./db/initSchema');
const { seedLookups } = require('./db/seedLookups');
const { handleSse } = require('./services/sseService');

const patientRoutes = require('./routes/patientRoutes');
const examRoutes = require('./routes/examRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const backupRoutes = require('./routes/backupRoutes');
const { initAutoBackup } = require('./services/backupService');
let excelRoutes = null;
try {
  excelRoutes = require('./routes/excelRoutes');
} catch (e) {
  // Sẽ được kích hoạt trong Task 3
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Tắt cache trình duyệt cho static assets để luôn cập nhật ngay bản mới nhất
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  maxAge: 0
}));

// SSE Endpoint
app.get('/api/events', handleSse);

// REST Routes
app.use('/api/patients', patientRoutes);
app.use('/api/patients', examRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/backups', backupRoutes);
if (excelRoutes) {
  app.use('/api/excel', excelRoutes);
}

// Fallback route cho SPA
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ status: 'KSK Server is running', port: PORT });
  }
});

// Hàm lấy danh sách IP mạng LAN
function getLanIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

async function startServer(customPort) {
  await initSchema();
  await seedLookups();
  initAutoBackup();

  const listenPort = customPort !== undefined ? customPort : PORT;

  return new Promise((resolve) => {
    const server = app.listen(listenPort, '0.0.0.0', () => {
      const activePort = server.address().port;
      const lanIps = getLanIps();
      console.log('===============================================================');
      console.log(`🏥 HỆ THỐNG NHẬP LIỆU KHÁM SỨC KHỎE ĐỊNH KỲ (MẠNG LAN)`);
      console.log(`   - Máy chủ tại chỗ: http://localhost:${activePort}`);
      if (lanIps.length > 0) {
        console.log(`   - Các máy phòng khám khác truy cập địa chỉ sau:`);
        lanIps.forEach((ip) => {
          console.log(`     👉  http://${ip}:${activePort}`);
        });
      } else {
        console.log(`   - Địa chỉ mạng LAN: http://<IP_MÁY_CHỦ>:${activePort}`);
      }
      console.log('===============================================================');
      resolve({ app, server, port: activePort });
    });
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Lỗi khởi động máy chủ:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
