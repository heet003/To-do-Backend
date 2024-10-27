var express = require("express");
var userRouter = express.Router();
var db = require("../lib/database");
var helper = require("../core/helper");
const mail = require("../core/mail");

const ACCESSTOKEN = "AccessToken";
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

let user = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

user.googleAuth = function (req, res) {
  const { token } = req.body;

  let promise = helper.paramValidate({ code: 2001, val: !token }); // Code for 'Token is required'
  let foundUser = {};
  let userId;
  let payload;

  promise
    .then(async () => {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
      });
      return ticket;
    })
    .then(async (t) => {
      payload = t.getPayload();
      const user = await db._findOne("users", { googleId: payload.sub });
      if (user.length == 0) {
        foundUser = {
          googleId: payload.sub,
          name: payload.name,
          email: payload.email,
          image: payload.picture,
          role: "user",
          friends: [],
          bio: "",
          savedPlaces: [],
          createdAt: new Date(),
        };
        const id = await db.insert("users", foundUser);
        foundUser._id = id;
        return foundUser._id;
      } else {
        foundUser = user[0];
        return foundUser._id;
      }
    })
    .then((id) => {
      userId = id;
      const token = {
        userId: id,
        ttl: helper.token.TTL(),
        created: helper.dbDate(),
      };
      return db.insert(ACCESSTOKEN, token);
    })
    .then((tokenId) => {
      const tokenInfo = {
        userId,
        tokenId,
      };
      const token = helper.token.get(tokenInfo);
      foundUser.token = token;
    })
    .then(() => helper.success(res, foundUser))
    .catch((e) => {
      helper.error(res, e);
    });
};

user.login = function (req, res) {
  const { email, password } = req.body;
  let promise = helper.paramValidate(
    { code: 2002, val: !email },
    { code: 2003, val: !helper.isValidEmail(email) },
    { code: 2004, val: !password }
  );
  let foundUser = {};

  promise
    .then(async () => {
      return db._findOne("users", {
        email: email,
      });
    })
    .then((u) => {
      if (u.length > 0) {
        foundUser = u[0];
        return foundUser;
      }
      return Promise.reject(2007); // User not found
    })
    .then((u) => {
      if (helper.md5(password) != u.password) {
        return Promise.reject(2006); // Invalid credentials
      }
      return u;
    })
    .then((u) => {
      let token = {
        userId: u._id,
        ttl: helper.token.TTL(),
        created: helper.dbDate(),
      };
      return db.insert(ACCESSTOKEN, token);
    })
    .then((tokenId) => {
      let tokenInfo = {
        userId: foundUser._id,
        tokenId: tokenId,
      };
      token = helper.token.get(tokenInfo);
      foundUser.token = token;
    })
    .then(() => helper.success(res, foundUser))
    .catch((e) => {
      helper.error(res, e);
    });
};

user.signup = async (req, res) => {
  const { name, email, password, image } = req.body;

  let promise = helper.paramValidate(
    { code: 2001, val: !name },
    { code: 2002, val: !email },
    { code: 2003, val: !helper.isValidEmail(email) },
    { code: 2004, val: !password },
    { code: 2010, val: !image } // Add a specific code if needed
  );
  let newUser = {
    name,
    role: "user",
    bio: "",
    email,
    password: helper.md5(password),
    image,
    todos: [],
    createdAt: new Date(),
  };
  let userId;

  promise
    .then(async () => {
      return await db._findOne("users", { email });
    })
    .then(async (user) => {
      if (!user[0]) {
        return await db.insert("users", newUser);
      }
      return Promise.reject(2010); // Email already exists
    })
    .then((uid) => {
      userId = uid;
      let token = {
        userId: uid,
        ttl: helper.token.TTL(),
        created: helper.dbDate(),
      };
      return db.insert(ACCESSTOKEN, token);
    })
    .then((tokenId) => {
      let tokenInfo = {
        userId: userId,
        tokenId: tokenId,
      };
      token = helper.token.get(tokenInfo);
      newUser.token = token;
    })
    .then(() => helper.success(res, newUser))
    .catch((e) => {
      helper.error(res, e);
    });
};

user.userProfile = (req, res) => {
  const { userId } = req.uSession;

  let promise = helper.paramValidate({ code: 2010, val: !userId });

  promise
    .then(async () => {
      return await db._findOne(
        "users",
        { _id: userId },
        { name: 1, role: 1, email: 1, image: 1, bio: 1 }
      );
    })
    .then((u) => {
      if (u.length > 0) {
        return u[0];
      }
      return Promise.reject(2007); // "User not found"
    })
    .then((user) => {
      helper.success(res, { user });
    })
    .catch((err) => {
      helper.error(res, err);
    });
};

user.sendOtp = (req, res) => {
  const { email } = req.body;

  let promise = helper.paramValidate({ code: 2010, val: !email });

  const otp = generateOTP();
  const subject = "Email Verification - To-Do List";
  const body = (otp) => `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
              text-align: center;
              padding: 20px 0;
          }
          .header img {
              max-width: 150px;
          }
          .otp {
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
          }
          .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #888;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="cid:logo" alt="ToDo List Logo" />
          </div>
          <h2>Email Verification</h2>
          <p>Dear User,</p>
          <p>Thank you for signing up for our ToDo List application! Please verify your email address by entering the OTP below:</p>
          <div class="otp">${otp}</div>
          <p>This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
          <div class="footer">
              <p>&copy; 2024 ToDo List Project. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>`;

  promise
    .then(async () => {
      return await db._findOne("users", { email });
    })
    .then((u) => {
      if (u.length > 0) {
        return u[0];
      }
      return Promise.reject(2007); // "User not found"
    })
    .then(async (user) => {
      if (user) {
        return await mail.sendMail(email, subject, body(otp), true);
      }
    })
    .then(async (result) => {
      if (result) {
        const otpDocument = {
          email,
          otp,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        };
        return await db.insert("otps", otpDocument);
      }
      return Promise.reject(403);
    })
    .then((id) => {
      if (id) {
        helper.success(res, { otp });
      }
    })
    .catch((error) => {
      helper.error(res, error);
    });
};

user.resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  let promise = helper.paramValidate(
    { code: 2010, val: !email },
    { code: 2010, val: !otp },
    { code: 2010, val: !newPassword }
  );

  let otpDocument;
  promise
    .then(async () => {
      return await db._findOne("otps", { email, otp });
    })
    .then((otp) => {
      if (otp.length > 0) {
        otpDocument = otp[0];
      } else {
        return Promise.reject({ message: "Otp is invalid.", httpCode: 400 });
      }
    })
    .then(async () => {
      const currentTime = new Date();
      if (currentTime > new Date(otpDocument.expiresAt)) {
        return Promise.reject({ message: "OTP has expired.", httpCode: 400 });
      }
      await db.delete("otps", { email });
    })
    .then(() => {
      db.update("users", { email }, { password: helper.md5(newPassword) });
    })
    .then(() => {
      helper.success(res, { message: "OTP verified successfully." });
    })
    .catch((error) => {
      helper.error(res, error);
    });
};

user.updateProfile = (req, res) => {
  const { userId } = req.uSession;
  const { name, image, bio } = req.body;

  let promise = helper.paramValidate({ code: 2010, val: !userId });

  promise
    .then(async () => {
      const currentUser = await db._findOne("users", { _id: userId });
      if (currentUser.length > 0) {
        return currentUser[0];
      }
      return Promise.reject(2007); // User not found
    })
    .then(async (user) => {
      const updatedData = {
        name: name || user.name,
        bio: bio || user.bio,
        image: image || user.image,
      };
      return await db.update("users", { _id: userId }, updatedData);
    })
    .then(async (updateStatus) => {
      if (updateStatus.acknowledged) {
        return await db._findOne(
          "users",
          { _id: userId },
          { name: 1, image: 1, email: 1, bio: 1 }
        );
      }
      return Promise.reject(1001); // Unexpected error
    })
    .then((user) => {
      helper.success(res, { user: user[0] });
    })
    .catch((error) => {
      helper.error(res, error);
    });
};

user.contactMail = async (req, res) => {
  const { userId } = req.uSession;
  const { name, email, message, phone } = req.body;

  let promise = helper.paramValidate(
    { code: 403, val: !userId },
    { code: 2002, val: !email },
    { code: 1004, val: !phone },
    { code: 2010, val: !message },
    { code: 2001, val: !name }
  );

  const subject = "New Contact Form Submission - EstateEdge";
  const body = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission - EstateEdge</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              padding: 20px;
              margin: 0;
          }
          .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
              text-align: center;
              margin-bottom: 30px;
          }
          .logo img {
              width: 180px;
              height: auto;
          }
          .content {
              margin-bottom: 20px;
          }
          .contact-info {
              font-size: 16px;
              margin-bottom: 20px;
          }
          .footer {
              margin-top: 20px;
              text-align: center;
              color: #777;
              font-size: 14px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="logo">
              <img src="cid:logo" alt="EdgeEstate Logo">
          </div>
          <div class="content">
              <p>Hello,</p>
              <p>You have a new contact form submission from the EstateEdge website.</p>
              <div class="contact-info">
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Phone:</strong> ${phone}</p>
                  <p><strong>Message:</strong></p>
                  <p>${message}</p>
              </div>
          </div>
          <div class="footer">
              <p>This email was sent automatically. Please do not reply.</p>
              <p>&copy; 2024 EstateEdge. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>`;

  promise
    .then(async () => {
      return await db._findOne("users", { email });
    })
    .then((u) => {
      if (u.length > 0) {
        return u[0];
      }
      return Promise.reject(2007); // User not found
    })
    .then(async (user) => {
      if (user) {
        return await mail.sendMail("heet3998@gmail.com", subject, body, true);
      }
    })
    .then(async (result) => {
      if (result) {
        const messageDocument = {
          email: email,
          phone: phone,
          name: name,
          message: message,
          createdAt: new Date(),
        };

        return await db.insert("contacts", messageDocument);
      }
      return Promise.reject(1001); // Unexpected error
    })
    .then((id) => {
      if (id) {
        helper.success(res, {
          message: "Your message has been sent successfully!",
        });
      }
    })
    .catch((error) => {
      helper.error(res, error);
    });
};

module.exports = function (app, uri) {
  userRouter.post("/login", user.login);
  userRouter.post("/auth/google/callback", user.googleAuth);
  userRouter.post("/signup", user.signup);
  userRouter.get("/profile", user.userProfile);
  userRouter.post("/update-profile", user.updateProfile);
  userRouter.post("/send-otp", user.sendOtp);
  userRouter.post("/reset-password", user.resetPassword);
  userRouter.post("/contact", user.contactMail);
  //for crud
  app.use(uri, userRouter);
};
