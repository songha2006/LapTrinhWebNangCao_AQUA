const crypto = require('crypto');

const config = {
  tmnCode: process.env.VNP_TMN_CODE || '',
  hashSecret: process.env.VNP_HASH_SECRET || '',
  url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
};

// Chưa cấu hình TMN code thì chạy chế độ giả lập để demo không cần tài khoản sandbox
const isConfigured = () => Boolean(config.tmnCode && config.hashSecret);

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
  return sorted;
}

// Tạo URL thanh toán theo chuẩn VNPay v2.1.0 (chữ ký HMAC-SHA512)
function buildPaymentUrl({ orderId, amount, ipAddr, orderInfo }) {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const createDate =
    date.getFullYear().toString() + pad(date.getMonth() + 1) + pad(date.getDate()) +
    pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());

  let params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  params = sortObject(params);
  const signData = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
  const signed = crypto.createHmac('sha512', config.hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  return `${config.url}?${signData}&vnp_SecureHash=${signed}`;
}

// Xác thực chữ ký khi VNPay redirect về
function verifyReturn(query) {
  const secureHash = query.vnp_SecureHash;
  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = Object.entries(sorted).map(([k, v]) => `${k}=${v}`).join('&');
  const signed = crypto.createHmac('sha512', config.hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  return secureHash === signed;
}

module.exports = { config, isConfigured, buildPaymentUrl, verifyReturn };
