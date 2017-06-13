import PassportTwitter from 'passport-twitter'
import r from 'rethinkdb'

import config from '../../config/rethinkDb/dbConfig'
import { twitter } from './keys'
import { createUser } from '../../api/users'

export default new PassportTwitter({
  consumerKey: twitter.clientID,
  consumerSecret: twitter.clientSecret,
  callbackURL: twitter.callbackURL
}, (accessToken = '', refreshToken = '', profile, done) => {
  r.connect(config, (err, conn) => {
    createUser(conn, {
      email: profile.userName || '',
      name: {
        displayName: profile._json.name || '',
        familyName: profile._json.familyName || '',
        givenName: profile._json.givenName || ''
      },
      auth: {
        id: profile.id || '',
        type: 'twitter',
        accessToken,
        refreshToken
      },
      picture: profile._json.profile_image_url || ''
    })
    .then(user => {
      if (user.err && user.name) // User already exists
        done(null, user, { message: user.err })
      else if (user.err) { // User creation error
        console.error(`Authentication Error: ${user.err}`) // eslint-disable-line no-console
        done(null, false, { message: user.err })
      } else // User created
        done(null, user, { message: 'Account created with Twitter.' })
    })
  })
})
