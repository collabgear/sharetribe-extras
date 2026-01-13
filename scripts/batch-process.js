////////////////////////////////////////////////////////////////////////////////
// Command line utility to update entities ( users, listings ) in batch mode  //
////////////////////////////////////////////////////////////////////////////////

const sharetribeIntegrationSdk = require('sharetribe-flex-integration-sdk');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).parse();

const HELP_OUTPUT = `
    batch-process is a command line utility to update entities ( users, listings ) in batch mode.
    
    Available commands:
    
      --help - shows this help screen
      
      --update - update the entities ( users or listings ) that do not have particular attribute set
        The flags available for the 'update' command:
        --entity - the type of entity to update ( 'user' is the only type supported now )
        --scope - data scope to update. Available options: 'public', 'private', 'meta'
        --property - the property to be checked and updated in publicData, privateData or metaData
        --value - the property value to set for all the entities which are missing the property
        
    Examples:
      
      Update the all the users who do not have public attribute 'userType' and set it to 'client' value:
        node --env-file=../.env batch-process.js --update --entity=user --scope=public --property=userType --value=client
  `;

const KNOWN_ENTITIES = ['user'];

const KNOWN_SCOPES = {
  'public': 'publicData',
  'private': 'privateData',
  'meta': 'metadata'
};

const RESULTS_PER_PAGE = 100;

// Create new Sharetribe Integration SDK instance
const initIntegrationSdk = () => {
  return sharetribeIntegrationSdk.createInstance({
    clientId: process.env.SERVER_APP_INTEGRATION_SDK_CLIENT_ID,
    clientSecret: process.env.SERVER_APP_INTEGRATION_SDK_CLIENT_SECRET
  });
};

// Update the user property given the scope and property name
const updateUsers = ( scope, property, value ) => {
  const integrationSdk = initIntegrationSdk();

  const queryUsersPage = ( page = 1 ) => {
    return integrationSdk.users.query({ page, perPage: RESULTS_PER_PAGE })
      .then( response => {
        const users = response.data.data;
        const { totalPages } = response.data.meta;

        return { users, totalPages };
      });
  };

  const allUsers = [];

  queryUsersPage()
    .then( response => {
      const { users, totalPages } = response;

      if( Array.isArray( users ) && users.length > 0 )
        allUsers.push( ...users );

      if( totalPages > 1 ){
        const userPagePromises = [];

        for( let page = 2; page <= totalPages; page++ )
          userPagePromises.push( queryUsersPage( page ));

        return Promise.all( userPagePromises );
      } else {
        return Promise.resolve([]);
      }
    })
    .then( userPages => {
      if( Array.isArray( userPages ) && userPages.length > 0 ){
        userPages.forEach(userPage => {
          const { users } = userPage;

          allUsers.push(...users);
        });
      }

      const userUpdatePromises = [];

      if( allUsers.length > 0 ){
        allUsers.forEach(user => {
          const userProfile = user?.attributes?.profile || {};
          const scopeContainer = userProfile[KNOWN_SCOPES[scope]];
          const propertyValue = scopeContainer[property];

          if (!propertyValue) {
            const updateProps = { id: user.id };

            updateProps[KNOWN_SCOPES[scope]] = {};
            updateProps[KNOWN_SCOPES[scope]][property] = value;
            userUpdatePromises.push( integrationSdk.users.updateProfile(updateProps));
          }
        });
      }

      if( userUpdatePromises.length > 0 ){
        const applyAsync = (acc, val) => acc.then(val);
        const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x));
        const handleUserUpdates = composeAsync( userUpdatePromises );

        console.log(`Updating user profiles for ${userUpdatePromises.length} user(s).`);

        return handleUserUpdates({});

      } else {
        console.log('No user profiles that need to be updated.');

        return Promise.resolve( null );
      }
    })
    .then(() => {
      console.log('Finishied updating the user profiles.');
    });
};

if( argv.help ) {
  console.log( HELP_OUTPUT );
} else if( argv.update ){
  if( !argv.entity || !KNOWN_ENTITIES.includes( argv.entity ))
    console.log("Unknown or absent entity type. Please specify a valid entity type using the '--entity' option");

  if( !argv.scope || !KNOWN_SCOPES[ argv.scope ])
    console.log("Unknown or absent scope. Please specify a valid scope using the '--scope' option");

  if( !argv.property || typeof argv.property !== 'string')
    console.log("Unknown or absent property name. Please specify a valid property name using the '--property' option");

  if( !argv.value )
    console.log("Absent property name. Please specify a valid property value using the '--value' option");

  if( argv.entity === 'user')
    updateUsers( argv.scope, argv.property, argv.value );
} else {
  console.log( HELP_OUTPUT );
}
