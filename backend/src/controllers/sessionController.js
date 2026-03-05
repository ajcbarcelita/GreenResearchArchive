export const getAuthenticatedUser = async (req, res) => {
  return res.status(200).json({
    message: "Authenticated",
    auth: req.auth,
  });
};

export const logout = async (req, res) => {
  return res.status(200).json({
    message: "Logout successful",
  });
};
