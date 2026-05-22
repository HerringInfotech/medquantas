const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || '12345Medo@';
const env = process.env
const jwtOptions = {
  algorithms: ['HS256'],
};

const jwtMiddleware = (req, res, next) => {
  if (
    req.path === "/api/auth/sign_in" ||
    req.path === "/api/test" ||
    req.path === "/api/auth/sign_up" ||
    req.path === "/api/auth/forgotpassword" ||
    req.path === "/api/main/get_setting" ||
    req.path === "/api/auth/change_password" ||
    req.path === "/api/auth/log_activity" || 
    req.path === "/api/auth/send-mail" ||
    req.path === "/api/erp/get_item_master" ||
    req.path === "/api/erp/get_price_master" ||
    req.path === "/api/erp/get_item_sync" ||
    req.path === "/api/erp/get_price_sync" ||
    req.path === "/api/erp/update_item_master" ||
    req.path === "/api/erp/update_price_master" ||
    req.path === "/api/erp/save_item_sync" ||
    req.path === "/api/erp/save_price_sync" ||
    req.path === "/api/erp/delete_all_item_master" ||

    

  ) {
    return next();
  }
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.slice(7);
    jwt.verify(token, jwtSecret, jwtOptions, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.user = decoded;
      next();

    });
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { jwtSecret, jwtMiddleware };

