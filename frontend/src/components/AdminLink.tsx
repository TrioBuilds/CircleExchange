import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { canManageFeedback } from '../services/feedback';
import { canViewInsights } from '../features/admin/insights';

export default function AdminLink({ user }: { user: User }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.allSettled([canManageFeedback(user), canViewInsights(user)]).then((results) => {
      if (active)
        setVisible(results.some((result) => result.status === 'fulfilled' && result.value));
    });
    return () => {
      active = false;
    };
  }, [user]);
  return visible ? <a href="/admin">Admin tools</a> : null;
}
