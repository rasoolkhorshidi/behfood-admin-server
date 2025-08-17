const Admin = require("../models/Admin");

exports.getProfile = async (req, res) => {
    const admin = await Admin.findById(req.admin.id).select("-password");
    res.json(admin);
};


