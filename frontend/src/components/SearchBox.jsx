import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return undefined;
    }
    const handle = setTimeout(() => {
      api(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`)
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onDoc(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function submit(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form className="search-box" onSubmit={submit} ref={boxRef}>
      <input
        type="search"
        placeholder="Search people, posts, albums, #tags"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search"
      />
      {open && suggestions.length > 0 && (
        <ul className="suggest-list">
          {suggestions.map((item) => (
            <li key={`${item.type}-${item.href}-${item.label}`}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(item.href);
                }}
              >
                <span className="suggest-type">{item.type}</span>
                <span>{item.label}</span>
                {item.sublabel && <em>{item.sublabel}</em>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
