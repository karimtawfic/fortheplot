import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { fetchCollection } from "../lib/firestore";
import type { Dare } from "../types";

export async function fetchActiveDares(): Promise<Dare[]> {
  const q = query(collection(db, "dares"), where("active", "==", true));
  return fetchCollection<Dare>(q);
}
