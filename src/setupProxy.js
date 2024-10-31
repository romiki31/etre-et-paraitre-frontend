const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      // target: "http://localhost:5001",
      target: "https://donska.fr",
      changeOrigin: true,
      // ws: true,
    })
  );
};
