const fs = require("fs").promises;
const { writeFileSync } = require("fs");
const path = require("path");
const os = require("os");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(
  getDocumentsDirectory(),
  "google-classroom-token.json"
);
const CREDENTIALS_DATA = JSON.stringify(require("../credentials.json"));
const CREDENTIALS_PATH = path.join(
  getDocumentsDirectory(),
  "google-classroom-credentials.json"
);

module.exports.TOKEN_PATH = TOKEN_PATH;
module.exports.getDocumentsDirectory = getDocumentsDirectory;
module.exports.getClassroomData = getClassroomData;
module.exports.authorize = authorize;

writeFileSync(CREDENTIALS_PATH, CREDENTIALS_DATA);

function getDocumentsDirectory() {
  const homeDir = os.homedir();
  return path.join(homeDir, "Documents");
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function listCourses(
  auth,
  { onCourseStartLoading, onInternetConnectProblem } = {}
) {
  const classroom = google.classroom({ version: "v1", auth });
  const res = await alwaysRetry(
    () => classroom.courses.list({ pageSize: 10 }),
    onInternetConnectProblem
  );
  const courses = res.data.courses;
  if (!courses || courses.length === 0) {
    console.log("No courses found.");
    return;
  }
  const sortedWorks = [];
  const coursesLength = parseInt(courses.length);
  for (const index in courses) {
    const course = courses[index];
    // console.log(`${course.name} (${course.id})`);
    if (onCourseStartLoading)
      onCourseStartLoading(
        course.name,
        parseInt(((parseInt(index) + 1) / coursesLength) * 100)
      );
    sortedWorks.push(
      ...(await listCourseWork(auth, course, { onInternetConnectProblem }))
    );
  }

  return sortedWorks
    .sort((a, b) => new Date(a.updateTime) - new Date(b.updateTime))
    .reverse()
    .slice(0, 50);
}

async function getClassroomData({
  onAuthorize,
  onCourseStartLoading,
  onInternetConnectProblem,
} = {}) {
  const auth = await authorize();
  if (onAuthorize !== undefined) onAuthorize();
  return listCourses(auth, { onCourseStartLoading, onInternetConnectProblem });
}

async function listCourseWork(auth, course, { onInternetConnectProblem } = {}) {
  const classroom = google.classroom({ version: "v1", auth });
  const courseWorkRes = await alwaysRetry(
    () => classroom.courses.courseWork.list({ courseId: course.id }),
    onInternetConnectProblem
  );

  if (
    !courseWorkRes.data.courseWork ||
    courseWorkRes.data.courseWork.length === 0
  ) {
    console.log("  No coursework found.");
    return;
  }

  const submissionsPromises = courseWorkRes.data.courseWork
    .slice(0, 50)
    .map(async (work) => {
      const submissionsRes = await alwaysRetry(
        () =>
          classroom.courses.courseWork.studentSubmissions.list({
            courseId: course.id,
            courseWorkId: work.id,
          }),
        onInternetConnectProblem
      );
      const res = submissionsRes.data.studentSubmissions;
      if (res) {
        res.forEach((e) => (e.courseWorkTitle = work.title));
        res.forEach((e) => (e.courseName = course.name));
        return res;
      } else return [];
    });

  const submissions = await Promise.all(submissionsPromises);
  return submissions.flat();
}

async function alwaysRetry(method, onInternetConnectProblem = () => {}) {
  async function loop(resolve, reject, index = 0) {
    try {
      const res = await method();
      resolve(res);
    } catch {
      (onInternetConnectProblem || (() => {}))();
      setTimeout(() => loop(resolve, reject), 1000 * 3);
    }
  }
  return new Promise(loop);
}
