const Friendship = require('../models/Friendship');

async function areFriends(userA, userB) {
  if (!userA || !userB) return false;
  if (String(userA) === String(userB)) return true;
  const row = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requester: userA, recipient: userB },
      { requester: userB, recipient: userA },
    ],
  });
  return Boolean(row);
}

async function friendIdsOf(userId) {
  const rows = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  });
  return rows.map((row) =>
    String(row.requester) === String(userId) ? String(row.recipient) : String(row.requester)
  );
}

function limitedProfile(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture || '',
  };
}

function fullProfile(user, extras = {}) {
  return {
    ...limitedProfile(user),
    email: user.email,
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    role: user.role,
    createdAt: user.createdAt,
    ...extras,
  };
}

function publicAuthor(user) {
  return limitedProfile(user);
}

module.exports = { areFriends, friendIdsOf, limitedProfile, fullProfile, publicAuthor };
