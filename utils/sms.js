const sendOTP = async (phone, otp) => {
  console.log(`ارسال OTP به شماره ${phone}: ${otp}`);
  // TODO: اتصال به API واقعی ارسال SMS
};

module.exports = { sendOTP };