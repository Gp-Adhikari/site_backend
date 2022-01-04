const getAppCookies = (req) => {
  // We extract the raw cookies from the request headers
  const rawCookies = req.headers.cookie.split("; ");
  // rawCookies = ['myapp=secretcookie, 'analytics_cookie=beacon;']

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    // parsedCookie = ['myapp', 'secretcookie'], ['analytics_cookie', 'beacon']
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
};

const verifyCookies = (req, res, next) => {
  try {
    console.log(getAppCookies(req).token);

    if (getAppCookies(req).token === undefined)
      return res.status(400).json({
        status: false,
        message: "Something went wrong.",
      });

    RefreshToken.findOne(
      { refreshToken: String(getAppCookies(req).token) },
      (err, refreshTokenDetails) => {
        if (err)
          return res.status(400).json({
            status: false,
            message: "Unexpected Error or cookie is missing!",
          });

        if (refreshTokenDetails.refreshToken === undefined)
          return res
            .status(400)
            .json({ status: false, message: "Something went wrong." });

        req.refreshToken = refreshTokenDetails.refreshToken;
        next();
      }
    );
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = verifyCookies;
