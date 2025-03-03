import React from 'react';
import { string, func, bool, shape, oneOfType, arrayOf } from 'prop-types';
import { propTypes } from '../../util/types';
import classNames from 'classnames';
import omit from 'lodash/omit';
import swal from 'sweetalert';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl, intlShape, injectIntl } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { AspectRatioWrapper, NamedLink, ResponsiveImage, IconHeart } from '../../components';

import css from './ListingCard.module.css';

import { FILL_TYPE_EMPTY, FILL_TYPE_FULL, SIZE_SMALL } from '../IconHeart/IconHeart';
import * as validators from '../../util/validators';
import { createResourceLocatorString } from '../../util/routes';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);
  return (
    <div className={css.price}>
      <div className={css.priceValue} title={priceTitle}>
        {formattedPrice}
      </div>
      {isBookable ? (
        <div className={css.perUnit}>
          <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * ListingCardComponent
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCardComponent = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();
  const {
    className,
    rootClassName,
    currentUser,
    listing,
    renderSizes,
    setActiveListing,
    onToggleFavorite,
    showAuthorInfo = true,
    history,
    routeConfiguration,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const { favoriteListingIds = []} = currentUser?.attributes?.profile?.privateData || {};
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const isFavorite = favoriteListingIds.includes( id );
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  const confirmSignIn = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingCard.favoriteSignInTitle"}),
      text: intl.formatMessage({ id: "ListingCard.favoriteSignInText"}),
      icon: "info",
      buttons: [
        intl.formatMessage({ id: "ListingCard.favoriteSignInCancelButton"}),
        intl.formatMessage({ id: "ListingCard.favoriteSignInOkButton"}),
      ],
      showCloseButton: true,
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  };

  const warnMaxFavorites = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingCard.maxFavoritesWarningTitle"}),
      text: intl.formatMessage(
          { id: "ListingCard.maxFavoritesWarningText"},
          { maxFavoritesAmount: config.maxFavoritesAmount }
        ),
      icon: "warning",
      buttons: {
        close: intl.formatMessage({ id: "ListingCard.maxFavoritesWarningButton" }),
      },
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  };

  const toggleFavorite = listingId => {
    if( favoriteListingIds.length >= config.maxFavoritesAmount && !isFavorite ){
      return warnMaxFavorites();
    }

    if( onToggleFavorite ){
      if( currentUser ) {
        onToggleFavorite( listingId, config );
      } else {
        confirmSignIn().then( willSignIn => {
          if( willSignIn ){
            history.push(createResourceLocatorString('LoginPage', routeConfiguration, {}));
          }
        });
      }
    }
  };

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        <div
          title={ intl.formatMessage({
            id: isFavorite ? "ListingCard.removeFromFavoritesHint" : "ListingCard.addToFavoritesHint"
          })}
          className={css.heartIconWrapper}
          onClick={ event => {
            event.preventDefault();
            event.stopPropagation();

            toggleFavorite( id );
          }}
        >
          <IconHeart
            fillType={ isFavorite ? FILL_TYPE_FULL : FILL_TYPE_EMPTY }
            size={SIZE_SMALL}
          />
        </div>
        <LazyImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
          sizes={renderSizes}
        />
      </AspectRatioWrapper>
      <div className={css.info}>
        <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
        <div className={css.mainInfo}>
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
          {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          ) : null}
        </div>
      </div>
    </NamedLink>
  );
};

ListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  setActiveListing: null,
  showAuthorInfo: true,
};

ListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]).isRequired,
  showAuthorInfo: bool,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
  onToggleFavorite: func.isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

export default injectIntl(ListingCardComponent);
