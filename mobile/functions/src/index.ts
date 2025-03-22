/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as admin from "firebase-admin";
import { firestore } from "firebase-functions/v2";
import * as iconv from "iconv-lite";

admin.initializeApp();

export const sendMessageNotification = firestore.onDocumentUpdated(
  "channels/{corruptChannel}",
  async (event) => {
    const { corruptChannel } = event.params;
    // const bytes = new TextEncoder().encode(corruptChannel);
    // const channel = new TextDecoder("utf-8").decode(bytes);

    const channel = iconv.decode(Buffer
      .from(corruptChannel, "binary"), "utf-8");
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    const oldMessages = beforeData?.messages || [];
    const newMessages = afterData?.messages || [];

    const oldLastMessage = oldMessages[oldMessages.length - 1];
    const newLastMessage = newMessages[newMessages.length - 1];

    if (oldLastMessage == newLastMessage) return;

    console.log(channel);

    try {
      const channelDoc = await admin.firestore()
        .collection("channels")
        .doc(channel).get();

      const channelData = channelDoc.data();
      if (!channelData) return;
      console.log("Le canal existe");
      const channelTitle = channelData.title;


      // Doit get les tokens après qu"ils aient tous été modifiés par
      // chaque user dans le canal
      const tokens =
        await getFieldByChannel(
          "fcmToken", channelTitle, newLastMessage.username
        );

      console.log("tokens :", tokens);

      const payload = {
        notification: {
          title: `${channel}`,
          body: `${newLastMessage.username} : ${newLastMessage.message}`,
        },
      };

      if (tokens.length > 0) {
        // Send notifications to all users in the channel
        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          ...payload,
        });

        response.responses.forEach(async (res, idx) => {
          if (res.success) {
            console.log(`Message "${newLastMessage.message}"
            sent successfully to token[${idx}]`);
          } else {
            console.error(`Error sending message to token[${idx}]:`, res.error);
            const userId = await getUIDbyToken(tokens[idx]);
            console.log(userId);
            if (userId != null) clearToken(userId);
            // Trouver un moyen de renvoyer la notif avec un token refreshed :(
          }
        });
      } else {
        console.log("No more tokens available to send notifications.");
      }
    } catch (e) {
      console.log(`Erreur au moment de get ${channel}`, e);
    }
  }
);

/**
 * Retrieves field values for users who have
 * joined or created the specified channel.
 * @param {string} field - The field of the user to search for.
 * @param {string} channelTitle - The title of the channel to search for.
 * @param {string} senderName - The username of the one who sent the message.
 * @return {Promise<string[]>} - A promise that
 * resolves to an array of user IDs.
 */
async function getFieldByChannel(
  field: string, channelTitle: string, senderName: string
): Promise<string[]> {
  const usersSnapshot = await admin.firestore().collection("users").get();

  // Use map to handle asynchronous operations within the loop
  const valuesPromises = usersSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    const joinedChannels = data.joinedChannels || [];
    const isInJoined = joinedChannels.some(
      (channel: { title: string }) => channel.title === channelTitle
    );

    const createdChannels = data.createdChannels || [];
    const isInCreated = createdChannels.some(
      (channel: { title: string }) => channel.title === channelTitle
    );

    if (data.fcmToken != undefined &&
      senderName != data.username &&
      (isInJoined || isInCreated)) {
      // Return the required field if conditions match
      return data[field];
    }
    return null; // Return null if conditions do not match
  });

  // Resolve all promises and filter out any null results
  const values =
    (await Promise.all(valuesPromises))
      .filter((value) => value !== null);

  console.log("values :", values);
  return values;
}

/**
 * Retrieves the user ID associated with a given FCM token.
 * @param {string} fcmToken - The FCM token of the user.
 * @return {Promise<string | null>} - A promise that resolves to
 * the user's ID or null if not found.
 */
async function getUIDbyToken(fcmToken: string): Promise<string | null> {
  const usersSnapshot = await admin.firestore().collection("users")
    .where("fcmToken", "==", fcmToken)
    .get();

  if (!usersSnapshot.empty) {
    const userDoc = usersSnapshot.docs[0];
    return userDoc.data().uid; // Return the user ID
  }

  return null; // Return null if no user found
}

/**
 * Clears the FCM token for the specified user in Firestore.
 * This function sets the "fcmToken" field of the user's document
 * to an empty string, effectively clearing the FCM token stored
 * for that user.
 * @param {string} userId - The unique identifier of the user
 * whose FCM token needs to be cleared.
 * @return {Promise<void>} A promise that resolves once the
 * token is cleared in Firestore.
 */
async function clearToken(userId: string): Promise<void> {
  await admin.firestore().collection("users").doc(userId).set(
    {
      "fcmToken": "",
    },
    { merge: true },
  );

  const userDoc = await admin.firestore().collection("users")
    .doc(userId)
    .get();

  const fcmToken = userDoc.get("fcmToken");
  console.log("cleared fcmToken : ", fcmToken);
}

