const JSZip = require("jszip");
const fs = require("fs");

function makeEntry(username, daysAgo) {
  return {
    title: "",
    media_list_data: [],
    string_list_data: [
      {
        href: `https://www.instagram.com/${username}`,
        value: username,
        timestamp: Math.floor(Date.now() / 1000) - daysAgo * 86400,
      },
    ],
  };
}

const followers = Array.from({ length: 80 }, (_, i) =>
  makeEntry(`follower_${i + 1}`, Math.floor(Math.random() * 365))
);

const mutuals = Array.from({ length: 40 }, (_, i) =>
  makeEntry(`mutual_friend_${i + 1}`, Math.floor(Math.random() * 300))
);

const nonMutuals = Array.from({ length: 25 }, (_, i) =>
  makeEntry(`celeb_account_${i + 1}`, Math.floor(Math.random() * 200))
);

const following = [...mutuals, ...nonMutuals];
const allFollowers = [
  ...followers,
  ...mutuals.map((m) => makeEntry(m.string_list_data[0].value, Math.floor(Math.random() * 300))),
];

const pending = Array.from({ length: 12 }, (_, i) =>
  makeEntry(`pending_user_${i + 1}`, Math.floor(Math.random() * 90))
);

const unfollowed = Array.from({ length: 5 }, (_, i) =>
  makeEntry(`ex_friend_${i + 1}`, Math.floor(Math.random() * 30))
);

const closeFriends = Array.from({ length: 8 }, (_, i) =>
  makeEntry(`bestie_${i + 1}`, Math.floor(Math.random() * 365))
);

const zip = new JSZip();
const dir = zip.folder("connections/followers_and_following");

dir.file("followers_1.json", JSON.stringify(allFollowers));
dir.file("following.json", JSON.stringify(following));
dir.file(
  "pending_follow_requests.json",
  JSON.stringify({ relationships_follow_requests_sent: pending })
);
dir.file(
  "recently_unfollowed_accounts.json",
  JSON.stringify(unfollowed)
);
dir.file("close_friends.json", JSON.stringify(closeFriends));

zip.generateNodeStream({ type: "nodebuffer", streamFiles: true })
  .pipe(fs.createWriteStream("public/test-instagram-data.zip"))
  .on("finish", () => console.log("Test data generated: public/test-instagram-data.zip"));
