const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../modules/users/models/userModel');
const logger = require('../utils/logger');

// Load environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Helper function to find or create user from social profile
const findOrCreateUser = async (profile, provider, done) => {
  try {
    // Extract profile information
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
      return done(new Error('No email found in profile'), null);
    }

    // Check login query object based on provider
    const loginQuery = {};
    
    if (provider === 'google') {
      loginQuery.googleId = profile.id;
    } else if (provider === 'facebook') {
      loginQuery.facebookId = profile.id;
    } else if (provider === 'linkedin') {
      loginQuery.linkedinId = profile.id;
    }

    // Try to find user with provider ID
    let user = await User.findOne(loginQuery);

    // If user not found by provider ID, try email
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Update provider ID if not already set
      const updateFields = {};
      
      if (provider === 'google' && !user.googleId) {
        updateFields.googleId = profile.id;
      } else if (provider === 'facebook' && !user.facebookId) {
        updateFields.facebookId = profile.id;
      } else if (provider === 'linkedin' && !user.linkedinId) {
        updateFields.linkedinId = profile.id;
      }

      // Update user if needed
      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(user._id, updateFields);
      }
    } else {
      // Create new user
      const userData = {
        email,
        name: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
        authProvider: provider,
      };

      // Add provider-specific ID
      if (provider === 'google') {
        userData.googleId = profile.id;
      } else if (provider === 'facebook') {
        userData.facebookId = profile.id;
      } else if (provider === 'linkedin') {
        userData.linkedinId = profile.id;
      }

      // Set profile picture if available
      if (profile.photos && profile.photos.length > 0) {
        userData.profilePicture = profile.photos[0].value;
      }

      user = new User(userData);
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
};

// Configure Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/users/auth/google/callback`,
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    findOrCreateUser(profile, 'google', done);
  }));
}

// Configure Facebook Strategy
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: `${BASE_URL}/api/users/auth/facebook/callback`,
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    findOrCreateUser(profile, 'facebook', done);
  }));
}

// Configure LinkedIn Strategy
if (LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: LINKEDIN_CLIENT_ID,
    clientSecret: LINKEDIN_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/api/users/auth/linkedin/callback`,
    scope: ['r_emailaddress', 'r_liteprofile'],
    passReqToCallback: true
  },
  (req, accessToken, refreshToken, profile, done) => {
    findOrCreateUser(profile, 'linkedin', done);
  }));
}

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 