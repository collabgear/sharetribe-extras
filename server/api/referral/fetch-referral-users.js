const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const { UUID } = sharetribeIntegrationSdk.types;

module.exports = (req, res) => {
  const { referralId, referralOwnId  } = req.body;

  // Create new Sharetribe Integration SDK instance
  const integrationSdk = sharetribeIntegrationSdk.createInstance({
    clientId: process.env.SERVER_APP_INTEGRATION_SDK_CLIENT_ID,
    clientSecret: process.env.SERVER_APP_INTEGRATION_SDK_CLIENT_SECRET
  });

  // Fetch the referees - users with the referral ID = referralId
  // ( the users who have been invited to the platform by the user with this referral ID )
  const fetchRefereeUsersCall = referralOwnId
    ? () => integrationSdk.users.query({ pub_referralId: referralOwnId, perPage: 100 })
    : () => Promise.resolve( false );

  // Fetch the referral - user with the referral Own ID = referralOwnId
  // ( the user who has invited the current user to the platform )
  const fetchReferralUserCall = referralId
    ? () => integrationSdk.users.query({ pub_referralOwnId: referralId })
    : () => Promise.resolve( false );

  return Promise.all([ fetchRefereeUsersCall(), fetchReferralUserCall()])
    .then( response => {
      const refereeUsers = response[ 0 ]
        ? response[ 0 ].data.data.map( u => {
            return { id: u.id.uuid, name: u.attributes.profile.displayName };
          })
        : [];
      const referralUserArray = response[ 1 ] ? response[ 1 ].data.data : [];
      const referralUser =
        referralUserArray.length === 1 ?
          {
            id: referralUserArray[ 0 ].id.uuid,
            name: referralUserArray[ 0 ].attributes.profile.displayName
          } : null;

      console.log("User referrals info was fetched successfully");
      return res.status(200).send({ referralUser, refereeUsers });
    })
    .catch(error => {
      console.error('Fetching user referrals info failed with an error: ' + error.message);
      console.error(error.data.errors);
      return res.status(500).send('Fetching user referrals info failed with an error: ' + error.message);
    });
};
