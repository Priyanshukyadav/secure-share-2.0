import bcryptjs from 'bcryptjs';

export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (enteredPassword, hashedPassword) => {
  return bcryptjs.compare(enteredPassword, hashedPassword);
};
