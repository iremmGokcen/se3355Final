import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { run, get } from '../config/db';

// Kullanıcı kaydı
const register = async (req, res) => {
  const { email, password, name } = req.body;

  const hashedPassword = await hash(password, 10);

  run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, hashedPassword, name],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'User registration failed' });
      }
      const token = sign({ id: this.lastID, email }, 'secret', { expiresIn: '1h' });
      return res.status(201).json({ token });
    }
  );
};

// Kullanıcı girişi
const login = (req, res) => {
  const { email, password } = req.body;

  get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = sign({ id: user.id, email }, 'secret', { expiresIn: '1h' });
    return res.status(200).json({ token });
  });
};

export default { register, login };
