// Desarrollo: ng serve reenvía estas rutas al API Spring Boot en local.
const target = process.env.LOCAL_API_PROXY_TARGET || 'http://localhost:8080';

const forward = { target, secure: false, changeOrigin: true };

module.exports = {
  '/api': forward,
  '/users': forward,
  '/plans': forward,
  '/contact-us': forward,
};
