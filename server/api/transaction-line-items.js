const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems } = require('../api-util/lineItemHelpers');

module.exports = (req, res) => {
  const { isOwnListing, listingId, discountCode, orderData } = req.body;

  const sdk = getSdk(req, res);

  const listingPromise = () =>
    isOwnListing
      ? sdk.ownListings.show({
          id: listingId, include: ['author'], 'fields.user': ['profile.privateData']
        })
      : sdk.listings.show({
          id: listingId, include: ['author'], 'fields.user': ['profile.privateData']
        });

  Promise.all([listingPromise(), fetchCommission(sdk)])
    .then(([showListingResponse, fetchAssetsResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];
      const author = showListingResponse.data.included[ 0 ];
      const authorPrivateData = author.attributes.profile.privateData || {};
      const { providerDiscounts = {}} = authorPrivateData;
      const discount = discountCode ? providerDiscounts[ discountCode ] : null;

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      const lineItems = transactionLineItems(
        listing,
        orderData,
        providerCommission,
        customerCommission,
        discount
      );

      // Because we are using returned lineItems directly in this template we need to use the helper function
      // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
      const validLineItems = constructValidLineItems(lineItems);

      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: validLineItems }))
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
