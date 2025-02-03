import User from "../model/userModel.js";

export const allUsers = async (req, res) => {
  try {
    const allUsers = await User.find(
      { role: "user" },
      "username email phone createdAt active _id"
    );

    const users = allUsers.map((user) => ({
      _id: user._id,
      active: user.active,
      username: user.username,
      email: user.email,
      phone: user.phone,
      joinedDate: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(user.createdAt)),
    }));

    res.status(200).json({ message: "Success", users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  console.log(id, active);

  try {
    const updatedUserStatus = await User.findByIdAndUpdate(
      id,
      { active },
      { new: true }
    );

    if (!updatedUserStatus) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updateUserStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
