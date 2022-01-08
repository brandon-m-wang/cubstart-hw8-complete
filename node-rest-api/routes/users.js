const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// it is very important to remember your await statements

// UPDATE USER
router.put("/:id", async (req, res) => {
  // :id syntax is a request parameter (i.e. can take on any value)
  if (req.body.userId == req.params.id) {
    // if the request body contains the same id as the user page (req.params)
    if (req.body.password) {
      // generate the new encrypted password
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        console.log(err);
      }
    }
    try {
      await User.findByIdAndUpdate(req.body.userId, {
        $set: req.body, // sets all fields to be the one found in req.body
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      console.log(err);
    }
  } else {
    return res.status(403).json("No permissions");
  }
});

// DELETE USER
router.delete("/:id", async (req, res) => {
  if (req.body.userId == req.params.id) {
    try {
      await User.findByIdAndDelete(req.body.userId);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      console.log(err);
    }
  } else {
    return res.status(403).json("No permissions");
  }
});

// GET USER BY EITHER ID OR USERNAME USING QUERY PARAMETER
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc; // _doc carries the entire document object in MongoDB. need to remove password and other extranneous information from the get response.
    res.status(200).json(other);
  } catch (err) {
    res.status(404).json(err);
  }
});

// GET FOLLOWING/FRIENDS
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.following.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendsList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend; // only unpack the properties we need
      friendsList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendsList);
  } catch (err) {
    console.log(err);
  }
});

// FOLLOW USER
router.put("/:id/follow", async (req, res) => {
  // if not attempting to follow self
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      // if not already following
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } }); // update both users involved using $push syntax
        await currentUser.updateOne({ $push: { following: req.params.id } }); // update both users involved
        res.status(200).json("Followed user");
      } else {
        res.status(403).json("Already following");
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(403).json("Can't follow self");
  }
});

// UNFOLLOW USER
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } }); // update both users involved using $pull syntax
        await currentUser.updateOne({ $pull: { following: req.params.id } }); // update both users involved
        res.status(200).json("Unfollowed user");
      } else {
        res.status(403).json("Not following");
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(403).json("Can't unfollow self");
  }
});

module.exports = router;
