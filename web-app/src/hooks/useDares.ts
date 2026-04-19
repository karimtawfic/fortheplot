import { useEffect, useState } from "react";
import { fetchActiveDares } from "../repositories/dareRepository";
import type { Dare } from "../types";

export function useDares() {
  const [dares, setDares] = useState<Dare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchActiveDares()
      .then(setDares)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { dares, loading, error };
}
