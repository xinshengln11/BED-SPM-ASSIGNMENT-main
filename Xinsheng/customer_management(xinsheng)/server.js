require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the team's shared front-end (repo-root /public) so this module can be
// run and demoed standalone (login/profile/order-history pages talk to this
// API on the same origin, which is what lets the httpOnly auth cookie work
// without CORS). Remove once the team's merged app.js takes over this job.
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Centralised error handler -- keeps controllers free of try/catch boilerplate.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Customer management API listening on port ${PORT}`));
