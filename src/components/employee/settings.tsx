import { useEffect, useState } from 'react';

const [managers, setManagers] = useState([]);
useEffect(() => {
  async function fetchManagers() {
    const res = await fetch(`/api/my-managers`);
    const data = await res.json();
    setManagers(data.managers || []);
  }
  fetchManagers();
}, []);

<div>
  <h3>My Manager(s):</h3>
  <ul>{managers.map(m => (<li key={m.id}>{m.full_name}</li>))}</ul>
</div>

