const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const BACKUPS_DIR = path.join(PUBLIC_DIR, "backups");

if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// Simple in-file metadata store (JSON file)
const META_FILE = path.join(BACKUPS_DIR, "backups.json");
function readMeta() {
  try {
    if (!fs.existsSync(META_FILE)) return [];
    return JSON.parse(fs.readFileSync(META_FILE, "utf8")) || [];
  } catch (e) {
    return [];
  }
}
function writeMeta(arr) {
  fs.writeFileSync(META_FILE, JSON.stringify(arr, null, 2));
}

exports.listBackups = async (req, res) => {
  const items = readMeta();
  res.json(items);
};

// Create a backup zip that includes:
// - public/uploads/ (files)
// - db/ collection dumps (one JSON file per collection)
// - db/metadata.json
exports.createBackup = async (req, res) => {
  try {
    const id = uuidv4();
    const filename = `${Date.now()}-${id}.zip`;
    const outPath = path.join(BACKUPS_DIR, filename);

    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      try {
        const stat = fs.statSync(outPath);
        const entry = {
          id,
          name: filename,
          filename,
          createdAt: new Date().toISOString(),
          size: stat.size,
          path: `/backups/${filename}`,
        };
        const meta = readMeta();
        meta.unshift(entry);
        writeMeta(meta);
        res.status(201).json(entry);
      } catch (e) {
        console.error(e);
        res.status(500).send("failed to finalize backup");
      }
    });

    archive.on("error", (err) => {
      console.error(err);
      // if headers not sent
      try {
        if (!res.headersSent) res.status(500).send("archive error");
      } catch (e) {}
    });

    archive.pipe(output);

    // add uploads folder
    if (fs.existsSync(UPLOADS_DIR)) {
      archive.directory(UPLOADS_DIR, "uploads");
    }

    // Dump all MongoDB collections into db/*.json inside the archive
    try {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        let names = collections.map((c) => c.name).filter(Boolean);

        // exclude Admins collection(s) from backups
        const excluded = new Set(["admin", "admins"]);
        names = names.filter((n) => !excluded.has(String(n).toLowerCase()));

        for (const name of names) {
          try {
            const docs = await db.collection(name).find({}).toArray();
            const content = JSON.stringify(docs, null, 2);
            archive.append(content, { name: `db/${name}.json` });
          } catch (e) {
            console.error(`failed to dump collection ${name}:`, e.message);
            archive.append(JSON.stringify({ error: e.message }, null, 2), {
              name: `db/${name}.json`,
            });
          }
        }

        // metadata about the DB dump
        const meta = {
          exportedAt: new Date().toISOString(),
          dbName: db.databaseName || process.env.MONGO_URI || null,
          collections: names,
        };
        archive.append(JSON.stringify(meta, null, 2), {
          name: `db/metadata.json`,
        });
      } else {
        archive.append(JSON.stringify({ error: "no-db-connection" }), {
          name: `db/metadata.json`,
        });
      }
    } catch (err) {
      console.error("db dump error:", err.message || err);
      archive.append(
        JSON.stringify({ error: err.message || String(err) }, null, 2),
        { name: `db/metadata.json` }
      );
    }

    // finalize the archive after we've appended files
    archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send("failed to create backup");
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const id = req.params.id;
    const meta = readMeta();
    const item = meta.find(
      (m) => m.id === id || m.filename === id || m.name === id
    );
    if (!item) return res.status(404).send("not found");
    const filePath = path.join(BACKUPS_DIR, item.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("file missing");
    res.download(filePath, item.filename);
  } catch (err) {
    console.error(err);
    res.status(500).send("download failed");
  }
};
