// HR 注册
router.post('/register', async (req, res) => {
  const {
    name, email, password, phone,
    companyName, companyPosition, companySize, companyAddress,
    businessLicense, avatar
  } = req.body;

  if (await HRUser.findOne({ email })) {
    return res.status(400).json({ message: '邮箱已被注册' });
  }

  const user = await HRUser.create({
    name,
    email,
    password,
    phone,
    company: {
      name: companyName,
      position: companyPosition,
      size: companySize,
      address: companyAddress
    },
    businessLicense,
    avatar
  });

  res.json({
    message: '注册成功',
    user
  });
}); 