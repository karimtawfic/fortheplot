import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

const db = admin.firestore();

interface SeedDare {
  id: string;
  text: string;
  points: number;
  category: string;
  active: boolean;
}

export const validateAndSeedDares = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Protect with a simple shared secret
    const adminSecret = functions.config().render?.admin_secret || "local-dev-secret";
    const provided = req.headers["x-admin-secret"];

    if (provided !== adminSecret) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    try {
      // Load seed data from bundled JSON
      const seedPath = path.join(__dirname, "../../../../Seed/dares.json");
      let dares: SeedDare[];

      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, "utf8");
        dares = JSON.parse(raw) as SeedDare[];
        functions.logger.info(`Loaded ${dares.length} dares from Seed/dares.json`);
      } else {
        // Fallback: minimal hardcoded set
        dares = [
          { id: "dare_fallback_001", text: "Take a selfie in a funny location", points: 20, category: "social", active: true },
          { id: "dare_fallback_002", text: "Do 10 jumping jacks in public", points: 30, category: "physical", active: true },
          { id: "dare_fallback_003", text: "Draw a 1-minute portrait", points: 40, category: "creative", active: true },
        ];
        functions.logger.warn("Seed/dares.json not found, using fallback dares.");
      }

      const batch = db.batch();
      let count = 0;

      for (const dare of dares) {
        if (!dare.id || !dare.text || !dare.points || !dare.category) {
          functions.logger.warn(`Skipping invalid dare: ${JSON.stringify(dare)}`);
          continue;
        }

        const ref = db.collection("dares").doc(dare.id);
        batch.set(ref, {
          dareId: dare.id,
          text: dare.text,
          points: dare.points,
          category: dare.category,
          active: dare.active !== false,
        });
        count++;
      }

      await batch.commit();

      functions.logger.info(`Seeded ${count} dares successfully.`);
      res.status(200).json({ success: true, count });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      functions.logger.error("Seed failed:", message);
      res.status(500).json({ error: message });
    }
  }
);
