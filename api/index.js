import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import dns from 'dns';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// Don't exit on Vercel, otherwise it returns HTML 500 pages instead of JSON
if (!MONGODB_URI && !process.env.VERCEL) {
  console.error("Error: MONGODB_URI is not defined in the environment variables.");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`, req.body);
  next();
});

let db;
let client;

async function connectDB() {
  if (db) return db; // reuse connection if already connected

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in Vercel Environment Variables");
  }

  if (!client) {
    client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  }

  try {
    await client.connect();
    db = client.db('bantaybayan');
    console.log("Successfully connected to MongoDB");

    // Seed initial data if collections are empty
    await seedDatabase();
    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas", err);
    if (!process.env.VERCEL) {
      console.warn("Attempting local MongoDB fallback...");
      try {
        client = new MongoClient("mongodb://127.0.0.1:27017");
        await client.connect();
        db = client.db('bantaybayan');
        console.log("Successfully connected to local MongoDB");
        await seedDatabase();
        return db;
      } catch (localErr) {
        console.error("Failed to connect to local MongoDB as well:", localErr);
        process.exit(1);
      }
    }
    throw err;
  }
}

function inferMunicipalityJS(addressInput) {
  if (!addressInput) return undefined;
  const text = addressInput.toLowerCase().replace(/(metro manila|national capital region|\bncr\b|philippines)/ig, ' ');
  if (text.includes('malabon') || text.includes('potrero') || text.includes('longos') || text.includes('tonsuya') || text.includes('catmon')) return 'Malabon City';
  if (text.includes('quezon') || text.includes('qc') || text.includes('cubao') || text.includes('diliman') || text.includes('commonwealth') || text.includes('fairview') || text.includes('novaliches') || text.includes('katipunan')) return 'Quezon City';
  if (text.includes('makati') || text.includes('ayala ave') || text.includes('bel-air') || text.includes('guadalupe') || text.includes('cembo') || text.includes('rembo') || text.includes('pembo') || text.includes('poblacion makati')) return 'Makati City';
  if (text.includes('taguig') || text.includes('bgc') || text.includes('bonifacio global city') || text.includes('fort bonifacio') || text.includes('bicutan') || text.includes('ususan')) return 'Taguig City';
  if (text.includes('pasig') || text.includes('ortigas') || text.includes('kapitolyo') || text.includes('rosario pasig') || text.includes('manggahan') || text.includes('ugong')) return 'Pasig City';
  if (text.includes('caloocan') || text.includes('monumento') || text.includes('grace park') || text.includes('bagong silang') || text.includes('camarin')) return 'Caloocan City';
  if (text.includes('mandaluyong') || text.includes('shaw blvd') || text.includes('boni ave') || text.includes('greenfield') || text.includes('wack-wack') || text.includes('barangka')) return 'Mandaluyong City';
  if (text.includes('marikina') || text.includes('concepcion marikina') || text.includes('tumana') || text.includes('nangka') || text.includes('parang marikina')) return 'Marikina City';
  if (text.includes('paranaque') || text.includes('parañaque') || text.includes('bf homes') || text.includes('sucat') || text.includes('baclaran')) return 'Parañaque City';
  if (text.includes('las pinas') || text.includes('las piñas') || text.includes('almanza') || text.includes('pamplona') || text.includes('zapote')) return 'Las Piñas City';
  if (text.includes('valenzuela') || text.includes('karuhatan') || text.includes('malinta') || text.includes('gen. t. de leon') || text.includes('marulas')) return 'Valenzuela City';
  if (text.includes('navotas') || text.includes('tangos') || text.includes('tanza navotas') || text.includes('sipac')) return 'Navotas City';
  if (text.includes('muntinlupa') || text.includes('alabang') || text.includes('ayala alabang') || text.includes('putatan') || text.includes('cupang')) return 'Muntinlupa City';
  if (text.includes('pasay') || text.includes('mall of asia') || text.includes('moa') || text.includes('taft pasay') || text.includes('newport')) return 'Pasay City';
  if (text.includes('san juan') || text.includes('greenhills') || text.includes('little baguio') || text.includes('addition hills san juan')) return 'San Juan City';
  if (text.includes('pateros') || text.includes('aguho') || text.includes('magtanggol')) return 'Municipality of Pateros';
  if (text.includes('manila') || text.includes('tondo') || text.includes('sampaloc') || text.includes('ermita') || text.includes('malate') || text.includes('quiapo') || text.includes('binondo') || text.includes('intramuros') || text.includes('santa cruz') || text.includes('paco') || text.includes('pandacan')) return 'City of Manila';
  return undefined;
}

// Seed helper function
async function seedDatabase() {
  // Seed default admin and citizen accounts
  const seedAccounts = [
    {
      username: 'admin',
      displayName: 'System Admin',
      password: 'admin',
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      reportsCount: 0,
      upvotesCount: 0,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: { pushEnabled: true, newPinNearby: true, replyReceived: true, upvotesOnPost: true }
    },
    {
      username: 'juandelacruz',
      displayName: 'Juan dela Cruz',
      password: 'juandelacruz',
      role: 'citizen',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      reportsCount: 1,
      upvotesCount: 35,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: { pushEnabled: true, newPinNearby: true, replyReceived: true, upvotesOnPost: true }
    },
    {
      username: 'testcitizen',
      displayName: 'Test Citizen',
      password: 'Testcitizen123',
      role: 'citizen',
      isVerified: false,
      verificationStatus: 'pending',
      createdAt: new Date(),
      reportsCount: 0,
      upvotesCount: 0,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: { pushEnabled: true, newPinNearby: true, replyReceived: true, upvotesOnPost: true }
    },
    {
      username: 'bfp-malabon',
      displayName: 'BFP Malabon',
      password: 'bfp-malabon',
      role: 'authority',
      governmentCategory: 'BFP',
      municipality: 'Malabon',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      reportsCount: 0,
      upvotesCount: 0,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: { pushEnabled: true, newPinNearby: true, replyReceived: true, upvotesOnPost: true }
    },
    {
      username: 'lgu-malabon',
      displayName: 'Malabon LGU Officer',
      password: 'lgu-malabon',
      role: 'lgu',
      governmentCategory: 'LGU',
      municipality: 'Malabon',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      reportsCount: 0,
      upvotesCount: 0,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: { pushEnabled: true, newPinNearby: true, replyReceived: true, upvotesOnPost: true }
    }
  ];

  for (const acc of seedAccounts) {
    const exists = await db.collection('accounts').findOne({ username: acc.username });
    if (!exists) {
      await db.collection('accounts').insertOne(acc);
      console.log(`Seeded initial account @${acc.username}`);
    }
  }

  // Seed default pins & reports
  const hasSeededPins = await db.collection('reports').findOne({ reportedBy: 'testcitizen' });
  if (!hasSeededPins) {
    await db.collection('pins').deleteMany({});
    await db.collection('reports').deleteMany({});
    const initialPins = [
      {
        type: 'flood', hazardLevel: 'life-threatening',
        lat: 14.6299, lng: 120.9719,
        title: 'Baha sa Tondo Market',
        address: 'Tondo, Manila',
        reportedBy: 'testcitizen', timeAgo: '5 mins ago',
        upvotes: 24,
        description: 'Knee-deep floodwater near the public market. Road is completely impassable. Avoid this area.',
        status: 'unresolved', threadCount: 7,
        createdAt: new Date()
      },
      {
        type: 'infrastructure', hazardLevel: 'needs-attention',
        lat: 14.5794, lng: 120.9961,
        title: 'Road construction at Quirino Ave',
        address: 'Paco, Manila',
        reportedBy: 'maryreyes', timeAgo: '23 mins ago',
        upvotes: 12,
        description: 'Ongoing road works causing single-lane traffic. Expect 20–30 minute delays.',
        status: 'pending-resolution', threadCount: 3,
        createdAt: new Date()
      },
      {
        type: 'utility-outages', hazardLevel: 'urgent',
        lat: 14.5786, lng: 120.9822,
        title: 'Natumbang Poste, Ermita',
        address: 'Ermita, Manila',
        reportedBy: 'juandelacruz', timeAgo: '41 mins ago',
        upvotes: 35,
        description: "Electric pole down after last night's storm. Live wires on road. DANGER! Keep away.",
        status: 'pending-resolution', threadCount: 12,
        createdAt: new Date()
      }
    ];
    const pinResults = await db.collection('pins').insertMany(initialPins);
    console.log("Seeded initial pins data");

    const reportsCount = await db.collection('reports').countDocuments();
    if (reportsCount === 0) {
      const pinIds = Object.values(pinResults.insertedIds);
      const initialReports = [
        {
          typeName: 'Flood', typeKey: 'flood',
          moreDetails: 'Knee-deep near Tondo Market',
          date: 'June 30, 2026', time: '02:25 AM',
          location: 'Tondo, Manila',
          status: 'unresolved',
          reportedBy: 'testcitizen',
          pinId: pinIds[0],
          createdAt: new Date()
        },
        {
          typeName: 'Infrastructure & Public Works', typeKey: 'infrastructure',
          moreDetails: 'Road construction at Quirino Ave',
          date: 'June 30, 2026', time: '04:12 AM',
          location: 'Paco, Manila',
          status: 'pending-resolution',
          reportedBy: 'maryreyes',
          pinId: pinIds[1],
          createdAt: new Date()
        },
        {
          typeName: 'Utility Outages', typeKey: 'utility-outages',
          moreDetails: 'Natumbang Poste blocking Ermita St.',
          date: 'June 30, 2026', time: '05:05 AM',
          location: 'Ermita, Manila',
          status: 'pending-resolution',
          reportedBy: 'juandelacruz',
          pinId: pinIds[2],
          createdAt: new Date()
        }
      ];
      await db.collection('reports').insertMany(initialReports);
      console.log("Seeded initial reports data");
    }
  }

  // Seed default notifications
  const notificationsCount = await db.collection('notifications').countDocuments();
  if (notificationsCount === 0) {
    const initialNotifications = [
      {
        targetUser: 'juandelacruz',
        type: 'new-report',
        isNew: true,
        title: 'Flood reported at Tondo Market',
        subtitle: 'Tondo, Manila',
        detail: 'Knee-deep floodwater near the public market entrance. Passable with care.',
        timeAgo: '7 mins ago',
        createdAt: new Date(Date.now() - 7 * 60 * 1000)
      },
      {
        targetUser: 'juandelacruz',
        type: 'reply',
        isNew: true,
        title: 'maryreyes replied to your comment',
        subtitle: 'Natumbang Poste, Ermita',
        detail: 'BFP is already on the way to clear the wires.',
        timeAgo: '15 mins ago',
        createdAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        targetUser: 'juandelacruz',
        type: 'upvote',
        isNew: false,
        title: '24 upvotes on your report',
        subtitle: 'Natumbang Poste, Ermita',
        detail: 'Your report has received 24 upvotes from the community.',
        timeAgo: '1 hr ago',
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      }
    ];
    await db.collection('notifications').insertMany(initialNotifications);
    console.log("Seeded initial notifications data");
  }

  // Migrate database statuses and clean up old complaint tags
  try {
    const validTags = ['flood', 'road-damage', 'peace-and-order', 'utility-outages', 'waste-collection', 'infrastructure', 'fire', 'other'];
    const removedPins = await db.collection('pins').deleteMany({ type: { $nin: validTags } });
    const removedReports = await db.collection('reports').deleteMany({
      typeKey: { $nin: validTags },
      type: { $nin: validTags }
    });
    if (removedPins.deletedCount > 0 || removedReports.deletedCount > 0) {
      console.log(`Removed ${removedPins.deletedCount} pins and ${removedReports.deletedCount} reports with old complaint tags.`);
    }

    // Fix mislabeled municipality tags on existing pins/reports
    const allPins = await db.collection('pins').find({}).toArray();
    for (const p of allPins) {
      const correctMuni = inferMunicipalityJS(p.address || p.location || p.title);
      if (correctMuni && p.municipality !== correctMuni) {
        await db.collection('pins').updateOne({ _id: p._id }, { $set: { municipality: correctMuni } });
      }
    }
    const allReports = await db.collection('reports').find({}).toArray();
    for (const r of allReports) {
      const correctMuni = inferMunicipalityJS(r.location || r.address || r.typeName);
      if (correctMuni && r.municipality !== correctMuni) {
        await db.collection('reports').updateOne({ _id: r._id }, { $set: { municipality: correctMuni } });
      }
    }

    await db.collection('pins').updateMany({ status: 'pending' }, { $set: { status: 'unresolved' } });
    await db.collection('pins').updateMany({ status: 'pending-approval' }, { $set: { status: 'unresolved' } });
    await db.collection('pins').updateMany({ status: 'in-progress' }, { $set: { status: 'pending-resolution' } });
    await db.collection('pins').updateMany({ status: 'acknowledged' }, { $set: { status: 'pending-resolution' } });
    await db.collection('reports').updateMany({ status: 'pending' }, { $set: { status: 'unresolved' } });
    await db.collection('reports').updateMany({ status: 'pending-approval' }, { $set: { status: 'unresolved' } });
    await db.collection('reports').updateMany({ status: 'in-progress' }, { $set: { status: 'pending-resolution' } });
    await db.collection('reports').updateMany({ status: 'acknowledged' }, { $set: { status: 'pending-resolution' } });
    console.log("Database statuses successfully migrated to unresolved and pending-resolution");
  } catch (err) {
    console.error("Database migration error:", err);
  }
}

// Middleware to ensure database connection in serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database Connection Error: " + err.message });
  }
});

/* ==========================================================================
   PINS ENDPOINTS (/api/pins)
   ========================================================================== */

// Get all pins
app.get('/api/pins', async (req, res) => {
  try {
    const pins = await db.collection('pins').find({}).toArray();
    // Map _id to id for the frontend
    const formatted = pins.map(p => ({ ...p, id: p._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new pin (submit a report on the map)
app.post('/api/pins', async (req, res) => {
  try {
    const newPin = {
      type: req.body.type,
      hazardLevel: req.body.hazardLevel || 'needs-attention',
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      title: req.body.title || 'Reported Hazard',
      address: req.body.address || 'Unknown Location',
      reportedBy: req.body.reportedBy || 'anonymous',
      timeAgo: 'Just now',
      upvotes: 0,
      description: req.body.description || '',
      status: 'unresolved',
      threadCount: 0,
      photo: req.body.photo || null,
      photos: req.body.photos || (req.body.photo ? [req.body.photo] : []),
      verificationStatus: 'pending',
      municipality: req.body.municipality || undefined,
      createdAt: new Date()
    };

    const result = await db.collection('pins').insertOne(newPin);

    // Also save as user's report history
    const userReport = {
      typeName: req.body.title || 'Reported Hazard',
      typeKey: req.body.type,
      moreDetails: req.body.description || '',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      location: req.body.address || 'Unknown Location',
      status: 'unresolved',
      photo: req.body.photo || null,
      photos: req.body.photos || (req.body.photo ? [req.body.photo] : []),
      radius: req.body.radius ? Number(req.body.radius) : undefined,
      verificationStatus: 'pending',
      municipality: req.body.municipality || undefined,
      pinId: result.insertedId,
      reportedBy: req.body.reportedBy || 'anonymous'
    };
    await db.collection('reports').insertOne(userReport);

    // Trigger "New Hazard Nearby" notification for all other users
    const otherAccounts = await db.collection('accounts').find({ username: { $ne: req.body.reportedBy } }).toArray();
    for (const acc of otherAccounts) {
      if (acc.notifSettings?.newPinNearby !== false) {
        await db.collection('notifications').insertOne({
          targetUser: acc.username,
          type: 'new-report',
          isNew: true,
          pinId: result.insertedId.toString(),
          title: `New ${req.body.title || 'hazard'} reported nearby`,
          subtitle: req.body.address || 'Nearby location',
          detail: req.body.description || 'Be careful while traveling through this area.',
          timeAgo: 'Just now',
          createdAt: new Date()
        });
      }
    }

    res.status(201).json({ ...newPin, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a pin
app.put('/api/pins/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;

    const pinUpdate = {
      type: req.body.type,
      title: req.body.title || 'Reported Hazard',
      address: req.body.address || 'Unknown Location',
      description: req.body.description || '',
      photo: req.body.photo || null,
      photos: req.body.photos || (req.body.photo ? [req.body.photo] : [])
    };
    if (req.body.lat !== undefined) pinUpdate.lat = Number(req.body.lat);
    if (req.body.lng !== undefined) pinUpdate.lng = Number(req.body.lng);
    if (req.body.municipality !== undefined) pinUpdate.municipality = req.body.municipality;

    const pinResult = await db.collection('pins').updateOne(
      { _id: new ObjectId(id) },
      { $set: pinUpdate }
    );

    if (pinResult.matchedCount === 0) {
      return res.status(404).json({ error: "Pin not found" });
    }

    // Also update the associated report
    const reportUpdate = {
      typeKey: req.body.type,
      typeName: req.body.title || 'Reported Hazard',
      location: req.body.address || 'Unknown Location',
      moreDetails: req.body.description || '',
      photo: req.body.photo || null,
      photos: req.body.photos || (req.body.photo ? [req.body.photo] : [])
    };
    if (req.body.municipality !== undefined) reportUpdate.municipality = req.body.municipality;

    await db.collection('reports').updateOne(
      { pinId: new ObjectId(id) },
      {
        $set: reportUpdate
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a pin
app.delete('/api/pins/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pinResult = await db.collection('pins').deleteOne({ _id: new ObjectId(id) });
    if (pinResult.deletedCount === 0) {
      return res.status(404).json({ error: "Pin not found" });
    }

    // Also delete the associated report
    await db.collection('reports').deleteOne({ pinId: new ObjectId(id) });

    // Also delete associated comments
    await db.collection('comments').deleteMany({ pinId: id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upvote a pin
app.post('/api/pins/:id/upvote', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('pins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { upvotes: 1 } },
      { returnDocument: 'after' }
    );
    if (!result) {
      return res.status(404).json({ error: "Pin not found" });
    }

    // Trigger "Upvote Received" notification for the author
    if (result.reportedBy) {
      const authorAccount = await db.collection('accounts').findOne({ username: result.reportedBy });
      if (!authorAccount || authorAccount.notifSettings?.upvotesOnPost !== false) {
        const notifTitle = `${result.upvotes} upvotes on your report`;
        await db.collection('notifications').updateOne(
          { targetUser: result.reportedBy, type: 'upvote', subtitle: result.title },
          {
            $set: {
              isNew: true,
              title: notifTitle,
              detail: `Your report "${result.title}" has received ${result.upvotes} upvotes.`,
              timeAgo: 'Just now',
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }

    res.json({ id: result._id.toString(), upvotes: result.upvotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unupvote a pin
app.post('/api/pins/:id/unupvote', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('pins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { upvotes: -1 } },
      { returnDocument: 'after' }
    );
    if (!result) {
      return res.status(404).json({ error: "Pin not found" });
    }
    res.json({ id: result._id.toString(), upvotes: result.upvotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   ROUTES ENDPOINTS (/api/routes)
   ========================================================================== */

// Get all saved routes
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await db.collection('routes').find({}).toArray();
    const formatted = routes.map(r => ({ ...r, id: r._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a route
app.post('/api/routes', async (req, res) => {
  try {
    const newRoute = {
      name: req.body.name,
      from: req.body.from,
      to: req.body.to,
      distance: req.body.distance,
      duration: req.body.duration,
      lastEdited: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      nearbyReports: req.body.nearbyReports || 0,
      travelMode: req.body.travelMode,
      routePath: req.body.routePath || []
    };
    const result = await db.collection('routes').insertOne(newRoute);
    res.status(201).json({ ...newRoute, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a saved route
app.delete('/api/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('routes').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json({ success: true, message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a saved route
app.put('/api/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = {
      name: req.body.name,
      from: req.body.from,
      to: req.body.to,
      distance: req.body.distance,
      duration: req.body.duration,
      lastEdited: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      nearbyReports: req.body.nearbyReports || 0,
      travelMode: req.body.travelMode,
      routePath: req.body.routePath || [],
    };
    const result = await db.collection('routes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: "Route not found" });
    res.json({ ...result, id: result._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ==========================================================================
   REPORTS ENDPOINTS (/api/reports)
   ========================================================================== */

// Get all user reports (filtered by username if specified)
app.get('/api/reports', async (req, res) => {
  try {
    const { username } = req.query;
    let query = {};
    if (username) {
      // Find pin IDs reported by this user to fetch associated reports
      const userPins = await db.collection('pins').find({ reportedBy: username }).toArray();
      const pinIds = userPins.map(p => p._id);
      
      query = {
        $or: [
          { reportedBy: username },
          { pinId: { $in: pinIds } }
        ]
      };
    }
    const reports = await db.collection('reports').find(query).toArray();
    const formatted = reports.map(r => ({ ...r, id: r._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a report (and its associated pin and comments if it exists)
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the report first
    const report = await db.collection('reports').findOne({ _id: new ObjectId(id) });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    // Delete the report
    await db.collection('reports').deleteOne({ _id: new ObjectId(id) });
    
    // If it has a pinId, delete the pin and comments
    if (report.pinId) {
      await db.collection('pins').deleteOne({ _id: new ObjectId(report.pinId) });
      await db.collection('comments').deleteMany({ pinId: report.pinId.toString() });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   ACCOUNTS ENDPOINTS (/api/accounts)
   ========================================================================== */

// Get or create account profile (Mock/Simple Account system)
app.post('/api/accounts/profile', async (req, res) => {
  try {
    const { username, language, password, action, municipality, displayName } = req.body;
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '').trim();
    let account = await db.collection('accounts').findOne({ username: cleanUsername });

    if (action === 'signup') {
      if (account) {
        return res.status(200).json({ error: "Username already taken." });
      }
      account = {
        username: cleanUsername,
        displayName: displayName || cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
        password: password || '',
        municipality: municipality || '',
        language: language || 'en',
        createdAt: new Date(),
        isVerified: false,
        verificationStatus: 'unverified',
        role: 'citizen',
        reportsCount: 0,
        upvotesCount: 0,
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        notifSettings: {
          pushEnabled: true,
          newPinNearby: true,
          replyReceived: true,
          upvotesOnPost: true
        }
      };
      const result = await db.collection('accounts').insertOne(account);
      account.id = result.insertedId.toString();
      return res.status(201).json(account);
    } else {
      // Login mode
      if (!account) {
        return res.status(200).json({ error: "User not found. Please Sign Up first." });
      }
      if (password) {
        if (account.password && account.password !== password) {
          return res.status(200).json({ error: "Incorrect password." });
        } else if (!account.password) {
          // Backward compatibility: set password on first login
          await db.collection('accounts').updateOne(
            { _id: account._id },
            { $set: { password: password } }
          );
          account.password = password;
        }
      }

      // Ensure defaults exist for existing accounts
      account.id = account._id.toString();
      account.displayName = account.displayName || account.username;
      account.role = account.role || 'citizen';
      account.isVerified = account.isVerified !== undefined ? account.isVerified : false;
      account.verificationStatus = account.verificationStatus || 'unverified';
      account.reportsCount = account.reportsCount !== undefined ? account.reportsCount : 0;
      account.upvotesCount = account.upvotesCount !== undefined ? account.upvotesCount : 0;
      account.joinedDate = account.joinedDate || 'Member since June 2026';
      account.municipality = account.municipality || '';
      account.notifSettings = account.notifSettings || {
        pushEnabled: true,
        newPinNearby: true,
        replyReceived: true,
        upvotesOnPost: true
      };
      return res.json(account);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile details
app.put('/api/accounts/profile', async (req, res) => {
  try {
    const { id, displayName, avatarUrl, notifSettings, verificationStatus, isVerified, password, municipality } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Missing account ID" });
    }
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (notifSettings !== undefined) updateData.notifSettings = notifSettings;
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (password !== undefined) updateData.password = password;
    if (municipality !== undefined) updateData.municipality = municipality;

    const result = await db.collection('accounts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: "Account not found" });
    const formatted = { ...result, id: result._id.toString() };
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin creates authority/LGU accounts
app.post('/api/accounts/create-authority', async (req, res) => {
  try {
    const { adminUsername, username, displayName, password, role, governmentCategory, municipality } = req.body;

    // Check if requester is admin
    const requester = await db.collection('accounts').findOne({ username: adminUsername, role: 'admin' });
    if (!requester) {
      return res.status(200).json({ error: "Only admins can create authority/LGU accounts." });
    }

    const cleanUsername = username.toLowerCase().replace(/\s+/g, '').trim();
    const existing = await db.collection('accounts').findOne({ username: cleanUsername });
    if (existing) {
      return res.status(200).json({ error: "Username already taken." });
    }

    if (!['authority', 'lgu'].includes(role)) {
      return res.status(200).json({ error: "Invalid role. Must be 'authority' or 'lgu'." });
    }

    const newAccount = {
      username: cleanUsername,
      displayName: displayName || cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
      password: password || '123456',
      role: role,
      governmentCategory: governmentCategory || 'LGU',
      municipality: municipality || '',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date(),
      reportsCount: 0,
      upvotesCount: 0,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      notifSettings: {
        pushEnabled: true,
        newPinNearby: true,
        replyReceived: true,
        upvotesOnPost: true
      }
    };

    const result = await db.collection('accounts').insertOne(newAccount);
    newAccount.id = result.insertedId.toString();
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin fetches created authority/LGU accounts
app.get('/api/accounts/authorities', async (req, res) => {
  try {
    const { adminUsername } = req.query;
    const requester = await db.collection('accounts').findOne({ username: adminUsername, role: 'admin' });
    if (!requester) {
      return res.status(200).json({ error: "Access denied. Only admins can view this list." });
    }
    const list = await db.collection('accounts').find({ role: { $in: ['authority', 'lgu'] } }).toArray();
    res.json(list.map(u => ({ ...u, id: u._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch pending verification accounts for LGU/Admin review
app.get('/api/accounts/pending-verifications', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const requester = await db.collection('accounts').findOne({ username });
    if (!requester || !['lgu', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: "Access denied. Only LGU responders or admins can view pending verifications." });
    }
    
    // Find all citizen accounts requesting verification
    const list = await db.collection('accounts')
      .find({ role: 'citizen', verificationStatus: 'pending' })
      .toArray();
      
    res.json(list.map(u => ({ ...u, id: u._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LGU/Admin verifies or rejects a citizen's verification request
app.put('/api/accounts/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, username } = req.body; // status is 'verified' or 'unverified'
    
    if (!username) {
      return res.status(400).json({ error: "Verifier username is required" });
    }
    const requester = await db.collection('accounts').findOne({ username });
    if (!requester || !['lgu', 'admin'].includes(requester.role)) {
      return res.status(403).json({ error: "Access denied. Only LGU responders or admins can perform verification." });
    }
    
    if (!['verified', 'unverified'].includes(status)) {
      return res.status(400).json({ error: "Invalid verification status value. Must be 'verified' or 'unverified'." });
    }
    
    const isVerified = status === 'verified';
    const result = await db.collection('accounts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { verificationStatus: status, isVerified } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    // Create an in-app notification for the citizen
    const messageTitle = isVerified ? "Account Verified!" : "Verification Application Rejected";
    const messageDetail = isVerified 
      ? "Salamat! Your account has been verified by the LGU. You can now post reports." 
      : "Your verification request has been rejected. Please ensure your ID upload is clear and valid.";
      
    await db.collection('notifications').insertOne({
      targetUser: result.username,
      type: 'reply',
      isNew: true,
      title: messageTitle,
      subtitle: requester.displayName || requester.username,
      detail: messageDetail,
      createdAt: new Date()
    });
    
    res.json({ ...result, id: result._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pin status (Authority/LGU responder role feature)
app.put('/api/pins/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, username } = req.body;

    // Verify user is authority/LGU/admin
    const user = await db.collection('accounts').findOne({ username });
    if (!user || !['authority', 'lgu', 'admin'].includes(user.role)) {
      return res.status(200).json({ error: "Access denied. Only authorities or LGU responders can change status." });
    }

    if (!['unresolved', 'pending-approval', 'pending-resolution', 'resolved', 'pending', 'acknowledged', 'in-progress'].includes(status)) {
      return res.status(200).json({ error: "Invalid status value" });
    }

    const oldPin = await db.collection('pins').findOne({ _id: new ObjectId(id) });
    if (!oldPin) return res.status(200).json({ error: "Pin not found" });

    const type = oldPin.typeKey || oldPin.type || 'other';

    if (oldPin.status !== 'resolved' && status === 'resolved') {
      const updateQuery = { $inc: { reportsCount: 1 } };
      updateQuery.$inc[`resolvedTags.${type}`] = 1;
      
      await db.collection('accounts').updateOne(
        { username },
        updateQuery
      );
    } else if (oldPin.status === 'resolved' && status !== 'resolved') {
      const updateQuery = { $inc: { reportsCount: -1 } };
      updateQuery.$inc[`resolvedTags.${type}`] = -1;
      
      await db.collection('accounts').updateOne(
        { username },
        updateQuery
      );
    }

    const pin = await db.collection('pins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    // Also update corresponding reports collection status
    await db.collection('reports').updateMany(
      { pinId: new ObjectId(id) },
      { $set: { status } }
    );

    res.json({ ...pin, id: pin._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pin verification status
app.put('/api/pins/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, username } = req.body;

    const user = await db.collection('accounts').findOne({ username });
    if (!user || !['authority', 'lgu', 'admin'].includes(user.role)) {
      return res.status(200).json({ error: "Access denied. Only authorities, LGUs, or admins can verify reports." });
    }

    if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
      return res.status(200).json({ error: "Invalid verification status value" });
    }

    const pin = await db.collection('pins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { verificationStatus } },
      { returnDocument: 'after' }
    );
    if (!pin) return res.status(200).json({ error: "Pin not found" });

    await db.collection('reports').updateMany(
      { pinId: new ObjectId(id) },
      { $set: { verificationStatus } }
    );

    res.json({ ...pin, id: pin._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pin category (Authority/LGU responder role feature)
app.put('/api/pins/:id/category', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, username } = req.body;
    
    // Verify user is authority/LGU/admin
    const user = await db.collection('accounts').findOne({ username });
    if (!user || !['authority', 'lgu', 'admin'].includes(user.role)) {
      return res.status(200).json({ error: "Access denied. Only authorities or LGU responders can change tags." });
    }

    // Map category keys to their display names
    const CATEGORIES = {
      'flood': 'Flood',
      'road-damage': 'Road Damage',
      'peace-and-order': 'Peace and Order',
      'utility-outages': 'Utility Outages',
      'waste-collection': 'Waste Collection',
      'infrastructure': 'Infrastructure & Public Works',
      'fire': 'Fire',
      'other': 'Other',
    };

    if (!CATEGORIES[category]) {
      return res.status(400).json({ error: "Invalid category value" });
    }

    const pin = await db.collection('pins').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { type: category, title: CATEGORIES[category] } },
      { returnDocument: 'after' }
    );
    if (!pin) return res.status(404).json({ error: "Pin not found" });

    // Also update corresponding reports collection type
    await db.collection('reports').updateMany(
      { pinId: new ObjectId(id) },
      { $set: { typeKey: category, typeName: CATEGORIES[category] } }
    );

    res.json({ ...pin, id: pin._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   NOTIFICATIONS ENDPOINTS (/api/notifications)
   ========================================================================== */

// Get notifications for a user
app.get('/api/notifications', async (req, res) => {
  try {
    const { username } = req.query;
    const query = username ? { targetUser: username } : {};
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    const formatted = notifications.map(n => ({ ...n, id: n._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('notifications').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isNew: false } },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: "Notification not found" });
    res.json({ ...result, id: result._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-read', async (req, res) => {
  try {
    const { username } = req.body;
    const query = username ? { targetUser: username } : {};
    await db.collection('notifications').updateMany(
      query,
      { $set: { isNew: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('notifications').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   COMMENTS/REPLIES ENDPOINTS (/api/pins/:id/comments)
   ========================================================================== */

// Get comments for a pin
app.get('/api/pins/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await db.collection('comments')
      .find({ pinId: id })
      .sort({ createdAt: 1 })
      .toArray();
    const formatted = comments.map(c => ({ ...c, id: c._id.toString() }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a comment/reply
app.post('/api/pins/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, content, role, governmentCategory, parentId } = req.body;
    const newComment = {
      pinId: id,
      author: author || 'anonymous',
      content,
      role: author === 'bayan_patrol' ? 'authority' : (role || 'citizen'),
      governmentCategory: author === 'bayan_patrol' ? 'DRRMO' : (governmentCategory || ''),
      createdAt: new Date(),
      timeAgo: 'Just now',
      upvotes: 0,
      downvotes: 0,
      flags: 0
    };
    if (parentId) {
      newComment.parentId = parentId;
    }
    const result = await db.collection('comments').insertOne(newComment);

    // Increment threadCount on pin
    await db.collection('pins').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { threadCount: 1 } }
    );

    // Get the pin author to notify them
    const pin = await db.collection('pins').findOne({ _id: new ObjectId(id) });

    // If it's a nested reply, notify the parent comment's author
    if (parentId) {
      const parentComment = await db.collection('comments').findOne({ _id: new ObjectId(parentId) });
      if (parentComment && parentComment.author !== author) {
        const parentAuthorAccount = await db.collection('accounts').findOne({ username: parentComment.author });
        if (!parentAuthorAccount || parentAuthorAccount.notifSettings?.replyReceived !== false) {
          await db.collection('notifications').insertOne({
            targetUser: parentComment.author,
            type: 'reply',
            isNew: true,
            pinId: id,
            title: `@${author} replied to your comment`,
            subtitle: pin ? pin.title : 'Report Details',
            detail: content,
            timeAgo: 'Just now',
            createdAt: new Date()
          });
        }
      }
    } else if (pin && pin.reportedBy && pin.reportedBy !== author) {
      // Top level comment, notify pin author
      const authorAccount = await db.collection('accounts').findOne({ username: pin.reportedBy });
      if (!authorAccount || authorAccount.notifSettings?.replyReceived !== false) {
        await db.collection('notifications').insertOne({
          targetUser: pin.reportedBy,
          type: 'reply',
          isNew: true,
          pinId: id,
          title: `@${author} commented on your report`,
          subtitle: pin.title,
          detail: content,
          timeAgo: 'Just now',
          createdAt: new Date()
        });
      }
    }

    // Notify other commenters in the thread
    const previousComments = await db.collection('comments').find({ pinId: id }).toArray();
    const uniqueCommenters = [...new Set(previousComments.map(c => c.author))].filter(u => u !== author && u !== (pin ? pin.reportedBy : ''));
    for (const commenter of uniqueCommenters) {
      const commenterAccount = await db.collection('accounts').findOne({ username: commenter });
      if (!commenterAccount || commenterAccount.notifSettings?.replyReceived !== false) {
        await db.collection('notifications').insertOne({
          targetUser: commenter,
          type: 'reply',
          isNew: true,
          pinId: id,
          title: `@${author} replied to a thread you commented on`,
          subtitle: pin ? pin.title : 'Report Details',
          detail: content,
          timeAgo: 'Just now',
          createdAt: new Date()
        });
      }
    }

    res.status(201).json({ ...newComment, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Action on a comment (upvote, downvote, flag)
app.post('/api/comments/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, username, reason, details } = req.body; // 'upvote', 'downvote', 'flag'

    if (!username) return res.status(400).json({ error: "Username required" });

    const comment = await db.collection('comments').findOne({ _id: new ObjectId(id) });
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    let { upvotedBy = [], downvotedBy = [], flaggedBy = [], flagReports = [], upvotes = 0, downvotes = 0, flags = 0 } = comment;

    if (action === 'upvote') {
      if (upvotedBy.includes(username)) {
        upvotedBy = upvotedBy.filter(u => u !== username);
        upvotes--;
      } else {
        upvotedBy.push(username);
        upvotes++;
        if (downvotedBy.includes(username)) {
          downvotedBy = downvotedBy.filter(u => u !== username);
          downvotes--;
        }
      }
    } else if (action === 'downvote') {
      if (downvotedBy.includes(username)) {
        downvotedBy = downvotedBy.filter(u => u !== username);
        downvotes--;
      } else {
        downvotedBy.push(username);
        downvotes++;
        if (upvotedBy.includes(username)) {
          upvotedBy = upvotedBy.filter(u => u !== username);
          upvotes--;
        }
      }
    } else if (action === 'flag') {
      if (flaggedBy.includes(username)) {
        // Unflag
        flaggedBy = flaggedBy.filter(u => u !== username);
        flagReports = flagReports.filter(r => r.username !== username);
        flags--;
      } else {
        // Flag with details
        flaggedBy.push(username);
        flagReports.push({ username, reason: reason || 'Other', details: details || '', createdAt: new Date() });
        flags++;
      }
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const result = await db.collection('comments').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { upvotedBy, downvotedBy, flaggedBy, flagReports, upvotes, downvotes, flags } },
      { returnDocument: 'after' }
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin deletes an authority/LGU account
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    // Verify requester is admin
    const requester = await db.collection('accounts').findOne({ username: adminUsername, role: 'admin' });
    if (!requester) {
      return res.status(200).json({ error: 'Only admins can delete accounts.' });
    }

    // Prevent deleting the admin account itself
    const target = await db.collection('accounts').findOne({ _id: new ObjectId(id) });
    if (!target) return res.status(404).json({ error: 'Account not found.' });
    if (target.role === 'admin') return res.status(200).json({ error: 'Cannot delete the admin account.' });

    await db.collection('accounts').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin edits an authority/LGU account
app.put('/api/accounts/:id/admin-edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, displayName, password, governmentCategory, role, municipality } = req.body;

    // Verify requester is admin
    const requester = await db.collection('accounts').findOne({ username: adminUsername, role: 'admin' });
    if (!requester) {
      return res.status(200).json({ error: 'Only admins can edit accounts.' });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (password !== undefined && password.trim() !== '') updateData.password = password.trim();
    if (governmentCategory !== undefined) updateData.governmentCategory = governmentCategory;
    if (role !== undefined) updateData.role = role;
    if (municipality !== undefined) updateData.municipality = municipality;

    const result = await db.collection('accounts').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Account not found.' });
    res.json({ ...result, id: result._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server locally if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  });
}

export default app;
