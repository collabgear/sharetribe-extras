import { fetchReferralUsers } from '../../util/api';
import { storableError } from '../../util/errors';
import { isUserAuthorized } from '../../util/userHelpers';

// ================ Action types ================ //

export const FETCH_REFERRAL_USERS_REQUEST = 'app/ReferralsInfoPage/FETCH_REFERRAL_USERS_REQUEST';
export const FETCH_REFERRAL_USERS_SUCCESS = 'app/ReferralsInfoPage/FETCH_REFERRAL_USERS_SUCCESS';
export const FETCH_REFERRAL_USERS_ERROR = 'app/ReferralsInfoPage/FETCH_REFERRAL_USERS_ERROR';

// ================ Reducer ================ //

const initialState = {
  fetchReferralsError: null,
  fetchReferralsInProgress: false,
  referralUser: null,
  refereeUsers: []
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_REFERRAL_USERS_REQUEST:
      return {
        ...state,
        fetchReferralsInProgress: true,
        fetchReferralsError: null,
      };
    case FETCH_REFERRAL_USERS_SUCCESS:
      return {
        ...state,
        fetchReferralsInProgress: false,
        referralUser: payload.referralUser,
        refereeUsers: payload.refereeUsers,
      };
    case FETCH_REFERRAL_USERS_ERROR:
      return { ...state, fetchReferralsInProgress: false, fetchReferralsError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchReferralUsersRequest = () => ({ type: FETCH_REFERRAL_USERS_REQUEST });
export const fetchReferralUsersSuccess = response => ({
  type: FETCH_REFERRAL_USERS_SUCCESS,
  payload: response,
});
export const fetchReferralUsersError = error => ({
  type: FETCH_REFERRAL_USERS_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const fetchReferralUsersInfo = () => (dispatch, getState, sdk) => {
  const state = getState();
  const currentUser = state.user?.currentUser || {};
  const { referralOwnId, referralId } = currentUser?.attributes?.profile?.publicData || {};
  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const canFetchData = isAuthorized && referralOwnId;

  if (!canFetchData) {
    return Promise.resolve();
  }

  const queryParams = { referralOwnId, referralId };

  dispatch( fetchReferralUsersRequest());

  return fetchReferralUsers( queryParams )
    .then( response => {
      dispatch(fetchReferralUsersSuccess( response ))
    })
    .catch(e => {
      dispatch(fetchReferralUsersError(storableError(storableError(e))));
    });
};

export const loadData = () => (dispatch, getState, sdk) => {
  return dispatch( fetchReferralUsersInfo());
};
