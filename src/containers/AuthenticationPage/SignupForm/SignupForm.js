import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { bool, string, node } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, useIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import { Form, PrimaryButton, FieldTextInput, CustomExtendedDataField } from '../../../components';

import FieldSelectUserType from '../FieldSelectUserType';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import css from './SignupForm.module.css';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{
      userType: props.preselectedUserType || getSoleUserTypeMaybe(props.userTypes),
      referralId: props.referralId,
    }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        preselectedUserType,
        userTypes,
        userFields,
        values,
      } = formRenderProps;

      const { userType } = values || {};

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'SignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'SignupForm.emailInvalid',
        })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );

      // password confirmation
      const passwordConfirmationRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordConfirmationRequired',
      });
      const passwordConfirmationDoesNotMatchMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordConfirmationDoesNotMatch',
        });
      const passwordConfirmationRequired = validators.requiredStringNoTrim( passwordConfirmationRequiredMessage );
      const passwordConfirmationMatch = validators.requiredStringMatch(
        passwordConfirmationDoesNotMatchMessage,
        values.password
      );

      const passwordConfirmationValidators = validators.composeValidators(
        passwordConfirmationRequired,
        passwordConfirmationMatch
      );

      // Custom user fields. Since user types are not supported here,
      // only fields with no user type id limitation are selected.
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, userType);

      const noUserTypes = !userType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes.find(config => config.userType === userType);
      const showDefaultUserFields = userType || noUserTypes;
      const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldSelectUserType
            name="userType"
            userTypes={userTypes}
            hasExistingUserType={!!preselectedUserType}
            intl={intl}
          />

          {showDefaultUserFields ? (
            <div className={css.defaultUserFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={intl.formatMessage({
                  id: 'SignupForm.emailLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.emailPlaceholder',
                })}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />
              <div className={css.name}>
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.firstNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.firstNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.firstNameRequired',
                    })
                  )}
                />
                <FieldTextInput
                  className={css.lastNameRoot}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.lastNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.lastNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.lastNameRequired',
                    })
                  )}
                />
              </div>

              <UserFieldDisplayName
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              <FieldTextInput
                className={css.referralId}
                type="text"
                id={formId ? `${formId}.referralId` : 'referralId'}
                name="referralId"
                label={intl.formatMessage({
                  id: 'SignupForm.referralIdLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.referralIdPlaceholder',
                })}
              />

              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={intl.formatMessage({
                  id: 'SignupForm.passwordLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.passwordPlaceholder',
                })}
                validate={passwordValidators}
              />

              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.passwordConfirmation` : 'Confirmation'}
                name="passwordConfirmation"
                autoComplete="new-password"
                label={intl.formatMessage({
                  id: 'SignupForm.passwordConfirmationLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.passwordConfirmationPlaceholder',
                })}
                validate={passwordConfirmationValidators}
              />

              <UserFieldPhoneNumber
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
          ) : null}

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

SignupFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
  inProgress: false,
  preselectedUserType: null,
  referralId: null,
};

SignupFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  inProgress: bool,
  termsAndConditions: node.isRequired,
  preselectedUserType: string,
  userTypes: propTypes.userTypes.isRequired,
  userFields: propTypes.listingFields.isRequired,
  referralId: string,

  // from injectIntl
  intl: intlShape.isRequired,
};

/**
 * A component that renders the signup form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {ReactNode} props.termsAndConditions - The terms and conditions
 * @param {string} props.preselectedUserType - The preselected user type
 * @param {propTypes.userTypes} props.userTypes - The user types
 * @param {propTypes.listingFields} props.userFields - The user fields
 * @returns {JSX.Element}
 */
const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

// TODO: remove propTypes and defaultProps from all the modified components

SignupFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
  inProgress: false,
  preselectedUserType: null,
  referralId: null,
};

SignupFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  inProgress: bool,
  termsAndConditions: node.isRequired,
  preselectedUserType: string,
  userTypes: propTypes.userTypes.isRequired,
  userFields: propTypes.listingFields.isRequired,
  referralId: string,

  // from injectIntl
  intl: intlShape.isRequired,
};

SignupForm.displayName = 'SignupForm';

export default SignupForm;

