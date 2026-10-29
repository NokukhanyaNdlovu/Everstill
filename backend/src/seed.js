const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { connectDb } = require('./db');
const User = require('./models/User');
const Friendship = require('./models/Friendship');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Album = require('./models/Album');
const Report = require('./models/Report');
const Notification = require('./models/Notification');

const uploadDir = path.join(__dirname, '..', 'uploads');

function svg(title, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="${color}"/>
  <circle cx="220" cy="160" r="90" fill="rgba(255,255,255,0.18)"/>
  <circle cx="980" cy="620" r="140" fill="rgba(0,0,0,0.12)"/>
  <text x="80" y="420" fill="white" font-family="Georgia, serif" font-size="52">${title}</text>
</svg>`;
}

async function writeSeedImage(filename, title, color) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, svg(title, color));
  return `/uploads/${filename}`;
}

async function seed() {
  await connectDb(process.env.MONGODB_URI);
  await Promise.all([
    User.deleteMany({}),
    Friendship.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Album.deleteMany({}),
    Report.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const people = [
    ['Avery Admin', 'admin', 'admin@photos.local', 'admin', 'Moderates community reports.', 'Cape Town'],
    ['Alice Rivers', 'alice', 'alice@photos.local', 'user', 'Coastal walks and film photography.', 'Durban'],
    ['Bob Okonkwo', 'bob', 'bob@photos.local', 'user', 'Street scenes after rain.', 'Johannesburg'],
    ['Cara Mendes', 'cara', 'cara@photos.local', 'user', 'Gardens, kitchens, slow mornings.', 'Lisbon'],
    ['Diego Patel', 'diego', 'diego@photos.local', 'user', 'Hiking ridgelines at blue hour.', 'Nairobi'],
    ['Elena Cho', 'elena', 'elena@photos.local', 'user', 'Night markets and neon.', 'Seoul'],
    ['Farid Hassan', 'farid', 'farid@photos.local', 'user', 'Architecture and long shadows.', 'Cairo'],
    ['Gina Cole', 'gina', 'gina@photos.local', 'user', 'Portraits of friends and neighbours.', 'London'],
  ];

  const users = [];
  for (const [name, username, email, role, bio, location] of people) {
    users.push(
      await User.create({
        name,
        username,
        email,
        role,
        bio,
        location,
        passwordHash,
        profilePicture: await writeSeedImage(`avatar-${username}.svg`, name.split(' ')[0], '#2c3d36'),
      })
    );
  }

  const [admin, alice, bob, cara, diego, elena, farid, gina] = users;

  const accepted = [
    [alice, bob],
    [alice, cara],
    [alice, gina],
    [bob, diego],
    [elena, farid],
    [gina, bob],
  ];
  for (const [a, b] of accepted) {
    await Friendship.create({ requester: a._id, recipient: b._id, status: 'accepted' });
  }
  await Friendship.create({ requester: diego._id, recipient: elena._id, status: 'pending' });

  const postMeta = [
    [alice, 'Harbour light', '#1f4e5f', 'Blue hour over the harbour wall. #harbour #bluehour', ['harbour', 'bluehour']],
    [alice, 'Sea spray', '#3a6b7c', 'Spray on the rocks after a south-easter. #ocean', ['ocean']],
    [bob, 'Wet asphalt', '#4a4338', 'Taxi lights on wet asphalt. #street #rain', ['street', 'rain']],
    [bob, 'Market stall', '#6b4f3a', 'Mango crates before the rush. #market', ['market']],
    [cara, 'Herb window', '#4e6b4a', 'Basil taking over the kitchen window. #garden #home', ['garden', 'home']],
    [diego, 'Ridge trail', '#5a4a38', 'Last switchback before the saddle. #hike #trail', ['hike', 'trail']],
    [elena, 'Night market', '#3b2d4a', 'Steam and neon at midnight. #night #neon', ['night', 'neon']],
    [farid, 'Courtyard', '#7a5a3a', 'Shadow grid in the old courtyard. #architecture', ['architecture']],
    [gina, 'Neighbour', '#5c3d42', 'Mrs Dlamini on her stoep. #portrait', ['portrait']],
    [cara, 'Sunday loaf', '#8a6a45', 'Crust still singing. #food #home', ['food', 'home']],
    [diego, 'Cloud sea', '#4a6270', 'Inversion filling the valley. #hike', ['hike']],
  ];

  const posts = [];
  for (let i = 0; i < postMeta.length; i += 1) {
    const [creator, title, color, description, hashtags] = postMeta[i];
    const imageUrl = await writeSeedImage(`post-${i + 1}.svg`, title, color);
    posts.push(await Post.create({ creator: creator._id, imageUrl, description, hashtags }));
  }

  await Comment.create({ post: posts[0]._id, author: bob._id, text: 'That light is perfect.' });
  await Comment.create({ post: posts[0]._id, author: gina._id, text: '❤️', isEmoji: true });
  await Comment.create({ post: posts[2]._id, author: alice._id, text: 'I can hear the rain.' });
  await Comment.create({ post: posts[6]._id, author: farid._id, text: '🔥', isEmoji: true });

  await Album.create({
    owner: alice._id,
    name: 'Coastal week',
    description: 'Walks along the harbour and rocks.',
    hashtags: ['harbour', 'ocean'],
    posts: [posts[0]._id, posts[1]._id],
  });
  await Album.create({
    owner: bob._id,
    name: 'City rain',
    description: 'Johannesburg after a storm.',
    hashtags: ['street', 'rain'],
    posts: [posts[2]._id, posts[3]._id],
  });
  await Album.create({
    owner: cara._id,
    name: 'Kitchen days',
    description: 'Plants and bread.',
    hashtags: ['home', 'food'],
    posts: [posts[4]._id, posts[9]._id],
  });
  await Album.create({
    owner: diego._id,
    name: 'Ridges',
    description: 'Weekend trails.',
    hashtags: ['hike', 'trail'],
    posts: [posts[5]._id, posts[10]._id],
  });
  await Album.create({
    owner: elena._id,
    name: 'After dark',
    description: 'Markets that stay open too late.',
    hashtags: ['night', 'neon'],
    posts: [posts[6]._id],
  });

  await Report.create({ reporter: bob._id, post: posts[8]._id, reason: 'Spam or scam', status: 'active' });
  await Report.create({ reporter: cara._id, post: posts[8]._id, reason: 'False or misleading information', status: 'active' });
  await Report.create({ reporter: diego._id, post: posts[7]._id, reason: 'Spam or scam', status: 'active' });
  await Report.create({ reporter: elena._id, post: posts[7]._id, reason: 'Harassment or bullying', status: 'active' });
  await Report.create({ reporter: gina._id, post: posts[7]._id, reason: 'Other', explanation: 'Looks copied from another account.', status: 'active' });

  await Notification.create({
    user: farid._id,
    type: 'post_deleted',
    message: 'An administrator removed one of your posts.',
  });

  console.log('Seed complete.');
  console.log('Demo login: alice / Password123!  (admin / Password123! for moderation)');
  console.log(`Users: ${users.length}, posts: ${posts.length}, albums: 5`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
