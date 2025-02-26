import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactImageGallery from 'react-image-gallery';
import swal from 'sweetalert';

import { propTypes } from '../../../util/types';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { useConfiguration } from '../../../context/configurationContext';
import {
  AspectRatioWrapper,
  Button,
  IconClose,
  IconArrowHead,
  ResponsiveImage,
  IconHeart,
} from '../../../components';
import { createResourceLocatorString } from '../../../util/routes';

// Copied directly from
// `node_modules/react-image-gallery/styles/css/image-gallery.css`. The
// copied file is left unedited, and all the overrides are defined in
// the component CSS file below.
import './image-gallery.css';

import css from './ListingImageGallery.module.css';

import { FILL_TYPE_EMPTY, FILL_TYPE_FULL, SIZE_BIG } from '../../../components/IconHeart/IconHeart';

const IMAGE_GALLERY_OPTIONS = {
  showPlayButton: false,
  disableThumbnailScroll: true,
};
const MAX_LANDSCAPE_ASPECT_RATIO = 2; // 2:1
const MAX_PORTRAIT_ASPECT_RATIO = 4 / 3;

const getFirstImageAspectRatio = (firstImage, scaledVariant) => {
  if (!firstImage) {
    return { aspectWidth: 1, aspectHeight: 1 };
  }

  const v = firstImage?.attributes?.variants?.[scaledVariant];
  const w = v?.width;
  const h = v?.height;
  const hasDimensions = !!w && !!h;
  const aspectRatio = w / h;

  // We keep the fractions separated as these are given to AspectRatioWrapper
  // which expects separate width and height
  return hasDimensions && aspectRatio >= MAX_LANDSCAPE_ASPECT_RATIO
    ? { aspectWidth: 2, aspectHeight: 1 }
    : hasDimensions && aspectRatio <= MAX_PORTRAIT_ASPECT_RATIO
    ? { aspectWidth: 4, aspectHeight: 3 }
    : hasDimensions
    ? { aspectWidth: w, aspectHeight: h }
    : { aspectWidth: 1, aspectHeight: 1 };
};

const ListingImageGallery = props => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const config = useConfiguration();
  const {
    intl, rootClassName, className, images, imageVariants, thumbnailVariants,
    listing, currentUser, history, routeConfiguration, onToggleFavorite,
  } = props;
  const { favoriteListingIds = []} = currentUser?.attributes?.profile?.privateData || {};
  const isFavorite = favoriteListingIds.includes( listing.id.uuid );
  const thumbVariants = thumbnailVariants || imageVariants;
  // imageVariants are scaled variants.
  const { aspectWidth, aspectHeight } = getFirstImageAspectRatio(images?.[0], imageVariants[0]);
  const items = images.map((img, i) => {
    return {
      // We will only use the image resource, but react-image-gallery
      // requires the `original` key from each item.
      original: '',
      alt: intl.formatMessage(
        { id: 'ListingImageGallery.imageAltText' },
        { index: i + 1, count: images.length }
      ),
      thumbAlt: intl.formatMessage(
        { id: 'ListingImageGallery.imageThumbnailAltText' },
        { index: i + 1, count: images.length }
      ),
      thumbnail: img.attributes?.variants?.[thumbVariants[0]],
      image: img,
    };
  });
  const imageSizesMaybe = isFullscreen
    ? {}
    : { sizes: `(max-width: 1024px) 100vw, (max-width: 1200px) calc(100vw - 192px), 708px` };

  const confirmSignIn = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingPage.favoriteSignInTitle" }),
      text: intl.formatMessage({ id: "ListingPage.favoriteSignInText" }),
      icon: "info",
      buttons: [
        intl.formatMessage({ id: "ListingPage.favoriteSignInCancelButton" }),
        intl.formatMessage({ id: "ListingPage.favoriteSignInOkButton" }),
      ],
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  };

  const warnMaxFavorites = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingPage.maxFavoritesWarningTitle"}),
      text: intl.formatMessage(
        { id: "ListingPage.maxFavoritesWarningText"},
        { maxFavoritesAmount: config.maxFavoritesAmount }
      ),
      icon: "warning",
      buttons: {
        close: intl.formatMessage({ id: "ListingPage.maxFavoritesWarningButton" }),
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
        onToggleFavorite( listingId );
      } else {
        confirmSignIn.then( willSignIn => {
          if( willSignIn ){
            history.push(createResourceLocatorString('LoginPage', routeConfiguration, {}));
          }
        });
      }
    }
  };

  const favoritesMark = (
    <div
      title={ intl.formatMessage({
        id: isFavorite ? "ListingPage.removeFromFavoritesHint" : "ListingPage.addToFavoritesHint"
      })}
      className={css.heartIconWrapper}
      onClick={ event => {
        event.preventDefault();
        event.stopPropagation();

        toggleFavorite( listing.id.uuid );
      }}
    >
      <IconHeart
        fillType={ isFavorite ? FILL_TYPE_FULL : FILL_TYPE_EMPTY }
        size={SIZE_BIG}
      />
    </div>
  );

  const renderItem = item => {
    return (
      <>
        {favoritesMark}
        <AspectRatioWrapper
          width={aspectWidth || 1}
          height={aspectHeight || 1}
          className={isFullscreen ? css.itemWrapperFullscreen : css.itemWrapper}
        >
          <div className={css.itemCentering}>
            <ResponsiveImage
              rootClassName={css.item}
              image={item.image}
              alt={item.alt}
              variants={imageVariants}
              {...imageSizesMaybe}
            />
          </div>
        </AspectRatioWrapper>
      </>
    );
  };
  const renderThumbInner = item => {
    return (
      <div>
        <ResponsiveImage
          rootClassName={css.thumb}
          image={item.image}
          alt={item.thumbAlt}
          variants={thumbVariants}
          sizes="88px"
        />
      </div>
    );
  };

  const onScreenChange = isFull => {
    setIsFullscreen(isFull);
  };

  const renderLeftNav = (onClick, disabled) => {
    return (
      <button className={css.navLeft} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="left" size="big" />
        </div>
      </button>
    );
  };
  const renderRightNav = (onClick, disabled) => {
    return (
      <button className={css.navRight} disabled={disabled} onClick={onClick}>
        <div className={css.navArrowWrapper}>
          <IconArrowHead direction="right" size="big" />
        </div>
      </button>
    );
  };
  const renderFullscreenButton = (onClick, isFullscreen) => {
    return isFullscreen ? (
      <Button
        onClick={onClick}
        rootClassName={css.close}
        title={intl.formatMessage({ id: 'ListingImageGallery.closeModalTitle' })}
      >
        <span className={css.closeText}>
          <FormattedMessage id="ListingImageGallery.closeModal" />
        </span>
        <IconClose rootClassName={css.closeIcon} />
      </Button>
    ) : (
      <button className={css.openFullscreen} onClick={onClick}>
        <FormattedMessage
          id="ListingImageGallery.viewImagesButton"
          values={{ count: images.length }}
        />
      </button>
    );
  };

  if (items.length === 0) {
    return <ResponsiveImage className={css.noImage} image={null} variants={[]} alt="" />;
  }

  const classes = classNames(rootClassName || css.root, className);

  return (
    <>
      <ReactImageGallery
        additionalClass={classes}
        items={items}
        renderItem={renderItem}
        renderThumbInner={renderThumbInner}
        onScreenChange={onScreenChange}
        renderLeftNav={renderLeftNav}
        renderRightNav={renderRightNav}
        renderFullscreenButton={renderFullscreenButton}
        {...IMAGE_GALLERY_OPTIONS}
      />
    </>
  );
};

ListingImageGallery.defaultProps = {
  rootClassName: null,
  className: null,
  thumbnailVariants: null,
};

const { string, arrayOf, oneOfType, shape, func } = PropTypes;

ListingImageGallery.propTypes = {
  rootClassName: string,
  className: string,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]).isRequired,
  currentUser: propTypes.currentUser,
  images: arrayOf(propTypes.image).isRequired,
  imageVariants: arrayOf(string).isRequired,
  thumbnailVariants: arrayOf(string),

  // from injectIntl
  intl: intlShape.isRequired,

  onToggleFavorite: func.isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

export default injectIntl(ListingImageGallery);
