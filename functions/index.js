const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const db = admin.firestore();
  
  // Check if we should send reminders
  const settingsDoc = await db.doc('settings/global').get();
  const settings = settingsDoc.data();
  
  if (!settings || !settings.exchangeDate) {
    console.log("No exchange date set.");
    return null;
  }

  const exchangeDate = settings.exchangeDate.toDate();
  const now = new Date();
  const diffTime = Math.abs(exchangeDate - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  // Send reminder 3 days before
  if (diffDays !== 3) {
    console.log("Not the right day for reminders.");
    return null;
  }

  const tokensSnapshot = await db.collection('notificationTokens').get();
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

  if (tokens.length === 0) {
    console.log("No tokens found.");
    return null;
  }

  const message = {
    notification: {
      title: 'Secret Santa Reminder! 🎅',
      body: 'The gift exchange is in 3 days! Don\'t forget your gift!'
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(response.successCount + ' messages were sent successfully');
  } catch (error) {
    console.log('Error sending message:', error);
  }
});
