import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import dns from 'dns';

// Force Node.js to use Google and Cloudflare DNS to bypass local router DNS resolution bugs for mongodb+srv
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in the environment variables.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`, req.body);
  next();
});

let db;
const client = new MongoClient(MONGODB_URI);

async function connectDB() {
  try {
    if (db) return db; // reuse connection if already connected
    await client.connect();
    db = client.db('bantaybayan');
    console.log("Successfully connected to MongoDB");
    
    // Seed initial data if collections are empty
    await seedDatabase();
    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

// Seed helper function
async function seedDatabase() {
  const pinsCount = await db.collection('pins').countDocuments();
  if (pinsCount === 0) {
    const initialPins = [
      {
        type: 'flood', hazardLevel: 'life-threatening',
        lat: 14.6299, lng: 120.9719,
        title: 'Baha sa Tondo Market',
        address: 'Tondo, Manila',
        reportedBy: 'user123', timeAgo: '5 mins ago',
        upvotes: 24,
        description: 'Knee-deep floodwater near the public market. Road is completely impassable. Avoid this area.',
        status: 'acknowledged', threadCount: 7
      },
      {
        type: 'road-work', hazardLevel: 'needs-attention',
        lat: 14.5794, lng: 120.9961,
        title: 'Road construction at Quirino Ave',
        address: 'Paco, Manila',
        reportedBy: 'maryreyes', timeAgo: '23 mins ago',
        upvotes: 12,
        description: 'Ongoing road works causing single-lane traffic. Expect 20–30 minute delays.',
        status: 'in-progress', threadCount: 3
      },
      {
        type: 'fallen-pole', hazardLevel: 'urgent',
        lat: 14.5786, lng: 120.9822,
        title: 'Natumbang Poste, Ermita',
        address: 'Ermita, Manila',
        reportedBy: 'juandelacruz', timeAgo: '41 mins ago',
        upvotes: 35,
        description: "Electric pole down after last night's storm. Live wires on road. DANGER! Keep away.",
        status: 'acknowledged', threadCount: 12
      }
    ];
    await db.collection('pins').insertMany(initialPins);
    console.log("Seeded initial pins data");
  }

  const routesCount = await db.collection('routes').countDocuments();
  if (routesCount === 0) {
    const initialRoutes = [
      {
        name: 'Home → Work',
        from: 'Tondo, Manila',
        to: 'Makati CBD',
        distance: '17.6 km', duration: '45 min',
        lastEdited: 'June 7, 2026',
        nearbyReports: 3,
        routePath: [
          { lat: 14.6299, lng: 120.9719 },
          { lat: 14.5794, lng: 120.9961 }
        ]
      }
    ];
    await db.collection('routes').insertMany(initialRoutes);
    console.log("Seeded initial routes data");
  }

  const reportsCount = await db.collection('reports').countDocuments();
  if (reportsCount === 0) {
    const initialReports = [
      {
        typeName: 'Flood', typeKey: 'flood',
        moreDetails: 'Knee-deep near Tondo Market',
        date: 'June 19, 2026', time: '10:29 AM',
        location: 'Tondo, Manila',
        status: 'confirmed'
      }
    ];
    await db.collection('reports').insertMany(initialReports);
    console.log("Seeded initial reports data");
  }

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
}

// Middleware to ensure database connection in serverless environment
app.use(async (req, res, next) => {
  await connectDB();
  next();
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
      hazardLevel: req.body.hazardLevel,
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      title: req.body.title || 'Reported Hazard',
      address: req.body.address || 'Unknown Location',
      reportedBy: req.body.reportedBy || 'anonymous',
      timeAgo: 'Just now',
      upvotes: 0,
      description: req.body.description || '',
      status: 'pending',
      threadCount: 0,
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
      status: 'pending',
      pinId: result.insertedId
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

// Get all user reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await db.collection('reports').find({}).toArray();
    const formatted = reports.map(r => ({ ...r, id: r._id.toString() }));
    res.json(formatted);
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
    const { username, language, password, action } = req.body;
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '').trim();
    let account = await db.collection('accounts').findOne({ username: cleanUsername });

    if (action === 'signup') {
      if (account) {
        return res.status(200).json({ error: "Username already taken." });
      }
      account = {
        username: cleanUsername,
        displayName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
        password: password || '',
        language: language || 'en',
        createdAt: new Date(),
        isVerified: false,
        verificationStatus: 'unverified',
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
      account.isVerified = account.isVerified !== undefined ? account.isVerified : false;
      account.verificationStatus = account.verificationStatus || 'unverified';
      account.reportsCount = account.reportsCount !== undefined ? account.reportsCount : 0;
      account.upvotesCount = account.upvotesCount !== undefined ? account.upvotesCount : 0;
      account.joinedDate = account.joinedDate || 'Member since June 2026';
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
    const { id, displayName, avatarUrl, notifSettings, verificationStatus, isVerified, password } = req.body;
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
    const { author, content } = req.body;
    const newComment = {
      pinId: id,
      author: author || 'anonymous',
      content,
      createdAt: new Date(),
      timeAgo: 'Just now'
    };
    const result = await db.collection('comments').insertOne(newComment);
    
    // Increment threadCount on pin
    await db.collection('pins').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { threadCount: 1 } }
    );

    // Get the pin author to notify them
    const pin = await db.collection('pins').findOne({ _id: new ObjectId(id) });
    if (pin && pin.reportedBy && pin.reportedBy !== author) {
      const authorAccount = await db.collection('accounts').findOne({ username: pin.reportedBy });
      if (!authorAccount || authorAccount.notifSettings?.replyReceived !== false) {
        await db.collection('notifications').insertOne({
          targetUser: pin.reportedBy,
          type: 'reply',
          isNew: true,
          title: `@${author} replied to your report`,
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

// Start server locally if not in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  });
}

export default app;
