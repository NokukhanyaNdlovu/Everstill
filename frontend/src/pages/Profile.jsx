import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';
import Toast from '../components/Toast';

export default function Profile() {
  const { username } = useParams();
  const { user: me, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [edit, setEdit] = useState({ name: '', bio: '', location: '', website: '' });
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', hashtags: '' });

  async function load() {
    setError('');
    try {
      const data = await api(`/api/users/${username}`);
      setProfile(data.user);
      setEdit({
        name: data.user.name || '',
        bio: data.user.bio || '',
        location: data.user.location || '',
        website: data.user.website || '',
      });
      const [postData, albumData, requestData] = await Promise.all([
        api(`/api/users/${username}/posts`),
        api(`/api/users/${username}/albums`),
        me ? api('/api/friends/requests') : Promise.resolve({ incoming: [], outgoing: [] }),
      ]);
      setPosts(postData.posts || []);
      setAlbums(albumData.albums || []);
      setRequests(requestData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p className="muted">Loading profile…</p>;

  const isSelf = me && me.username === profile.username;

  
async function saveProfile(event) {
  event.preventDefault();

  try {
    const data = await api('/api/users/me', {
      method: 'PATCH',
      body: edit,
    });

    setUser(data.user);
    setProfile(data.user);
    setToastMessage(data.message || 'Profile updated successfully.');
  } catch (err) {
    setToastMessage(err.message || 'Unable to save your profile. Please try again.');
  }
}


  async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    const form = new FormData();
    form.append('image', file);
  
    try {
      const data = await api('/api/users/me/avatar', {
        method: 'POST',
        form,
      });
  
      setUser(data.user);
      setProfile(data.user);
      setToastMessage('Profile picture updated successfully.');
    } catch (err) {
      setToastMessage(err.message || 'Unable to upload profile picture.');
    } finally {
      event.target.value = '';
    }
  }

  async function sendRequest() {
    await api('/api/friends/request', { method: 'POST', body: { userId: profile.id } });
    await load();
  }

  async function unfriend() {
    await api('/api/friends/unfriend', { method: 'POST', body: { userId: profile.id } });
    await load();
  }

  async function createAlbum(event) {
    event.preventDefault();
    await api('/api/albums', { method: 'POST', body: albumForm });
    setAlbumForm({ name: '', description: '', hashtags: '' });
    await load();
  }

  return (
    <section className="profile-page">
      <Toast
  message={toastMessage}
  onClose={() => setToastMessage('')}
/>
      <div className="card profile-hero">
        {profile.profilePicture && <img src={profile.profilePicture} alt="" className="avatar" />}
        <div>
          <h1>{profile.name}</h1>
          {profile.limited ? (
            <p className="muted">Only name and profile picture are visible until you are friends.</p>
          ) : (
            <>
              <p className="muted">@{profile.username}</p>
              <p>{profile.bio}</p>
              <p className="muted">
                {profile.location} {profile.website}
              </p>
            </>
          )}
          {!isSelf && me && profile.isFriend && (
  <button type="button" onClick={unfriend}>
    Unfriend
  </button>
)}

{!isSelf && me && !profile.isFriend && (() => {
  const incomingRequest = requests.incoming.find(
    (item) => item.user.username === profile.username
  );

  const outgoingRequest = requests.outgoing.find(
    (item) => item.user.username === profile.username
  );

  if (incomingRequest) {
    return (
      <div>
        <p>This person sent you a friend request.</p>
        <button
          type="button"
          onClick={async () => {
            await api('/api/friends/accept', {
              method: 'POST',
              body: { requestId: incomingRequest.id },
            });
            await load();
          }}
        >
          Accept request
        </button>
        <button
          type="button"
          onClick={async () => {
            await api('/api/friends/decline', {
              method: 'POST',
              body: { requestId: incomingRequest.id },
            });
            await load();
          }}
        >
          Decline request
        </button>
      </div>
    );
  }

  if (outgoingRequest) {
    return <p className="muted">Friend request pending</p>;
  }

  return (
    <button type="button" onClick={sendRequest}>
      Send friend request
    </button>
  );
})()}
        </div>
      </div>

      {isSelf && (
        <form className="card stack" onSubmit={saveProfile}>
          <h2>Edit profile</h2>
          <label>
            Name
            <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
          </label>
          <label>
            Bio
            <textarea value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} />
          </label>
          <label>
            Location
            <input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
          </label>
          <label>
            Website
            <input value={edit.website} onChange={(e) => setEdit({ ...edit, website: e.target.value })} />
          </label>
          <label>
            Profile picture
            <input type="file" accept="image/*" onChange={uploadAvatar} />
          </label>
          <button type="submit">Save profile</button>
        </form>
      )}

      {isSelf && (
        <section className="card">
          <h2>Friend requests</h2>
          {requests.incoming.length === 0 && <p className="empty">No incoming requests.</p>}
          {requests.incoming.map((item) => (
            <div key={item.id} className="row">
              <Link to={`/users/${item.user.username}`}>{item.user.name}</Link>
              <button
                type="button"
                onClick={async () => {
                  await api('/api/friends/accept', { method: 'POST', body: { requestId: item.id } });
                  await load();
                }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={async () => {
                  await api('/api/friends/decline', { method: 'POST', body: { requestId: item.id } });
                  await load();
                }}
              >
                Decline
              </button>
            </div>
          ))}
        </section>
      )}

      {!profile.limited && (
        <>
          <section>
            <h2>Albums</h2>
            {isSelf && (
              <form className="card stack" onSubmit={createAlbum}>
                <h3>New album</h3>
                <input
                  placeholder="Name"
                  value={albumForm.name}
                  onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Description"
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                />
                <input
                  placeholder="hashtags"
                  value={albumForm.hashtags}
                  onChange={(e) => setAlbumForm({ ...albumForm, hashtags: e.target.value })}
                />
                <button type="submit">Create album</button>
              </form>
            )}
            <div className="album-grid">
              {albums.map((album) => (
                <Link key={album.id} className="card album-tile" to={`/albums/${album.id}`}>
                  <h3>{album.name}</h3>
                  <p>{album.description}</p>
                  <p className="muted">{album.postCount} photos</p>
                </Link>
              ))}
              {albums.length === 0 && <p className="empty">No albums yet.</p>}
            </div>
          </section>
          <section className="feed-list">
            <h2>Posts</h2>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onChange={load} />
            ))}
            {posts.length === 0 && <p className="empty">No posts to show.</p>}
          </section>
        </>
      )}
    </section>
  );
}
