import { addMarketplaceEntities } from '../../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../../util/data';
import { storableError } from '../../../util/errors';
import { getUserAdmin,getUsersAdmin } from '../../../util/api';
import * as log from '../../../util/log';

const { UUID } = sdkTypes;

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/CommissionPage/SET_INITIAL_STATE';

export const QUERY_USER_SUCCESS = 'app/CommissionPage/QUERY_USER_SUCCESS';
export const QUERY_USER_ERROR = 'app/CommissionPage/QUERY_USER_ERROR';

export const UPDATE_COMMISSION_REQUEST = 'app/CommissionPage/UPDATE_COMMISSION_REQUEST';
export const UPDATE_COMMISSION_SUCCESS = 'app/CommissionPage/UPDATE_COMMISSION_SUCCESS';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  users: [],
  commission: 0,
  userName: '',
  userShowError: null,
  queryListingsError: null,
};

export default function CommissionPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;

//   console.log('CommissionPageReducer');
//   console.log(action);

  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };

    case QUERY_USER_SUCCESS:
      console.log('QUERY_USERS_SUCCESS');
      console.log(payload);
      const userName = payload.userData.attributes.profile.displayName;
      const commission = payload.userData.attributes.profile.metadata.comission ? payload.userData.attributes.profile.metadata.comission:0;
      return { ...state, userName, commission };
    case QUERY_USER_ERROR:
      return { ...state, userListingRefs: [], queryListingsError: payload };

    case UPDATE_COMMISSION_REQUEST:
    return {
        ...state,
        updateInProgress: true,
    };

    case UPDATE_COMMISSION_SUCCESS:
    return {
        ...state,
        updateInProgress: false,
    };
    

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
});

export const queryUserSuccess = userData => ({
  type: QUERY_USER_SUCCESS,
  payload: { userData },
});

export const queryUserError = e => ({
  type: QUERY_USER_ERROR,
  error: true,
  payload: e,
});

// SDK method: sdk.currentUser.updateProfile
export const updateCommissionRequest = params => ({
    type: UPDATE_COMMISSION_REQUEST,
    payload: { params },
  });

export const updateCommissionSuccess = updateResult => ({
    type: UPDATE_COMMISSION_SUCCESS,
    payload: { updateResult },
  });

// ================ Thunks ================ //


export const queryUser = search => (dispatch, getState, sdk) => {
  
  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // dispatch(setInitialState());

  let params = {'search':search};

  return getUserAdmin(params)
  .then(res => {
    return res;
  })
  .then(response => {
    // dispatch(addMarketplaceEntities(response));
    dispatch(queryUserSuccess(response));
  })
  .catch(e => {
    log.error(e, 'create-user-with-idp-failed', { params });
  });

};


export const updateCommission = actionPayload => (dispatch, getState, sdk) =>{
    // dispatch(updateCommissionRequest());
    const  restt = {'fasdfas':'fasgags'};
    console.log('actionPayload');
    console.log(actionPayload);


    return (dispatch, getState, sdk) => {
        dispatch(updateCommissionRequest(restt))
        
        console.log(dispatch);
    }

    return getUsersAdmin(actionPayload)
    .then(res => {
      return res;
    })
    .then(response => {
      // dispatch(addMarketplaceEntities(response));
      dispatch(queryUsersSuccess(response));
    })
    .catch(e => {
      log.error(e, 'create-user-with-idp-failed', { actionPayload });
    });
}


export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const userId = new UUID(params.id);

  console.log(params);

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  dispatch(setInitialState());

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(queryUser(userId)),
    dispatch(updateCommission(userId)),
  ]);
};


